import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

// Backend API URL for direct API calls (e.g., test reset)
const API_URL = process.env.API_URL || 'http://localhost:8080'

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
      // Reset database before each test to ensure clean state
      // This is important because other tests may modify user roles
      test.beforeEach(async ({ request }) => {
        await request.post(`${API_URL}/api/test/reset`)
      })

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
  })
})

// E2E tests for View Opportunities List focus on public access and integration tests
// Page layout, opportunities display, empty state, error handling, pagination, and filters are covered by unit tests
test.describe('View Opportunities List', () => {
  const mockPageResponse = {
    content: [
      {
        id: 1,
        title: 'UA Open Day Support',
        description: 'Help with university open day activities.',
        pointsReward: 50,
        startDate: '2024-02-01T09:00:00Z',
        endDate: '2024-02-07T17:00:00Z',
        maxVolunteers: 10,
        status: 'OPEN',
        location: 'University Campus',
        promoter: {
          id: 1,
          email: 'promoter@ua.pt',
          name: 'Promoter User',
          role: 'PROMOTER',
          points: 0,
          createdAt: '2024-01-01T00:00:00Z',
        },
        requiredSkills: [
          { id: 1, name: 'Communication', category: 'COMMUNICATION', description: 'Communication' },
        ],
        createdAt: '2024-01-15T00:00:00Z',
      },
    ],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
  }

  test.describe('Public Access', () => {
    test('should be accessible without authentication', async ({ page }) => {
      await page.route('**/api/opportunities*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPageResponse),
        })
      })

      // Clear any existing auth token
      await page.goto('/')
      await page.evaluate(() => localStorage.removeItem('auth_token'))

      await page.goto('/opportunities')

      // Should not redirect to login
      await expect(page).toHaveURL('/opportunities')
      await expect(page.getByRole('heading', { name: /volunteering opportunities/i })).toBeVisible()
    })

    test('should also work with authentication', async ({ page }) => {
      await page.route('**/api/opportunities*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPageResponse),
        })
      })

      // Set a mock volunteer token
      const volunteerPayload = btoa(
        JSON.stringify({ id: 1, email: 'volunteer@ua.pt', role: 'VOLUNTEER' }),
      )
      const mockVolunteerToken = `header.${volunteerPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockVolunteerToken)

      await page.goto('/opportunities')

      await expect(page.getByRole('heading', { name: /volunteering opportunities/i })).toBeVisible()
    })
  })

  if (isIntegration) {
    test.describe('Integration Tests', () => {
      test.beforeEach(async () => {
        // Reset test data via the test reset endpoint
        await fetch(`${API_URL}/api/test/reset`, { method: 'POST' })
      })

      test('should display opportunities from real backend', async ({ page }) => {
        await page.goto('/opportunities')

        // Page should load without errors
        await expect(
          page.getByRole('heading', { name: /volunteering opportunities/i }),
        ).toBeVisible()
      })

      test('should show empty state when no open opportunities exist', async ({ page }) => {
        await page.goto('/opportunities')

        // With fresh database, there should be no open opportunities
        await expect(page.getByText(/no opportunities available at the moment/i)).toBeVisible()
      })
    })
  }
})

// E2E tests for View Opportunity Details - focus on user flows, not UI details (covered by unit tests)
test.describe('View Opportunity Details', () => {
  const mockOpportunity = {
    id: 1,
    title: 'UA Open Day Support',
    description: 'Help with university open day activities.',
    pointsReward: 50,
    startDate: '2024-02-01T09:00:00Z',
    endDate: '2024-02-07T17:00:00Z',
    maxVolunteers: 10,
    status: 'OPEN',
    location: 'University Campus',
    promoter: { id: 1, email: 'promoter@ua.pt', name: 'Promoter', role: 'PROMOTER', points: 0, createdAt: '2024-01-01T00:00:00Z' },
    requiredSkills: [{ id: 1, name: 'Communication', category: 'COMMUNICATION', description: '' }],
    createdAt: '2024-01-15T00:00:00Z',
  }

  const mockPageResponse = { content: [mockOpportunity], totalElements: 1, totalPages: 1, size: 10, number: 0 }

  test('should navigate from list to detail page', async ({ page }) => {
    await page.route('**/api/opportunities?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPageResponse) }))
    await page.route('**/api/opportunities/1', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOpportunity) }))
    await page.route('**/api/skills', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }))

    await page.goto('/opportunities')
    await page.getByTestId('opportunity-card-link-1').click()
    await expect(page).toHaveURL('/opportunities/1')
    await expect(page.getByTestId('opportunity-title')).toBeVisible()
  })

  test('should be accessible without authentication', async ({ page }) => {
    await page.route('**/api/opportunities/1', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOpportunity) }))

    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('auth_token'))
    await page.goto('/opportunities/1')

    await expect(page).toHaveURL('/opportunities/1')
  })

  test('should handle 404 for non-existent opportunity', async ({ page }) => {
    await page.route('**/api/opportunities/999', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 404, message: 'Not found' }) }))

    await page.goto('/opportunities/999')
    await expect(page.getByTestId('error-state')).toBeVisible()
  })

  if (isIntegration) {
    test.describe('Integration', () => {
      test.beforeEach(async () => {
        await fetch(`${API_URL}/api/test/reset`, { method: 'POST' })
      })

      test('should return 404 for non-existent opportunity from real backend', async ({ page }) => {
        await page.goto('/opportunities/99999')
        await expect(page.getByTestId('error-state')).toBeVisible()
      })
    })
  }
})
