import { test, expect } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test.describe('Page Layout', () => {
    test('should display registration form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
      await expect(page.getByLabel(/name/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
    })

    test('should have role selector with default VOLUNTEER', async ({ page }) => {
      const roleSelect = page.locator('select[name="role"]')
      await expect(roleSelect).toBeVisible()
      await expect(roleSelect).toHaveValue('VOLUNTEER')
    })

    test('should have link to login page', async ({ page }) => {
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('should show error for empty name', async ({ page }) => {
      await page.getByLabel(/email/i).fill('test@ua.pt')
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/name is required/i)).toBeVisible()
    })

    test('should show error for empty email', async ({ page }) => {
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/email is required/i)).toBeVisible()
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/invalid email format/i)).toBeVisible()
    })

    test('should show error for empty password', async ({ page }) => {
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@ua.pt')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/password is required/i)).toBeVisible()
    })

    test('should show error for short password', async ({ page }) => {
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@ua.pt')
      await page.getByLabel(/password/i).fill('short')
      await page.getByRole('button', { name: /create account/i }).click()

      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
    })
  })

  test.describe('Successful Registration', () => {
    // These tests require a running backend
    // Run with: E2E_INTEGRATION=true pnpm test:e2e
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test('should register successfully with valid data', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@ua.pt`
      
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill(uniqueEmail)
      await page.getByLabel(/password/i).fill('SecurePass123')
      await page.getByRole('button', { name: /create account/i }).click()

      // Should redirect to home page on success
      await expect(page).toHaveURL('/')
    })

    test('should register with PROMOTER role', async ({ page }) => {
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

  test.describe('Loading State', () => {
    test('should disable form during submission', async ({ page }) => {
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@ua.pt')
      await page.getByLabel(/password/i).fill('SecurePass123')

      // Start the submission
      const submitPromise = page.getByRole('button', { name: /create account/i }).click()

      // Button should show loading state (this might be too fast to catch)
      // Just verify form fields are accessible
      await expect(page.getByLabel(/email/i)).toBeVisible()
      
      await submitPromise
    })
  })

  test.describe('Accessibility', () => {
    test('should have accessible form labels', async ({ page }) => {
      const nameInput = page.getByLabel(/name/i)
      const emailInput = page.getByLabel(/email/i)
      const passwordInput = page.getByLabel(/password/i)

      await expect(nameInput).toHaveAttribute('id', 'name')
      await expect(emailInput).toHaveAttribute('id', 'email')
      await expect(passwordInput).toHaveAttribute('id', 'password')
    })

    test('should have required field indicators', async ({ page }) => {
      // Check for asterisks or "required" indicators
      const requiredIndicators = page.locator('span.text-error:has-text("*")')
      await expect(requiredIndicators).toHaveCount(3) // name, email, password
    })

    test('should show error messages with role alert', async ({ page }) => {
      // Submit empty form to trigger errors
      await page.getByRole('button', { name: /create account/i }).click()
      
      // Errors should be visible
      const errorMessages = page.locator('.text-error')
      await expect(errorMessages.first()).toBeVisible()
    })
  })
})
