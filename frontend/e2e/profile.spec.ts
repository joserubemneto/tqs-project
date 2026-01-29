import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

test.describe('User Profile', () => {
  test.describe('Authentication', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
      // Clear any existing auth token
      await page.goto('/')
      await page.evaluate(() => localStorage.removeItem('auth_token'))

      // Try to access profile page
      await page.goto('/profile')

      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Successful Update', () => {
    // These tests require a running backend
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test.beforeEach(async ({ page }) => {
      // Login as volunteer
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('volunteer@ua.pt')
      await page.getByLabel(/password/i).fill('password')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      await expect(page).toHaveURL('/')
      await page.goto('/profile')
    })

    test('should update profile successfully', async ({ page }) => {
      const nameInput = page.getByLabel(/name/i)
      await nameInput.clear()
      await nameInput.fill('Updated Volunteer Name')

      await page.getByRole('button', { name: /save profile/i }).click()

      await expect(page.getByText(/profile updated successfully/i)).toBeVisible()
    })

    test('should update bio successfully', async ({ page }) => {
      const bioInput = page.getByLabel(/bio/i)
      await bioInput.clear()
      await bioInput.fill('This is my updated bio')

      await page.getByRole('button', { name: /save profile/i }).click()

      await expect(page.getByText(/profile updated successfully/i)).toBeVisible()
    })

    test('should update skills successfully', async ({ page }) => {
      // Select a new skill
      const leadershipButton = page.getByRole('button', { name: 'Leadership' })
      await leadershipButton.click()

      await page.getByRole('button', { name: /save profile/i }).click()

      await expect(page.getByText(/profile updated successfully/i)).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test('should navigate to profile from nav bar', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('volunteer@ua.pt')
      await page.getByLabel(/password/i).fill('password')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      await expect(page).toHaveURL('/')

      // Click on My Profile link
      await page.getByRole('link', { name: /my profile/i }).click()

      await expect(page).toHaveURL('/profile')
      await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible()
    })

    test('should navigate to profile by clicking avatar', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('volunteer@ua.pt')
      await page.getByLabel(/password/i).fill('password')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()

      await expect(page).toHaveURL('/')

      // Click on avatar (the circular div with initial)
      await page.locator('nav a[href="/profile"] div.rounded-full').click()

      await expect(page).toHaveURL('/profile')
    })
  })
})
