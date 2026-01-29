import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

// Backend API URL for direct API calls (e.g., test reset)
const API_URL = process.env.API_URL || 'http://localhost:8080'

test.describe('Volunteer Applications', () => {
  // Integration tests with real backend
  test.describe('Integration Tests', () => {
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    // Helper function to generate unique title
    const generateUniqueTitle = () => `Test Opportunity ${Date.now()}`

    // Helper function to login as volunteer
    async function loginAsVolunteer(page: import('@playwright/test').Page) {
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('volunteer@ua.pt')
      await page.getByLabel(/password/i).fill('password')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()
      await expect(page).toHaveURL('/')
    }

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

    // Helper function to logout
    async function logout(page: import('@playwright/test').Page) {
      await page.evaluate(() => localStorage.removeItem('auth_token'))
      await page.goto('/')
    }

    // Helper function to format date for LocalDateTime (without timezone)
    function formatLocalDateTime(date: Date): string {
      return date.toISOString().slice(0, 19) // "2024-02-01T09:00:00" without 'Z'
    }

    // Helper function to create an OPEN opportunity via the test API
    // This bypasses the normal flow to create an opportunity with OPEN status directly
    async function createOpenOpportunity(
      request: import('@playwright/test').APIRequestContext,
      title: string,
    ): Promise<number> {
      // Set dates (start tomorrow, end in 7 days)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      // Get the skill ID for Communication
      const skillsResponse = await request.get(`${API_URL}/api/skills`)
      const skills = await skillsResponse.json()
      const communicationSkill = skills.find((s: { name: string }) => s.name === 'Communication')

      const response = await request.post(`${API_URL}/api/test/opportunity`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          title,
          description: 'E2E test opportunity for applications',
          pointsReward: 100,
          maxVolunteers: 5,
          startDate: formatLocalDateTime(startDate),
          endDate: formatLocalDateTime(endDate),
          location: 'Test Location',
          requiredSkillIds: [communicationSkill.id],
        },
      })

      if (!response.ok()) {
        const errorBody = await response.text()
        console.error(`Create opportunity failed: ${response.status()} - ${errorBody}`)
      }
      expect(response.ok()).toBeTruthy()
      const opportunity = await response.json()
      return opportunity.id
    }

    test.beforeEach(async ({ request }) => {
      // Reset database before each test
      await request.post(`${API_URL}/api/test/reset`)
    })

    test('should apply to an opportunity and see it in My Applications', async ({
      page,
      request,
    }) => {
      const uniqueTitle = generateUniqueTitle()

      // Step 1: Create an OPEN opportunity via test API
      const opportunityId = await createOpenOpportunity(request, uniqueTitle)
      expect(opportunityId).toBeTruthy()

      // Step 2: Login as volunteer
      await loginAsVolunteer(page)

      // Step 3: Navigate to the opportunity
      await page.goto(`/opportunities/${opportunityId}`)
      await expect(page.getByTestId('opportunity-title')).toHaveText(uniqueTitle)

      // Step 4: Apply to the opportunity
      await expect(page.getByTestId('apply-section')).toBeVisible()
      await page.getByTestId('apply-button').click()

      // Step 5: Verify application was successful - should show application status
      await expect(page.getByTestId('application-status')).toBeVisible()
      await expect(page.getByText(/you have applied/i)).toBeVisible()
      await expect(page.getByTestId('status-badge')).toHaveText('Pending')

      // Step 6: Navigate to My Applications page
      await page
        .locator('nav')
        .getByRole('link', { name: /my applications/i })
        .click()
      await expect(page).toHaveURL('/my-applications')

      // Step 7: Verify the application appears in the list
      await expect(page.getByRole('heading', { name: /my applications/i })).toBeVisible()
      await expect(page.getByText(uniqueTitle)).toBeVisible()
      await expect(page.getByTestId('status-badge')).toHaveText('Pending')
    })

    test('should show "Already applied" when trying to apply twice', async ({ page, request }) => {
      const uniqueTitle = generateUniqueTitle()

      // Create an OPEN opportunity via test API
      const opportunityId = await createOpenOpportunity(request, uniqueTitle)

      // Login as volunteer and apply
      await loginAsVolunteer(page)
      await page.goto(`/opportunities/${opportunityId}`)

      await page.getByTestId('apply-button').click()
      await expect(page.getByTestId('application-status')).toBeVisible()

      // Reload page and verify can't apply again
      await page.reload()
      await expect(page.getByTestId('application-status')).toBeVisible()
      await expect(page.getByText(/you have applied/i)).toBeVisible()
      // Apply button should not be visible when already applied
      await expect(page.getByTestId('apply-button')).not.toBeVisible()
    })

    test('should show My Applications link only for volunteers', async ({ page }) => {
      // Login as volunteer - should see My Applications
      await loginAsVolunteer(page)
      await expect(
        page.locator('nav').getByRole('link', { name: /my applications/i }),
      ).toBeVisible()

      // Logout and login as promoter - should NOT see My Applications
      await logout(page)
      await loginAsPromoter(page)
      await expect(
        page.locator('nav').getByRole('link', { name: /my applications/i }),
      ).not.toBeVisible()
    })

    test('should show empty state when no applications', async ({ page }) => {
      await loginAsVolunteer(page)
      await page.goto('/my-applications')

      await expect(page.getByTestId('empty-state')).toBeVisible()
      await expect(page.getByText(/you haven't applied to any opportunities yet/i)).toBeVisible()
    })

    test('should navigate from My Applications to opportunity detail', async ({
      page,
      request,
    }) => {
      const uniqueTitle = generateUniqueTitle()

      // Create an OPEN opportunity via test API
      const opportunityId = await createOpenOpportunity(request, uniqueTitle)

      // Login as volunteer and apply
      await loginAsVolunteer(page)
      await page.goto(`/opportunities/${opportunityId}`)
      await page.getByTestId('apply-button').click()
      await expect(page.getByTestId('application-status')).toBeVisible()

      // Go to My Applications
      await page.goto('/my-applications')
      await expect(page.getByText(uniqueTitle)).toBeVisible()

      // Click on the application card link (find the link that contains the title)
      await page.locator('a').filter({ hasText: uniqueTitle }).click()

      // Should navigate to opportunity detail page
      await expect(page.getByTestId('opportunity-title')).toHaveText(uniqueTitle)
    })

    test('should show Applications Management section for promoter', async ({ page, request }) => {
      const uniqueTitle = generateUniqueTitle()

      // Create an OPEN opportunity via test API
      const opportunityId = await createOpenOpportunity(request, uniqueTitle)

      // Login as promoter
      await loginAsPromoter(page)
      await page.goto(`/opportunities/${opportunityId}`)

      // Should see Applications card
      await expect(page.getByRole('heading', { name: /applications/i })).toBeVisible()
      await expect(page.getByText(/no applications yet/i)).toBeVisible()
    })

    test('should approve a pending application', async ({ page, request }) => {
      const uniqueTitle = generateUniqueTitle()

      // Step 1: Create an OPEN opportunity via test API
      const opportunityId = await createOpenOpportunity(request, uniqueTitle)

      // Step 2: Login as volunteer and apply
      await loginAsVolunteer(page)
      await page.goto(`/opportunities/${opportunityId}`)
      await page.getByTestId('apply-button').click()
      await expect(page.getByTestId('application-status')).toBeVisible()
      await expect(page.getByTestId('status-badge')).toHaveText('Pending')

      // Step 3: Logout and login as promoter
      await logout(page)
      await loginAsPromoter(page)

      // Step 4: Navigate to the opportunity
      await page.goto(`/opportunities/${opportunityId}`)

      // Step 5: Verify application appears in the list
      await expect(page.getByRole('heading', { name: /applications/i })).toBeVisible()
      await expect(page.getByText(/1 pending/i)).toBeVisible()
      await expect(page.getByTestId('volunteer-name')).toHaveText('Sample Volunteer')
      await expect(page.getByTestId('application-status')).toHaveText('Pending')

      // Step 6: Approve the application
      await page.getByTestId('approve-button').click()

      // Step 7: Verify application status changed to Approved
      await expect(page.getByTestId('application-status')).toHaveText('Approved')
      await expect(page.getByText(/1 \/ 5 spots filled/i)).toBeVisible()

      // Step 8: Verify volunteer sees approved status
      await logout(page)
      await loginAsVolunteer(page)
      await page.goto('/my-applications')
      await expect(page.getByTestId('status-badge')).toHaveText('Approved')
    })

    test('should reject a pending application', async ({ page, request }) => {
      const uniqueTitle = generateUniqueTitle()

      // Step 1: Create an OPEN opportunity via test API
      const opportunityId = await createOpenOpportunity(request, uniqueTitle)

      // Step 2: Login as volunteer and apply
      await loginAsVolunteer(page)
      await page.goto(`/opportunities/${opportunityId}`)
      await page.getByTestId('apply-button').click()
      await expect(page.getByTestId('application-status')).toBeVisible()

      // Step 3: Logout and login as promoter
      await logout(page)
      await loginAsPromoter(page)

      // Step 4: Navigate to the opportunity
      await page.goto(`/opportunities/${opportunityId}`)

      // Step 5: Verify application appears
      await expect(page.getByTestId('volunteer-name')).toHaveText('Sample Volunteer')

      // Step 6: Reject the application
      await page.getByTestId('reject-button').click()

      // Step 7: Verify application status changed to Rejected
      await expect(page.getByTestId('application-status')).toHaveText('Rejected')

      // Step 8: Verify volunteer sees rejected status
      await logout(page)
      await loginAsVolunteer(page)
      await page.goto('/my-applications')
      await expect(page.getByTestId('status-badge')).toHaveText('Rejected')
    })

    test('should not allow approve when no spots available', async ({ page, request }) => {
      // Create opportunity with max 1 volunteer
      const uniqueTitle = generateUniqueTitle()

      // Set dates (start tomorrow, end in 7 days)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7)

      // Get the skill ID for Communication
      const skillsResponse = await request.get(`${API_URL}/api/skills`)
      const skills = await skillsResponse.json()
      const communicationSkill = skills.find((s: { name: string }) => s.name === 'Communication')

      // Create opportunity with maxVolunteers = 1
      const response = await request.post(`${API_URL}/api/test/opportunity`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          title: uniqueTitle,
          description: 'E2E test opportunity for applications',
          pointsReward: 100,
          maxVolunteers: 1, // Only 1 spot
          startDate: startDate.toISOString().slice(0, 19),
          endDate: endDate.toISOString().slice(0, 19),
          location: 'Test Location',
          requiredSkillIds: [communicationSkill.id],
        },
      })
      expect(response.ok()).toBeTruthy()
      const opportunity = await response.json()
      const opportunityId = opportunity.id

      // Step 1: First volunteer applies
      await loginAsVolunteer(page)
      await page.goto(`/opportunities/${opportunityId}`)
      await page.getByTestId('apply-button').click()
      await expect(page.getByTestId('application-status')).toBeVisible()
      await logout(page)

      // Step 2: Register and login as second volunteer, then apply
      // (Both can apply while pending - spots are only consumed when approved)
      await page.goto('/register')
      await page.getByLabel(/name/i).fill('Second Volunteer')
      await page.getByLabel(/email/i).fill(`volunteer2-${Date.now()}@ua.pt`)
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /create account/i }).click()
      await expect(page).toHaveURL('/')

      // Second volunteer applies to the same opportunity
      await page.goto(`/opportunities/${opportunityId}`)
      await page.getByTestId('apply-button').click()
      await expect(page.getByTestId('application-status')).toBeVisible()
      await logout(page)

      // Step 3: Promoter approves the FIRST application (fills the only spot)
      await loginAsPromoter(page)
      await page.goto(`/opportunities/${opportunityId}`)

      // Should see 2 pending applications
      await expect(page.getByText(/2 pending/i)).toBeVisible()

      // Approve the first application (Sample Volunteer)
      const approveButtons = page.getByTestId('approve-button')
      await approveButtons.first().click()

      // Wait for the first application to be approved
      await expect(page.getByText('Approved')).toBeVisible()
      await expect(page.getByText(/1 \/ 1 spots filled/i)).toBeVisible()

      // Step 4: The remaining pending application should have disabled approve button
      // (only one approve button should remain - for the second volunteer's pending application)
      const remainingApproveButton = page.getByTestId('approve-button')
      await expect(remainingApproveButton).toBeDisabled()
      await expect(page.getByText(/cannot approve: no spots remaining/i)).toBeVisible()
    })
  })

  // Mock-based tests for non-integration scenarios
  test.describe('Navigation and Authorization', () => {
    test('should redirect to login when accessing My Applications without authentication', async ({
      page,
    }) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.removeItem('auth_token'))

      await page.goto('/my-applications')

      await expect(page).toHaveURL('/login')
    })

    test('should show access restricted message for non-volunteers', async ({ page }) => {
      // Set a mock promoter token
      const promoterPayload = btoa(
        JSON.stringify({ id: 1, email: 'promoter@ua.pt', role: 'PROMOTER' }),
      )
      const mockToken = `header.${promoterPayload}.signature`

      await page.goto('/')
      await page.evaluate((token) => localStorage.setItem('auth_token', token), mockToken)

      // Mock the auth check API
      await page.route('**/api/auth/me', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            email: 'promoter@ua.pt',
            name: 'Promoter User',
            role: 'PROMOTER',
          }),
        }),
      )

      await page.goto('/my-applications')

      await expect(page.getByTestId('not-volunteer')).toBeVisible()
      await expect(page.getByText(/access restricted/i)).toBeVisible()
      await expect(page.getByText(/only volunteers can view applications/i)).toBeVisible()
    })

    test('should show Login to Apply button for unauthenticated users', async ({ page }) => {
      const mockOpportunity = {
        id: 1,
        title: 'Test Opportunity',
        description: 'Test description',
        pointsReward: 50,
        startDate: '2024-02-01T09:00:00Z',
        endDate: '2024-02-07T17:00:00Z',
        maxVolunteers: 10,
        status: 'OPEN',
        location: 'Test Location',
        promoter: {
          id: 2,
          email: 'promoter@ua.pt',
          name: 'Promoter',
          role: 'PROMOTER',
        },
        requiredSkills: [],
        createdAt: '2024-01-15T00:00:00Z',
      }

      await page.route('**/api/opportunities/1', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOpportunity),
        }),
      )

      await page.route('**/api/opportunities/1/application-count', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(0),
        }),
      )

      await page.goto('/')
      await page.evaluate(() => localStorage.removeItem('auth_token'))
      await page.goto('/opportunities/1')

      await expect(page.getByTestId('apply-login-prompt')).toBeVisible()
      await expect(page.getByRole('button', { name: /login to apply/i })).toBeVisible()
    })
  })
})
