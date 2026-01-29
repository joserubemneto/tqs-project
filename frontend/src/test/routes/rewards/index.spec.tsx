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
import type { RewardResponse } from '@/lib/reward'

// Mock the reward API
const mockGetAvailableRewards = vi.fn()

vi.mock('@/lib/reward', async () => {
  const actual = await vi.importActual('@/lib/reward')
  return {
    ...actual,
    getAvailableRewards: () => mockGetAvailableRewards(),
  }
})

// Mock the reward components to simplify testing
vi.mock('@/components/reward', () => ({
  RewardCard: ({ reward }: { reward: RewardResponse }) => (
    <div data-testid={`reward-card-${reward.id}`}>{reward.title}</div>
  ),
  RewardFilters: () => <div data-testid="reward-filters">Filters</div>,
}))

const mockRewards: RewardResponse[] = [
  {
    id: 1,
    title: 'Free Coffee',
    description: 'Get a free coffee at UA Cafeteria',
    pointsCost: 50,
    type: 'PARTNER_VOUCHER',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Certificate',
    description: 'Official volunteer certificate',
    pointsCost: 100,
    type: 'CERTIFICATE',
    active: true,
    createdAt: '2024-01-02T00:00:00Z',
  },
]

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
import { Route as RewardsRoute } from '@/routes/rewards/index'

function renderRewardsRoute() {
  const queryClient = createQueryClient()

  const rootRoute = createRootRoute()
  const rewardsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/rewards',
    component: RewardsRoute.options.component,
  })

  const routeTree = rootRoute.addChildren([rewardsRoute])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/rewards'] }),
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('Rewards Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAvailableRewards.mockResolvedValue(mockRewards)
  })

  it('should render page title', async () => {
    renderRewardsRoute()

    await waitFor(() => {
      expect(screen.getByText('Rewards Catalog')).toBeInTheDocument()
    })
  })

  it('should render page description', async () => {
    renderRewardsRoute()

    await waitFor(() => {
      expect(screen.getByText('Redeem your earned points for valuable rewards')).toBeInTheDocument()
    })
  })

  it('should render rewards list', async () => {
    renderRewardsRoute()

    await waitFor(() => {
      expect(screen.getByText('Free Coffee')).toBeInTheDocument()
    })
    expect(screen.getByText('Certificate')).toBeInTheDocument()
  })

  it('should show rewards count', async () => {
    renderRewardsRoute()

    await waitFor(() => {
      expect(screen.getByText('2 rewards available')).toBeInTheDocument()
    })
  })

  it('should show empty state when no rewards', async () => {
    mockGetAvailableRewards.mockResolvedValue([])

    renderRewardsRoute()

    await waitFor(() => {
      expect(screen.getByText('No rewards available at the moment')).toBeInTheDocument()
    })
  })

  it('should show error state on API failure', async () => {
    mockGetAvailableRewards.mockRejectedValue(new Error('API Error'))

    renderRewardsRoute()

    await waitFor(() => {
      expect(screen.getByText('Failed to load rewards')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
  })
})
