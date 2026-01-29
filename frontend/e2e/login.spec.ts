import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test.describe('Page Layout', () => {
    test('should display login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.locator('form').getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should have link to registration page', async ({ page }) => {
      await expect(page.getByRole('link', { name: /create one/i })).toBeVisible()
    })

    test('should navigate to register page when clicking create account link', async ({ page }) => {
      await page.getByRole('link', { name: /create one/i }).click()
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('Form Validation', () => {
    test('should show error for empty email', async ({ page }) => {
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      await expect(page.getByText(/email is required/i)).toBeVisible()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      await expect(page.getByText(/invalid email format/i)).toBeVisible()
    })

    test('should show error for empty password', async ({ page }) => {
      await page.getByLabel(/email/i).fill('test@ua.pt')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      await expect(page.getByText(/password is required/i)).toBeVisible()
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

  test.describe('Loading State', () => {
    test('should disable form during submission', async ({ page }) => {
      // Intercept API calls to control timing and prevent actual network errors
      await page.route('**/api/auth/login', async (route) => {
        // Delay the response to observe loading state
        await new Promise((resolve) => setTimeout(resolve, 500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            email: 'test@ua.pt',
            name: 'Test User',
            role: 'VOLUNTEER',
            token: 'mock-token',
          }),
        })
      })

      await page.getByLabel(/email/i).fill('test@ua.pt')
      await page.getByLabel(/password/i).fill('SecurePass123')

      // Click submit
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      // Button should show loading state
      await expect(page.getByRole('button', { name: /signing in/i })).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible form labels', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i)
      const passwordInput = page.getByLabel(/password/i)

      await expect(emailInput).toHaveAttribute('id', 'email')
      await expect(passwordInput).toHaveAttribute('id', 'password')
    })

    test('should have required field indicators', async ({ page }) => {
      // Check for asterisks or "required" indicators
      const requiredIndicators = page.locator('span.text-error:has-text("*")')
      await expect(requiredIndicators).toHaveCount(2) // email, password
    })

    test('should show error messages with role alert', async ({ page }) => {
      // Intercept API calls to simulate error
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            status: 401,
            error: 'Unauthorized',
            message: 'Invalid credentials',
          }),
        })
      })

      await page.getByLabel(/email/i).fill('test@ua.pt')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      // Error should be visible in an alert
      const errorAlert = page.locator('[role="alert"]')
      await expect(errorAlert).toBeVisible()
    })
  })
})
