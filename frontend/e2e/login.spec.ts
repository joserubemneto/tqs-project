import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

test.describe('User Login', () => {
  test.describe('Navigation', () => {
    test('should navigate to register page when clicking create account link', async ({ page }) => {
      await page.goto('/login')
      await page.getByRole('link', { name: /create one/i }).click()
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Successful Login', () => {
    // These tests require a running backend
    // Run with: E2E_INTEGRATION=true pnpm test:e2e
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test('should login successfully with valid credentials', async ({ page }) => {
      // First register a user
      await page.goto('/register')
      const uniqueEmail = `login-test-${Date.now()}@ua.pt`

      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill(uniqueEmail)
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()

      // Should redirect to home page on success
      await expect(page).toHaveURL('/')

      // Now logout (clear token) and go to login
      await page.evaluate(() => localStorage.removeItem('auth_token'))
      await page.goto('/login')

      // Login with the same credentials
      await page.getByLabel(/email/i).fill(uniqueEmail)
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      // Should redirect to home page on success
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Error Handling', () => {
    // These tests require a running backend
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('nonexistent@ua.pt')
      await page.getByLabel(/password/i).fill('WrongPassword123')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      await expect(page.getByText(/invalid credentials/i)).toBeVisible()
    })

    test('should show error for wrong password', async ({ page }) => {
      // First register a user
      await page.goto('/register')
      const uniqueEmail = `wrong-pass-test-${Date.now()}@ua.pt`

      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill(uniqueEmail)
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page).toHaveURL('/')

      // Now logout and try to login with wrong password
      await page.evaluate(() => localStorage.removeItem('auth_token'))
      await page.goto('/login')

      await page.getByLabel(/email/i).fill(uniqueEmail)
      await page.getByLabel(/password/i).fill('WrongPassword')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      await expect(page.getByText(/invalid credentials/i)).toBeVisible()
    })
  })
})
