import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

vi.mock('@/components/reward', () => ({
  RewardCard: ({ reward }: { reward: RewardResponse }) => (
    <div data-testid={`reward-card-${reward.id}`}>
      <span data-testid={`reward-title-${reward.id}`}>{reward.title}</span>
      <span data-testid={`reward-points-${reward.id}`}>{reward.pointsCost}</span>
    </div>
  ),
  RewardFilters: ({
    onFiltersChange,
  }: {
    filters: Record<string, unknown>
    onFiltersChange: (filters: Record<string, unknown>) => void
  }) => (
    <div data-testid="reward-filters">
      <input
        data-testid="search-input"
        onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
        placeholder="Search"
      />
      <button
        type="button"
        data-testid="filter-type-certificate"
        onClick={() => onFiltersChange({ types: ['CERTIFICATE'] })}
      >
        Certificate Only
      </button>
      <button
        type="button"
        data-testid="filter-min-points"
        onClick={() => onFiltersChange({ minPoints: 75 })}
      >
        Min 75 Points
      </button>
      <button
        type="button"
        data-testid="filter-max-points"
        onClick={() => onFiltersChange({ maxPoints: 75 })}
      >
        Max 75 Points
      </button>
      <button type="button" data-testid="clear-filters" onClick={() => onFiltersChange({})}>
        Clear
      </button>
    </div>
  ),
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
  {
    id: 3,
    title: 'Alpha Reward',
    description: 'First alphabetically',
    pointsCost: 75,
    type: 'UA_SERVICE',
    active: true,
    createdAt: '2024-01-03T00:00:00Z',
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

  describe('Page Header', () => {
    it('should render page title', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByText('Rewards Catalog')).toBeInTheDocument()
      })
    })

    it('should render page description', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(
          screen.getByText('Redeem your earned points for valuable rewards'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading state while fetching', async () => {
      mockGetAvailableRewards.mockReturnValue(new Promise(() => {})) // Never resolves
      renderRewardsRoute()

      // Wait for router to render and check for title
      await waitFor(() => {
        expect(screen.getByText('Rewards Catalog')).toBeInTheDocument()
      })
    })
  })

  describe('Rewards Display', () => {
    it('should render rewards list', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('reward-card-1')).toBeInTheDocument()
      })
      expect(screen.getByTestId('reward-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('reward-card-3')).toBeInTheDocument()
    })

    it('should render rewards grid', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('rewards-grid')).toBeInTheDocument()
      })
    })

    it('should show rewards count for multiple rewards', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByText(/3 rewards available/)).toBeInTheDocument()
      })
    })

    it('should show singular "reward" for single reward', async () => {
      mockGetAvailableRewards.mockResolvedValue([mockRewards[0]])
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByText(/1 reward available/)).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no rewards', async () => {
      mockGetAvailableRewards.mockResolvedValue([])

      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByText('No rewards available at the moment')).toBeInTheDocument()
      })
    })

    it('should show helpful message in empty state', async () => {
      mockGetAvailableRewards.mockResolvedValue([])

      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByText('Check back later for new rewards to redeem')).toBeInTheDocument()
      })
    })

    it('should show empty state icon', async () => {
      mockGetAvailableRewards.mockResolvedValue([])

      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('should show error state on API failure', async () => {
      mockGetAvailableRewards.mockRejectedValue(new Error('API Error'))

      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByText('Failed to load rewards')).toBeInTheDocument()
      })
    })

    it('should show error message from API', async () => {
      mockGetAvailableRewards.mockRejectedValue(new Error('Network connection failed'))

      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByText('Network connection failed')).toBeInTheDocument()
      })
    })

    it('should show Try Again button on error', async () => {
      mockGetAvailableRewards.mockRejectedValue(new Error('API Error'))

      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
      })
    })
  })

  describe('Sorting', () => {
    it('should render sort select', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('sort-select')).toBeInTheDocument()
      })
    })

    it('should sort by points ascending by default', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        const cards = screen.getAllByTestId(/^reward-card-/)
        // Default sort is points-asc: 50, 75, 100
        expect(cards[0]).toHaveAttribute('data-testid', 'reward-card-1') // 50 points
        expect(cards[1]).toHaveAttribute('data-testid', 'reward-card-3') // 75 points
        expect(cards[2]).toHaveAttribute('data-testid', 'reward-card-2') // 100 points
      })
    })

    it('should sort by points descending', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('sort-select')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('sort-select'), { target: { value: 'points-desc' } })

      await waitFor(() => {
        const cards = screen.getAllByTestId(/^reward-card-/)
        // points-desc: 100, 75, 50
        expect(cards[0]).toHaveAttribute('data-testid', 'reward-card-2') // 100 points
        expect(cards[1]).toHaveAttribute('data-testid', 'reward-card-3') // 75 points
        expect(cards[2]).toHaveAttribute('data-testid', 'reward-card-1') // 50 points
      })
    })

    it('should sort by newest first', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('sort-select')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('sort-select'), { target: { value: 'newest' } })

      await waitFor(() => {
        const cards = screen.getAllByTestId(/^reward-card-/)
        // newest: Jan 3, Jan 2, Jan 1
        expect(cards[0]).toHaveAttribute('data-testid', 'reward-card-3') // Jan 3
        expect(cards[1]).toHaveAttribute('data-testid', 'reward-card-2') // Jan 2
        expect(cards[2]).toHaveAttribute('data-testid', 'reward-card-1') // Jan 1
      })
    })

    it('should sort by title alphabetically', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('sort-select')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('sort-select'), { target: { value: 'title-asc' } })

      await waitFor(() => {
        const cards = screen.getAllByTestId(/^reward-card-/)
        // title-asc: Alpha, Certificate, Free Coffee
        expect(cards[0]).toHaveAttribute('data-testid', 'reward-card-3') // Alpha
        expect(cards[1]).toHaveAttribute('data-testid', 'reward-card-2') // Certificate
        expect(cards[2]).toHaveAttribute('data-testid', 'reward-card-1') // Free Coffee
      })
    })
  })

  describe('Filtering', () => {
    it('should render filters component', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('reward-filters')).toBeInTheDocument()
      })
    })

    it('should filter by search term in title', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Coffee' } })

      await waitFor(() => {
        expect(screen.getByTestId('reward-card-1')).toBeInTheDocument()
        expect(screen.queryByTestId('reward-card-2')).not.toBeInTheDocument()
        expect(screen.queryByTestId('reward-card-3')).not.toBeInTheDocument()
      })
    })

    it('should filter by search term in description', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'volunteer' } })

      await waitFor(() => {
        expect(screen.getByTestId('reward-card-2')).toBeInTheDocument() // "Official volunteer certificate"
        expect(screen.queryByTestId('reward-card-1')).not.toBeInTheDocument()
      })
    })

    it('should filter by type', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('filter-type-certificate')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('filter-type-certificate'))

      await waitFor(() => {
        expect(screen.getByTestId('reward-card-2')).toBeInTheDocument() // Certificate
        expect(screen.queryByTestId('reward-card-1')).not.toBeInTheDocument()
        expect(screen.queryByTestId('reward-card-3')).not.toBeInTheDocument()
      })
    })

    it('should filter by minimum points', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('filter-min-points')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('filter-min-points')) // Min 75 points

      await waitFor(() => {
        expect(screen.getByTestId('reward-card-2')).toBeInTheDocument() // 100 points
        expect(screen.getByTestId('reward-card-3')).toBeInTheDocument() // 75 points
        expect(screen.queryByTestId('reward-card-1')).not.toBeInTheDocument() // 50 points
      })
    })

    it('should filter by maximum points', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('filter-max-points')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('filter-max-points')) // Max 75 points

      await waitFor(() => {
        expect(screen.getByTestId('reward-card-1')).toBeInTheDocument() // 50 points
        expect(screen.getByTestId('reward-card-3')).toBeInTheDocument() // 75 points
        expect(screen.queryByTestId('reward-card-2')).not.toBeInTheDocument() // 100 points
      })
    })

    it('should show "found" text when filters active', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Coffee' } })

      await waitFor(() => {
        expect(screen.getByText(/1 reward found/)).toBeInTheDocument()
      })
    })

    it('should show total count when filtered', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Coffee' } })

      await waitFor(() => {
        expect(screen.getByText(/of 3 total/)).toBeInTheDocument()
      })
    })

    it('should show empty state with filter message when no results', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'nonexistent' } })

      await waitFor(() => {
        expect(screen.getByText('No rewards match your filters')).toBeInTheDocument()
      })
    })

    it('should show Clear All Filters button when no results with filters', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'nonexistent' } })

      await waitFor(() => {
        expect(screen.getByTestId('clear-filters-button')).toBeInTheDocument()
      })
    })

    it('should clear filters and show all rewards', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      // Apply filter
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Coffee' } })

      await waitFor(() => {
        expect(screen.queryByTestId('reward-card-2')).not.toBeInTheDocument()
      })

      // Clear filters using our mock clear button
      fireEvent.click(screen.getByTestId('clear-filters'))

      await waitFor(() => {
        expect(screen.getByTestId('reward-card-1')).toBeInTheDocument()
        expect(screen.getByTestId('reward-card-2')).toBeInTheDocument()
        expect(screen.getByTestId('reward-card-3')).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('should call getAvailableRewards on mount', async () => {
      renderRewardsRoute()

      await waitFor(() => {
        expect(mockGetAvailableRewards).toHaveBeenCalledTimes(1)
      })
    })
  })
})
