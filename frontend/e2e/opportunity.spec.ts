import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

test.describe('Create Opportunity', () => {
  test.describe('Authentication and Authorization', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
      // Clear any existing auth token
      await page.goto('/')
      await page.evaluate(() => localStorage.removeItem('auth_token'))

      // Try to access create opportunity page
      await page.goto('/opportunities/create')

      // Should redirect to login
      await expect(page).toHaveURL('/login')
    })

    test('should redirect volunteers to home page', async ({ page }) => {
      // Set a mock volunteer token (simplified JWT structure)
      const volunteerPayload = btoa(
        JSON.stringify({ id: 1, email: 'volunteer@ua.pt', role: 'VOLUNTEER' }),
      )
      const mockVolunteerToken = `header.${volunteerPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockVolunteerToken)

      // Try to access create opportunity page
      await page.goto('/opportunities/create')

      // Should redirect to home
      await expect(page).toHaveURL('/')
    })

    test('should allow promoters to access the page', async ({ page }) => {
      // Mock skills API
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
          ]),
        })
      })

      // Set a mock promoter token
      const promoterPayload = btoa(
        JSON.stringify({ id: 1, email: 'promoter@ua.pt', role: 'PROMOTER' }),
      )
      const mockPromoterToken = `header.${promoterPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockPromoterToken)

      await page.goto('/opportunities/create')

      // Should see the form
      await expect(
        page.getByRole('heading', { name: /create opportunity/i, level: 1 }),
      ).toBeVisible()
    })
  })

  test.describe('Page Layout', () => {
    test.beforeEach(async ({ page }) => {
      // Mock skills API
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

      // Set a mock promoter token
      const promoterPayload = btoa(
        JSON.stringify({ id: 1, email: 'promoter@ua.pt', role: 'PROMOTER' }),
      )
      const mockPromoterToken = `header.${promoterPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockPromoterToken)
      await page.goto('/opportunities/create')
    })

    test('should display create opportunity form', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /create opportunity/i, level: 1 }),
      ).toBeVisible()
    })

    test('should display all form fields', async ({ page }) => {
      await expect(page.getByLabel(/title/i)).toBeVisible()
      await expect(page.getByLabel(/description/i)).toBeVisible()
      await expect(page.getByLabel(/points reward/i)).toBeVisible()
      await expect(page.getByLabel(/max volunteers/i)).toBeVisible()
      await expect(page.getByLabel(/start date/i)).toBeVisible()
      await expect(page.getByLabel(/end date/i)).toBeVisible()
      await expect(page.getByLabel(/location/i)).toBeVisible()
    })

    test('should display available skills', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Communication' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Leadership' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Programming' })).toBeVisible()
    })

    test('should display create button', async ({ page }) => {
      await expect(
        page.locator('form').getByRole('button', { name: /create opportunity/i }),
      ).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
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
          ]),
        })
      })

      const promoterPayload = btoa(
        JSON.stringify({ id: 1, email: 'promoter@ua.pt', role: 'PROMOTER' }),
      )
      const mockPromoterToken = `header.${promoterPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockPromoterToken)
      await page.goto('/opportunities/create')
    })

    test('should show error for empty title', async ({ page }) => {
      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      await expect(page.getByText(/title is required/i)).toBeVisible()
    })

    test('should show error for empty description', async ({ page }) => {
      await page.getByLabel(/title/i).fill('Test Opportunity')
      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      await expect(page.getByText(/description is required/i)).toBeVisible()
    })

    test('should show error for no skills selected', async ({ page }) => {
      // Fill in all required fields except skills
      await page.getByLabel(/title/i).fill('Test Opportunity')
      await page.getByLabel(/description/i).fill('Test Description')
      await page.getByLabel(/points reward/i).fill('50')
      await page.getByLabel(/max volunteers/i).fill('10')

      // Set dates
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      await page.getByLabel(/start date/i).fill(startDate.toISOString().slice(0, 16))
      await page.getByLabel(/end date/i).fill(endDate.toISOString().slice(0, 16))

      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      await expect(page.getByText(/at least one skill is required/i)).toBeVisible()
    })

    test('should show error when end date is before start date', async ({ page }) => {
      await page.getByLabel(/title/i).fill('Test Opportunity')
      await page.getByLabel(/description/i).fill('Test Description')
      await page.getByLabel(/points reward/i).fill('50')
      await page.getByLabel(/max volunteers/i).fill('10')

      // Set end date before start date
      const laterDate = new Date()
      laterDate.setDate(laterDate.getDate() + 7)
      const earlierDate = new Date()
      earlierDate.setDate(earlierDate.getDate() + 1)

      await page.getByLabel(/start date/i).fill(laterDate.toISOString().slice(0, 16))
      await page.getByLabel(/end date/i).fill(earlierDate.toISOString().slice(0, 16))

      await page.getByRole('button', { name: 'Communication' }).click()
      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      await expect(page.getByText(/end date must be after start date/i)).toBeVisible()
    })

    test('should show error when max volunteers is 0', async ({ page }) => {
      await page.getByLabel(/title/i).fill('Test Opportunity')
      await page.getByLabel(/description/i).fill('Test Description')
      await page.getByLabel(/points reward/i).fill('50')
      await page.getByLabel(/max volunteers/i).fill('0')

      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      await expect(page.getByText(/max volunteers must be at least 1/i)).toBeVisible()
    })
  })

  test.describe('Skill Selection', () => {
    test.beforeEach(async ({ page }) => {
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

      const promoterPayload = btoa(
        JSON.stringify({ id: 1, email: 'promoter@ua.pt', role: 'PROMOTER' }),
      )
      const mockPromoterToken = `header.${promoterPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockPromoterToken)
      await page.goto('/opportunities/create')
    })

    test('should toggle skill selection', async ({ page }) => {
      const communicationBtn = page.getByRole('button', { name: 'Communication' })

      // Initially not selected (no bg-primary-500 class)
      await expect(communicationBtn).not.toHaveClass(/bg-primary-500/)

      // Click to select
      await communicationBtn.click()
      await expect(communicationBtn).toHaveClass(/bg-primary-500/)

      // Click to deselect
      await communicationBtn.click()
      await expect(communicationBtn).not.toHaveClass(/bg-primary-500/)
    })

    test('should allow selecting multiple skills', async ({ page }) => {
      await page.getByRole('button', { name: 'Communication' }).click()
      await page.getByRole('button', { name: 'Leadership' }).click()

      await expect(page.getByRole('button', { name: 'Communication' })).toHaveClass(
        /bg-primary-500/,
      )
      await expect(page.getByRole('button', { name: 'Leadership' })).toHaveClass(/bg-primary-500/)
    })
  })

  test.describe('Form Submission', () => {
    test.beforeEach(async ({ page }) => {
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
          ]),
        })
      })

      const promoterPayload = btoa(
        JSON.stringify({ id: 1, email: 'promoter@ua.pt', role: 'PROMOTER' }),
      )
      const mockPromoterToken = `header.${promoterPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockPromoterToken)
      await page.goto('/opportunities/create')
    })

    test('should show success message on successful creation', async ({ page }) => {
      // Mock the create opportunity API
      await page.route('**/api/opportunities', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              title: 'UA Open Day Support',
              description: 'Help with university open day activities',
              pointsReward: 50,
              startDate: '2024-02-01T09:00:00Z',
              endDate: '2024-02-07T17:00:00Z',
              maxVolunteers: 10,
              status: 'DRAFT',
              location: 'University Campus',
              promoter: {
                id: 1,
                email: 'promoter@ua.pt',
                name: 'Promoter',
                role: 'PROMOTER',
                points: 0,
                createdAt: '2024-01-01T00:00:00Z',
              },
              requiredSkills: [{ id: 1, name: 'Communication', category: 'COMMUNICATION' }],
              createdAt: '2024-01-15T00:00:00Z',
            }),
          })
        } else {
          await route.continue()
        }
      })

      // Fill in the form
      await page.getByLabel(/title/i).fill('UA Open Day Support')
      await page.getByLabel(/description/i).fill('Help with university open day activities')
      await page.getByLabel(/points reward/i).fill('50')
      await page.getByLabel(/max volunteers/i).fill('10')

      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      await page.getByLabel(/start date/i).fill(startDate.toISOString().slice(0, 16))
      await page.getByLabel(/end date/i).fill(endDate.toISOString().slice(0, 16))
      await page.getByLabel(/location/i).fill('University Campus')
      await page.getByRole('button', { name: 'Communication' }).click()

      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      await expect(page.getByText(/opportunity created successfully/i)).toBeVisible()
    })

    test('should reset form after successful creation', async ({ page }) => {
      await page.route('**/api/opportunities', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              title: 'Test',
              description: 'Test',
              pointsReward: 50,
              startDate: '2024-02-01T09:00:00Z',
              endDate: '2024-02-07T17:00:00Z',
              maxVolunteers: 10,
              status: 'DRAFT',
              promoter: {
                id: 1,
                email: 'p@ua.pt',
                name: 'P',
                role: 'PROMOTER',
                points: 0,
                createdAt: '',
              },
              requiredSkills: [{ id: 1, name: 'Communication', category: 'COMMUNICATION' }],
              createdAt: '2024-01-15T00:00:00Z',
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.getByLabel(/title/i).fill('Test Opportunity')
      await page.getByLabel(/description/i).fill('Test Description')
      await page.getByLabel(/points reward/i).fill('50')
      await page.getByLabel(/max volunteers/i).fill('10')

      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      await page.getByLabel(/start date/i).fill(startDate.toISOString().slice(0, 16))
      await page.getByLabel(/end date/i).fill(endDate.toISOString().slice(0, 16))
      await page.getByRole('button', { name: 'Communication' }).click()

      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      await expect(page.getByText(/opportunity created successfully/i)).toBeVisible()

      // Check that form is reset
      await expect(page.getByLabel(/title/i)).toHaveValue('')
      await expect(page.getByLabel(/description/i)).toHaveValue('')
    })

    test('should show loading state during submission', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/opportunities', async (route) => {
        if (route.request().method() === 'POST') {
          await new Promise((resolve) => setTimeout(resolve, 500))
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 1,
              title: 'Test',
              description: 'Test',
              pointsReward: 50,
              startDate: '2024-02-01T09:00:00Z',
              endDate: '2024-02-07T17:00:00Z',
              maxVolunteers: 10,
              status: 'DRAFT',
              promoter: {
                id: 1,
                email: 'p@ua.pt',
                name: 'P',
                role: 'PROMOTER',
                points: 0,
                createdAt: '',
              },
              requiredSkills: [{ id: 1, name: 'Communication', category: 'COMMUNICATION' }],
              createdAt: '2024-01-15T00:00:00Z',
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.getByLabel(/title/i).fill('Test')
      await page.getByLabel(/description/i).fill('Test')
      await page.getByLabel(/points reward/i).fill('50')
      await page.getByLabel(/max volunteers/i).fill('10')

      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      await page.getByLabel(/start date/i).fill(startDate.toISOString().slice(0, 16))
      await page.getByLabel(/end date/i).fill(endDate.toISOString().slice(0, 16))
      await page.getByRole('button', { name: 'Communication' }).click()

      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      // Should show loading state
      await expect(page.getByRole('button', { name: /creating/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /creating/i })).toBeDisabled()
    })

    test('should show error on API failure', async ({ page }) => {
      await page.route('**/api/opportunities', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              timestamp: '2024-01-01T00:00:00Z',
              status: 400,
              error: 'Bad Request',
              message: 'End date must be after start date',
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.getByLabel(/title/i).fill('Test')
      await page.getByLabel(/description/i).fill('Test')
      await page.getByLabel(/points reward/i).fill('50')
      await page.getByLabel(/max volunteers/i).fill('10')

      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      await page.getByLabel(/start date/i).fill(startDate.toISOString().slice(0, 16))
      await page.getByLabel(/end date/i).fill(endDate.toISOString().slice(0, 16))
      await page.getByRole('button', { name: 'Communication' }).click()

      await page
        .locator('form')
        .getByRole('button', { name: /create opportunity/i })
        .click()

      await expect(page.getByRole('alert')).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('should show Create Opportunity button for promoters in header', async ({ page }) => {
      // Mock auth context
      await page.route('**/api/auth/**', async (route) => {
        await route.continue()
      })

      const promoterPayload = btoa(
        JSON.stringify({ id: 1, email: 'promoter@ua.pt', name: 'Promoter', role: 'PROMOTER' }),
      )
      const mockPromoterToken = `header.${promoterPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockPromoterToken)
      await page.reload()

      // Wait for the header to load
      await page.waitForSelector('nav')

      await expect(
        page.locator('nav').getByRole('link', { name: /create opportunity/i }),
      ).toBeVisible()
    })

    test('should not show Create Opportunity button for volunteers in header', async ({ page }) => {
      const volunteerPayload = btoa(
        JSON.stringify({ id: 1, email: 'volunteer@ua.pt', name: 'Volunteer', role: 'VOLUNTEER' }),
      )
      const mockVolunteerToken = `header.${volunteerPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockVolunteerToken)
      await page.reload()

      await page.waitForSelector('nav')

      await expect(
        page.locator('nav').getByRole('link', { name: /create opportunity/i }),
      ).not.toBeVisible()
    })
  })

  // Integration tests with real backend
  test.describe('Integration Tests', () => {
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    // Helper function to generate unique opportunity title
    const generateUniqueTitle = () => `Test Opportunity ${Date.now()}`

    // Helper function to login as promoter
    async function loginAsPromoter(page: import('@playwright/test').Page) {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('promoter@ua.pt')
      await page.getByLabel(/password/i).fill('password')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()
      await expect(page).toHaveURL('/')
    }

    // Helper function to fill opportunity form
    async function fillOpportunityForm(
      page: import('@playwright/test').Page,
      title: string,
      options?: {
        description?: string
        pointsReward?: string
        maxVolunteers?: string
        location?: string
      },
    ) {
      await page.getByLabel(/title/i).fill(title)
      await page
        .getByLabel(/description/i)
        .fill(options?.description ?? 'Help with university open day activities')
      await page.getByLabel(/points reward/i).fill(options?.pointsReward ?? '50')
      await page.getByLabel(/max volunteers/i).fill(options?.maxVolunteers ?? '10')

      // Set dates (start tomorrow, end in 7 days)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      await page.getByLabel(/start date/i).fill(startDate.toISOString().slice(0, 16))
      await page.getByLabel(/end date/i).fill(endDate.toISOString().slice(0, 16))

      if (options?.location) {
        await page.getByLabel(/location/i).fill(options.location)
      }
    }

    test.describe('Create Opportunity', () => {
      test.beforeEach(async ({ page }) => {
        await loginAsPromoter(page)
        await page.goto('/opportunities/create')
      })

      test('should create opportunity with all fields', async ({ page }) => {
        const uniqueTitle = generateUniqueTitle()

        await fillOpportunityForm(page, uniqueTitle, {
          description: 'Integration test opportunity description',
          pointsReward: '75',
          maxVolunteers: '15',
          location: 'University Campus - Building A',
        })

        // Select a skill
        await page.getByRole('button', { name: 'Communication' }).click()

        // Submit the form
        await page
          .locator('form')
          .getByRole('button', { name: /create opportunity/i })
          .click()

        // Should show success message
        await expect(page.getByText(/opportunity created successfully/i)).toBeVisible()

        // Form should be reset
        await expect(page.getByLabel(/title/i)).toHaveValue('')
      })

      test('should create opportunity with multiple skills', async ({ page }) => {
        const uniqueTitle = generateUniqueTitle()

        await fillOpportunityForm(page, uniqueTitle)

        // Select multiple skills
        await page.getByRole('button', { name: 'Communication' }).click()
        await page.getByRole('button', { name: 'Leadership' }).click()

        await page
          .locator('form')
          .getByRole('button', { name: /create opportunity/i })
          .click()

        await expect(page.getByText(/opportunity created successfully/i)).toBeVisible()
      })

      test('should create opportunity without optional location', async ({ page }) => {
        const uniqueTitle = generateUniqueTitle()

        await fillOpportunityForm(page, uniqueTitle)
        await page.getByRole('button', { name: 'Communication' }).click()
        await page
          .locator('form')
          .getByRole('button', { name: /create opportunity/i })
          .click()

        await expect(page.getByText(/opportunity created successfully/i)).toBeVisible()
      })

      test('should show server validation error for invalid dates', async ({ page }) => {
        const uniqueTitle = generateUniqueTitle()

        await page.getByLabel(/title/i).fill(uniqueTitle)
        await page.getByLabel(/description/i).fill('Test description')
        await page.getByLabel(/points reward/i).fill('50')
        await page.getByLabel(/max volunteers/i).fill('10')

        // Set end date before start date
        const startDate = new Date()
        startDate.setDate(startDate.getDate() + 7)
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 1)

        await page.getByLabel(/start date/i).fill(startDate.toISOString().slice(0, 16))
        await page.getByLabel(/end date/i).fill(endDate.toISOString().slice(0, 16))
        await page.getByRole('button', { name: 'Communication' }).click()

        await page
          .locator('form')
          .getByRole('button', { name: /create opportunity/i })
          .click()

        // Should show validation error
        await expect(page.getByText(/end date must be after start date/i)).toBeVisible()
      })
    })

    test.describe('Authorization', () => {
      test('should not allow volunteers to access create page', async ({ page }) => {
        // Login as volunteer
        await page.goto('/login')
        await page.getByLabel(/email/i).fill('volunteer@ua.pt')
        await page.getByLabel(/password/i).fill('password')
        await page
          .locator('form')
          .getByRole('button', { name: /sign in/i })
          .click()
        await expect(page).toHaveURL('/')

        // Try to access create opportunity page
        await page.goto('/opportunities/create')

        // Should redirect to home
        await expect(page).toHaveURL('/')
      })

      test('should show Create Opportunity link for promoters in nav', async ({ page }) => {
        await loginAsPromoter(page)

        // Should see Create Opportunity link in navigation
        await expect(
          page.locator('nav').getByRole('link', { name: /create opportunity/i }),
        ).toBeVisible()
      })

      test('should not show Create Opportunity link for volunteers in nav', async ({ page }) => {
        // Login as volunteer
        await page.goto('/login')
        await page.getByLabel(/email/i).fill('volunteer@ua.pt')
        await page.getByLabel(/password/i).fill('password')
        await page
          .locator('form')
          .getByRole('button', { name: /sign in/i })
          .click()
        await expect(page).toHaveURL('/')

        // Should NOT see Create Opportunity link
        await expect(
          page.locator('nav').getByRole('link', { name: /create opportunity/i }),
        ).not.toBeVisible()
      })
    })

    test.describe('Navigation Flow', () => {
      test('should navigate to create opportunity from nav link', async ({ page }) => {
        await loginAsPromoter(page)

        await page
          .locator('nav')
          .getByRole('link', { name: /create opportunity/i })
          .click()

        await expect(page).toHaveURL('/opportunities/create')
        await expect(
          page.getByRole('heading', { name: /create opportunity/i, level: 1 }),
        ).toBeVisible()
      })

      test('should load available skills from API', async ({ page }) => {
        await loginAsPromoter(page)
        await page.goto('/opportunities/create')

        // Should display skills fetched from backend
        await expect(page.getByRole('button', { name: 'Communication' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Leadership' })).toBeVisible()
      })
    })

    test.describe('Form Persistence', () => {
      test('should maintain form state during skill selection', async ({ page }) => {
        await loginAsPromoter(page)
        await page.goto('/opportunities/create')

        // Fill form
        await page.getByLabel(/title/i).fill('Persistence Test')
        await page.getByLabel(/description/i).fill('Testing form persistence')
        await page.getByLabel(/points reward/i).fill('100')

        // Select and deselect skills
        await page.getByRole('button', { name: 'Communication' }).click()
        await page.getByRole('button', { name: 'Leadership' }).click()
        await page.getByRole('button', { name: 'Communication' }).click()

        // Form values should persist
        await expect(page.getByLabel(/title/i)).toHaveValue('Persistence Test')
        await expect(page.getByLabel(/description/i)).toHaveValue('Testing form persistence')
        await expect(page.getByLabel(/points reward/i)).toHaveValue('100')
      })
    })
  })
})
