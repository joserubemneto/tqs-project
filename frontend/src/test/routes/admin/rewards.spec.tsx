import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock redirect function
const mockRedirect = vi.fn()

// Mock auth functions - will be configured per test
const mockGetAuthToken = vi.fn()
const mockIsAdmin = vi.fn()

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    redirect: (options: { to: string; search?: Record<string, string> }) => {
      mockRedirect(options)
      throw new Error('Redirect')
    },
  }
})

vi.mock('@/lib/auth', () => ({
  getAuthToken: () => mockGetAuthToken(),
  isAdmin: () => mockIsAdmin(),
}))

// Mock the RewardsManagement component
vi.mock('@/components/reward', () => ({
  RewardsManagement: () => <div data-testid="rewards-management">Mocked RewardsManagement</div>,
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

// Import the actual route component
import { Route as AdminRewardsRoute } from '@/routes/admin/rewards'

// Get components from route
const AdminRewardsPage = AdminRewardsRoute.options.component as React.ComponentType
const AdminForbidden = AdminRewardsRoute.options.errorComponent as React.ComponentType
const beforeLoad = AdminRewardsRoute.options.beforeLoad as () => void

function renderAdminRewardsRoute() {
  const queryClient = createQueryClient()

  const rootRoute = createRootRoute()
  const adminRewardsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/rewards',
    component: AdminRewardsPage,
  })

  const routeTree = rootRoute.addChildren([adminRewardsRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/admin/rewards'] }),
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Admin Rewards Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthToken.mockReturnValue('mock-token')
    mockIsAdmin.mockReturnValue(true)
  })

  describe('beforeLoad guard', () => {
    it('should redirect to login when no token is present', () => {
      mockGetAuthToken.mockReturnValue(null)
      mockIsAdmin.mockReturnValue(false)

      expect(() => beforeLoad()).toThrow('Redirect')
      expect(mockRedirect).toHaveBeenCalledWith({ to: '/login' })
    })

    it('should redirect to home with error when user is not admin', () => {
      mockGetAuthToken.mockReturnValue('valid-token')
      mockIsAdmin.mockReturnValue(false)

      expect(() => beforeLoad()).toThrow('Redirect')
      expect(mockRedirect).toHaveBeenCalledWith({ to: '/', search: { error: 'forbidden' } })
    })

    it('should not redirect when token is present and user is admin', () => {
      mockGetAuthToken.mockReturnValue('valid-token')
      mockIsAdmin.mockReturnValue(true)

      expect(() => beforeLoad()).not.toThrow()
      expect(mockRedirect).not.toHaveBeenCalled()
    })
  })

  describe('AdminRewardsPage component', () => {
    it('should render page title', async () => {
      renderAdminRewardsRoute()

      await waitFor(() => {
        expect(screen.getByText('Rewards Management')).toBeInTheDocument()
      })
    })

    it('should render page description', async () => {
      renderAdminRewardsRoute()

      await waitFor(() => {
        expect(
          screen.getByText(
            'Create and manage rewards that volunteers can redeem with their points',
          ),
        ).toBeInTheDocument()
      })
    })

    it('should render RewardsManagement component', async () => {
      renderAdminRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('rewards-management')).toBeInTheDocument()
      })
    })
  })

  describe('AdminForbidden component', () => {
    it('should render Access Denied heading', () => {
      render(<AdminForbidden />)

      expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument()
    })

    it('should render permission error message', () => {
      render(<AdminForbidden />)

      expect(screen.getByText(/you don't have permission to manage rewards/i)).toBeInTheDocument()
    })

    it('should render Return to Home button', () => {
      render(<AdminForbidden />)

      const homeLink = screen.getByRole('link', { name: /return to home/i })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })
})
