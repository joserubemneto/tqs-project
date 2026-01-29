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

// Mock auth functions
vi.mock('@/lib/auth', () => ({
  getAuthToken: vi.fn(() => 'mock-token'),
  isAdmin: vi.fn(() => true),
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

function renderAdminRewardsRoute() {
  const queryClient = createQueryClient()

  const rootRoute = createRootRoute()
  const adminRewardsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/rewards',
    component: AdminRewardsRoute.options.component,
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
  })

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
        screen.getByText('Create and manage rewards that volunteers can redeem with their points'),
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
