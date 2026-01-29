import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

test.describe('Admin User Management', () => {
  test.describe('Access Control', () => {
    test('should redirect non-admin users to home page', async ({ page }) => {
      // Set up a mock volunteer token
      await page.addInitScript(() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(
          JSON.stringify({
            id: 2,
            email: 'volunteer@ua.pt',
            name: 'Sample Volunteer',
            role: 'VOLUNTEER',
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        )
        const mockToken = `${header}.${payload}.mock-signature`
        localStorage.setItem('auth_token', mockToken)
      })

      await page.goto('/admin/users')

      // Should redirect to home with error query param
      await expect(page).toHaveURL(/\/(\?error=forbidden)?$/)
    })

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/admin/users')

      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Role Update', () => {
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('admin@ua.pt')
      await page.getByLabel(/password/i).fill('password')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()
      await expect(page).toHaveURL('/admin')
    })

    test('should update user role successfully', async ({ page }) => {
      await page.goto('/admin/users')

      // Wait for users to load - use table cell locator
      const table = page.locator('table')
      await expect(table.getByRole('cell', { name: /Sample Volunteer/i })).toBeVisible()

      // Find the row for Sample Volunteer and change their role
      const volunteerRow = page.locator('tr', { hasText: 'volunteer@ua.pt' })
      const roleSelect = volunteerRow.locator('select')

      // Change role to PROMOTER
      await roleSelect.selectOption('PROMOTER')

      // Wait for success notification
      await expect(page.getByText(/successfully updated.*role to promoter/i)).toBeVisible()
    })

    test('should not allow admin to change own role', async ({ page }) => {
      await page.goto('/admin/users')

      // Wait for users to load - use table cell locator
      const table = page.locator('table')
      await expect(table.getByRole('cell', { name: /System Administrator/i })).toBeVisible()

      // Find the admin row
      const adminRow = page.locator('tr', { hasText: 'admin@ua.pt' })

      // Should show "Cannot edit own role" instead of select
      await expect(adminRow.getByText(/cannot edit own role/i)).toBeVisible()
    })
  })
})
