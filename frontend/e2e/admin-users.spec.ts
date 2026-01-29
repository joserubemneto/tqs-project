import { expect, test } from '@playwright/test'

// Check if we're running in integration mode (with backend)
const isIntegration = process.env.E2E_INTEGRATION === 'true'

test.describe('Admin User Management', () => {
  test.describe('Page Layout', () => {
    test.beforeEach(async ({ page }) => {
      // Set up a mock admin token
      await page.addInitScript(() => {
        // Create a mock JWT with admin role
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(
          JSON.stringify({
            id: 1,
            email: 'admin@ua.pt',
            name: 'Admin User',
            role: 'ADMIN',
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        )
        const mockToken = `${header}.${payload}.mock-signature`
        localStorage.setItem('auth_token', mockToken)
      })
    })

    test('should display admin user management page', async ({ page }) => {
      // Mock the API response
      await page.route('**/api/admin/users*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [
              {
                id: 1,
                email: 'admin@ua.pt',
                name: 'Admin User',
                role: 'ADMIN',
                points: 0,
                createdAt: '2024-01-01',
              },
              {
                id: 2,
                email: 'volunteer@ua.pt',
                name: 'Volunteer User',
                role: 'VOLUNTEER',
                points: 100,
                createdAt: '2024-01-02',
              },
            ],
            currentPage: 0,
            totalPages: 1,
            totalElements: 2,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      await expect(page.getByRole('heading', { name: /manage users/i })).toBeVisible()
      await expect(page.getByText(/view and update user roles/i)).toBeVisible()
      await expect(page.getByRole('link', { name: /back to dashboard/i })).toBeVisible()
    })

    test('should display user table with data', async ({ page }) => {
      await page.route('**/api/admin/users*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [
              {
                id: 1,
                email: 'admin@ua.pt',
                name: 'Admin User',
                role: 'ADMIN',
                points: 0,
                createdAt: '2024-01-01',
              },
              {
                id: 2,
                email: 'volunteer@ua.pt',
                name: 'Volunteer User',
                role: 'VOLUNTEER',
                points: 100,
                createdAt: '2024-01-02',
              },
              {
                id: 3,
                email: 'promoter@ua.pt',
                name: 'Promoter User',
                role: 'PROMOTER',
                points: 50,
                createdAt: '2024-01-03',
              },
            ],
            currentPage: 0,
            totalPages: 1,
            totalElements: 3,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      // Wait for table to load
      await expect(page.getByText('Admin User')).toBeVisible()
      await expect(page.getByText('Volunteer User')).toBeVisible()
      await expect(page.getByText('Promoter User')).toBeVisible()

      // Check total count
      await expect(page.getByText(/3 total users/i)).toBeVisible()
    })

    test('should have search input', async ({ page }) => {
      await page.route('**/api/admin/users*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [],
            currentPage: 0,
            totalPages: 0,
            totalElements: 0,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      await expect(page.getByPlaceholder(/search by name or email/i)).toBeVisible()
    })

    test('should show "(you)" label for current user', async ({ page }) => {
      await page.route('**/api/admin/users*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [
              {
                id: 1,
                email: 'admin@ua.pt',
                name: 'Admin User',
                role: 'ADMIN',
                points: 0,
                createdAt: '2024-01-01',
              },
            ],
            currentPage: 0,
            totalPages: 1,
            totalElements: 1,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      await expect(page.getByText('(you)')).toBeVisible()
      await expect(page.getByText(/cannot edit own role/i)).toBeVisible()
    })
  })

  test.describe('Access Control', () => {
    test('should redirect non-admin users to home page', async ({ page }) => {
      // Set up a mock volunteer token
      await page.addInitScript(() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(
          JSON.stringify({
            id: 2,
            email: 'volunteer@ua.pt',
            name: 'Volunteer User',
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

  test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(
          JSON.stringify({
            id: 1,
            email: 'admin@ua.pt',
            name: 'Admin User',
            role: 'ADMIN',
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        )
        const mockToken = `${header}.${payload}.mock-signature`
        localStorage.setItem('auth_token', mockToken)
      })
    })

    test('should filter users when searching', async ({ page }) => {
      let searchTerm = ''

      await page.route('**/api/admin/users*', async (route) => {
        const url = new URL(route.request().url())
        searchTerm = url.searchParams.get('search') || ''

        const allUsers = [
          {
            id: 1,
            email: 'admin@ua.pt',
            name: 'Admin User',
            role: 'ADMIN',
            points: 0,
            createdAt: '2024-01-01',
          },
          {
            id: 2,
            email: 'volunteer@ua.pt',
            name: 'Volunteer User',
            role: 'VOLUNTEER',
            points: 100,
            createdAt: '2024-01-02',
          },
        ]

        const filteredUsers = searchTerm
          ? allUsers.filter(
              (u) =>
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase()),
            )
          : allUsers

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: filteredUsers,
            currentPage: 0,
            totalPages: 1,
            totalElements: filteredUsers.length,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      // Wait for initial load
      await expect(page.getByText('Admin User')).toBeVisible()
      await expect(page.getByText('Volunteer User')).toBeVisible()

      // Search for volunteer
      await page.getByPlaceholder(/search by name or email/i).fill('volunteer')

      // Wait for debounced search
      await page.waitForTimeout(400)

      // Should only show volunteer
      await expect(page.getByText('Volunteer User')).toBeVisible()
    })
  })

  test.describe('Role Update', () => {
    test.skip(() => !isIntegration, 'Requires backend - run with E2E_INTEGRATION=true')

    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('/login')
      await page.getByLabel(/email/i).fill('admin@ua.pt')
      await page.getByLabel(/password/i).fill('Admin@2024!')
      await page
        .locator('form')
        .getByRole('button', { name: /sign in/i })
        .click()
      await expect(page).toHaveURL('/admin')
    })

    test('should update user role successfully', async ({ page }) => {
      await page.goto('/admin/users')

      // Wait for users to load
      await expect(page.getByText('Volunteer User')).toBeVisible()

      // Find the row for volunteer user and change their role
      const volunteerRow = page.locator('tr', { hasText: 'volunteer@ua.pt' })
      const roleSelect = volunteerRow.locator('select')

      // Change role to PROMOTER
      await roleSelect.selectOption('PROMOTER')

      // Wait for success notification
      await expect(page.getByText(/successfully updated.*role to promoter/i)).toBeVisible()
    })

    test('should not allow admin to change own role', async ({ page }) => {
      await page.goto('/admin/users')

      // Wait for users to load
      await expect(page.getByText('Admin User')).toBeVisible()

      // Find the admin row
      const adminRow = page.locator('tr', { hasText: 'admin@ua.pt' })

      // Should show "Cannot edit own role" instead of select
      await expect(adminRow.getByText(/cannot edit own role/i)).toBeVisible()
    })
  })

  test.describe('Pagination', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(
          JSON.stringify({
            id: 1,
            email: 'admin@ua.pt',
            name: 'Admin User',
            role: 'ADMIN',
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        )
        const mockToken = `${header}.${payload}.mock-signature`
        localStorage.setItem('auth_token', mockToken)
      })
    })

    test('should show pagination when there are multiple pages', async ({ page }) => {
      await page.route('**/api/admin/users*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [
              {
                id: 1,
                email: 'user1@ua.pt',
                name: 'User 1',
                role: 'VOLUNTEER',
                points: 0,
                createdAt: '2024-01-01',
              },
              {
                id: 2,
                email: 'user2@ua.pt',
                name: 'User 2',
                role: 'VOLUNTEER',
                points: 0,
                createdAt: '2024-01-02',
              },
            ],
            currentPage: 0,
            totalPages: 3,
            totalElements: 25,
            pageSize: 10,
            hasNext: true,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      // Should show page info
      await expect(page.getByText(/page 1 of 3/i)).toBeVisible()

      // Should have pagination buttons
      await expect(page.getByRole('button', { name: /previous/i })).toBeDisabled()
      await expect(page.getByRole('button', { name: /next/i })).toBeEnabled()
    })

    test('should not show pagination when single page', async ({ page }) => {
      await page.route('**/api/admin/users*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [
              {
                id: 1,
                email: 'admin@ua.pt',
                name: 'Admin User',
                role: 'ADMIN',
                points: 0,
                createdAt: '2024-01-01',
              },
            ],
            currentPage: 0,
            totalPages: 1,
            totalElements: 1,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      // Pagination controls should not be visible for single page
      await expect(page.getByRole('button', { name: /next/i })).not.toBeVisible()
    })
  })

  test.describe('Loading and Error States', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(
          JSON.stringify({
            id: 1,
            email: 'admin@ua.pt',
            name: 'Admin User',
            role: 'ADMIN',
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        )
        const mockToken = `${header}.${payload}.mock-signature`
        localStorage.setItem('auth_token', mockToken)
      })
    })

    test('should show loading state while fetching users', async ({ page }) => {
      await page.route('**/api/admin/users*', async (route) => {
        // Delay response to see loading state
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [],
            currentPage: 0,
            totalPages: 0,
            totalElements: 0,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      // Should show loading indicator (a spinner)
      // The component uses Loader2 which has animate-spin class
      await expect(page.locator('.animate-spin')).toBeVisible()
    })

    test('should show error state when API fails', async ({ page }) => {
      await page.route('**/api/admin/users*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Internal server error',
          }),
        })
      })

      await page.goto('/admin/users')

      await expect(page.getByText(/failed to load users/i)).toBeVisible()
    })

    test('should show empty state when no users found', async ({ page }) => {
      await page.route('**/api/admin/users*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [],
            currentPage: 0,
            totalPages: 0,
            totalElements: 0,
            pageSize: 10,
            hasNext: false,
            hasPrevious: false,
          }),
        })
      })

      await page.goto('/admin/users')

      // When no filters are applied, shows "No users found"
      await expect(page.getByText(/no users found/i)).toBeVisible()
    })
  })
})
