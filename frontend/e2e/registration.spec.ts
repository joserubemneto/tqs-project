import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

test.describe('User Registration', () => {
  test.describe('Successful Registration', () => {
    // These tests require a running backend
    // Run with: E2E_INTEGRATION=true pnpm test:e2e
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test('should register successfully with valid data', async ({ page }) => {
      await page.goto('/register')
      const uniqueEmail = `test-${Date.now()}@ua.pt`

      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill(uniqueEmail)
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()

      // Should redirect to home page on success
      await expect(page).toHaveURL('/')
    })

    test('should register with PROMOTER role', async ({ page }) => {
      await page.goto('/register')
      const uniqueEmail = `promoter-${Date.now()}@ua.pt`

      await page.getByLabel(/name/i).fill('Promoter User')
      await page.getByLabel(/email/i).fill(uniqueEmail)
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.locator('select[name="role"]').selectOption('PROMOTER')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Error Handling', () => {
    // These tests require a running backend with pre-seeded data
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register')
      // First, register a user
      const existingEmail = `existing-${Date.now()}@ua.pt`
      await page.getByLabel(/name/i).fill('First User')
      await page.getByLabel(/email/i).fill(existingEmail)
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()
      await expect(page).toHaveURL('/')

      // Navigate back to register and try the same email
      await page.goto('/register')
      await page.getByLabel(/name/i).fill('Another User')
      await page.getByLabel(/email/i).fill(existingEmail)
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/email already registered/i)).toBeVisible()
    })
  })
})
