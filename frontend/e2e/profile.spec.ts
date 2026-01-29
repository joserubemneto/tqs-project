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

  test.describe('Page Layout', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication by intercepting the profile API
      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              email: 'volunteer@ua.pt',
              name: 'Sample Volunteer',
              role: 'VOLUNTEER',
              points: 50,
              bio: 'I love volunteering',
              skills: [{ id: 1, name: 'Communication', category: 'COMMUNICATION' }],
              createdAt: '2024-01-01T00:00:00Z',
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.route('**/api/skills', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              name: 'Communication',
              category: 'COMMUNICATION',
              description: 'Effective communication',
            },
            { id: 2, name: 'Leadership', category: 'LEADERSHIP', description: 'Ability to lead' },
            {
              id: 3,
              name: 'Programming',
              category: 'TECHNICAL',
              description: 'Software development',
            },
          ]),
        })
      })

      // Set a mock auth token
      await page.goto('/')
      await page.evaluate(() => localStorage.setItem('auth_token', 'mock-token'))
      await page.goto('/profile')
    })

    test('should display profile form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible()
      await expect(page.getByRole('heading', { name: /edit profile/i })).toBeVisible()
    })

    test('should display name input with current value', async ({ page }) => {
      const nameInput = page.getByLabel(/name/i)
      await expect(nameInput).toBeVisible()
      await expect(nameInput).toHaveValue('Sample Volunteer')
    })

    test('should display bio textarea with current value', async ({ page }) => {
      const bioInput = page.getByLabel(/bio/i)
      await expect(bioInput).toBeVisible()
      await expect(bioInput).toHaveValue('I love volunteering')
    })

    test('should display available skills', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Communication' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Leadership' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Programming' })).toBeVisible()
    })

    test('should display save button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /save profile/i })).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              email: 'volunteer@ua.pt',
              name: 'Sample Volunteer',
              role: 'VOLUNTEER',
              points: 50,
              bio: '',
              skills: [],
              createdAt: '2024-01-01T00:00:00Z',
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.route('**/api/skills', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      })

      await page.goto('/')
      await page.evaluate(() => localStorage.setItem('auth_token', 'mock-token'))
      await page.goto('/profile')
    })

    test('should show error for empty name', async ({ page }) => {
      const nameInput = page.getByLabel(/name/i)
      await nameInput.clear()
      await page.getByRole('button', { name: /save profile/i }).click()

      await expect(page.getByText(/name is required/i)).toBeVisible()
    })

    test('should show error for name that is too short', async ({ page }) => {
      const nameInput = page.getByLabel(/name/i)
      await nameInput.clear()
      await nameInput.fill('A')
      await page.getByRole('button', { name: /save profile/i }).click()

      await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible()
    })
  })

  test.describe('Skill Selection', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              email: 'volunteer@ua.pt',
              name: 'Sample Volunteer',
              role: 'VOLUNTEER',
              points: 50,
              bio: '',
              skills: [],
              createdAt: '2024-01-01T00:00:00Z',
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.route('**/api/skills', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              name: 'Communication',
              category: 'COMMUNICATION',
              description: 'Effective communication',
            },
            { id: 2, name: 'Leadership', category: 'LEADERSHIP', description: 'Ability to lead' },
          ]),
        })
      })

      await page.goto('/')
      await page.evaluate(() => localStorage.setItem('auth_token', 'mock-token'))
      await page.goto('/profile')
    })

    test('should toggle skill selection on click', async ({ page }) => {
      const communicationButton = page.getByRole('button', { name: 'Communication' })

      // Initially not selected (no primary background)
      await expect(communicationButton).not.toHaveClass(/bg-primary-500/)

      // Click to select
      await communicationButton.click()
      await expect(communicationButton).toHaveClass(/bg-primary-500/)

      // Click to deselect
      await communicationButton.click()
      await expect(communicationButton).not.toHaveClass(/bg-primary-500/)
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

  test.describe('Loading State', () => {
    test('should show loading indicator while fetching profile', async ({ page }) => {
      // Delay the profile response
      await page.route('**/api/profile', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            email: 'volunteer@ua.pt',
            name: 'Sample Volunteer',
            role: 'VOLUNTEER',
            points: 50,
            bio: '',
            skills: [],
            createdAt: '2024-01-01T00:00:00Z',
          }),
        })
      })

      await page.route('**/api/skills', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      })

      await page.goto('/')
      await page.evaluate(() => localStorage.setItem('auth_token', 'mock-token'))
      await page.goto('/profile')

      await expect(page.getByText(/loading profile/i)).toBeVisible()
    })

    test('should disable form during submission', async ({ page }) => {
      await page.route('**/api/profile', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              email: 'volunteer@ua.pt',
              name: 'Sample Volunteer',
              role: 'VOLUNTEER',
              points: 50,
              bio: '',
              skills: [],
              createdAt: '2024-01-01T00:00:00Z',
            }),
          })
        } else if (route.request().method() === 'PUT') {
          await new Promise((resolve) => setTimeout(resolve, 500))
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              email: 'volunteer@ua.pt',
              name: 'Sample Volunteer',
              role: 'VOLUNTEER',
              points: 50,
              bio: '',
              skills: [],
              createdAt: '2024-01-01T00:00:00Z',
            }),
          })
        }
      })

      await page.route('**/api/skills', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      })

      await page.goto('/')
      await page.evaluate(() => localStorage.setItem('auth_token', 'mock-token'))
      await page.goto('/profile')

      // Wait for form to load
      await expect(page.getByLabel(/name/i)).toBeVisible()

      await page.getByRole('button', { name: /save profile/i }).click()

      // Button should show saving state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/profile', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            email: 'volunteer@ua.pt',
            name: 'Sample Volunteer',
            role: 'VOLUNTEER',
            points: 50,
            bio: '',
            skills: [],
            createdAt: '2024-01-01T00:00:00Z',
          }),
        })
      })

      await page.route('**/api/skills', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      })

      await page.goto('/')
      await page.evaluate(() => localStorage.setItem('auth_token', 'mock-token'))
      await page.goto('/profile')
    })

    test('should have accessible form labels', async ({ page }) => {
      const nameInput = page.getByLabel(/name/i)
      const bioInput = page.getByLabel(/bio/i)

      await expect(nameInput).toHaveAttribute('id', 'name')
      await expect(bioInput).toHaveAttribute('id', 'bio')
    })

    test('should have required field indicator for name', async ({ page }) => {
      const requiredIndicators = page.locator('span.text-error:has-text("*")')
      await expect(requiredIndicators.first()).toBeVisible()
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
