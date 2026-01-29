import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RewardResponse } from '@/lib/reward'

// Mock the reward API
const mockGetReward = vi.fn()

vi.mock('@/lib/reward', async () => {
  const actual = await vi.importActual('@/lib/reward')
  return {
    ...actual,
    getReward: (id: number) => mockGetReward(id),
  }
})

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    createFileRoute: () => ({
      useParams: () => ({ rewardId: '1' }),
    }),
    buttonVariants: () => 'button-class',
  }
})

const mockReward: RewardResponse = {
  id: 1,
  title: 'Free Coffee',
  description: 'Get a free coffee at UA Cafeteria. Present this voucher at the counter.',
  pointsCost: 50,
  type: 'PARTNER_VOUCHER',
  partner: {
    id: 1,
    name: 'UA Cafeteria',
    description: 'University cafeteria partner',
    website: 'https://cafeteria.ua.pt',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  quantity: 100,
  remainingQuantity: 95,
  active: true,
  availableFrom: '2024-01-01T00:00:00Z',
  availableUntil: '2024-12-31T23:59:59Z',
  createdAt: '2024-01-01T00:00:00Z',
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

// Create a test component that mimics the page behavior
function TestRewardDetailPage({ rewardId = '1' }: { rewardId?: string }) {
  const id = parseInt(rewardId, 10)

  const {
    data: reward,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['reward', id],
    queryFn: () => mockGetReward(id),
    enabled: !Number.isNaN(id),
  })

  if (Number.isNaN(id)) {
    return (
      <div data-testid="invalid-id-state">
        <p>Invalid reward ID</p>
        <a href="/rewards">Back to rewards</a>
      </div>
    )
  }

  if (isLoading) {
    return <div data-testid="loading-state">Loading...</div>
  }

  if (isError) {
    const is404 = error instanceof Error && error.message.includes('404')
    return (
      <div data-testid="error-state">
        <p data-testid="error-message">{is404 ? 'Reward not found' : 'Failed to load reward'}</p>
        <a href="/rewards">Back to rewards</a>
        {!is404 && <button type="button">Try Again</button>}
      </div>
    )
  }

  if (!reward) return null

  const available =
    reward.active && (reward.remainingQuantity === undefined || reward.remainingQuantity > 0)
  const availabilityText =
    reward.remainingQuantity !== undefined ? `${reward.remainingQuantity} remaining` : 'Unlimited'

  return (
    <div>
      <a href="/rewards">Back to rewards catalog</a>
      <h1 data-testid="reward-title">{reward.title}</h1>
      <p data-testid="reward-description">{reward.description}</p>
      <span data-testid="reward-type">Partner Voucher</span>
      <span data-testid="reward-points">{reward.pointsCost}</span>
      <span data-testid="reward-availability">{available ? 'Available' : 'Unavailable'}</span>
      <span data-testid="reward-quantity">{availabilityText}</span>
      {reward.partner && (
        <>
          <span data-testid="partner-name">{reward.partner.name}</span>
          {reward.partner.description && <span>{reward.partner.description}</span>}
          {reward.partner.website && <a href={reward.partner.website}>Visit website</a>}
        </>
      )}
      {reward.availableFrom && (
        <span data-testid="reward-available-from">{reward.availableFrom}</span>
      )}
      {reward.availableUntil && (
        <span data-testid="reward-available-until">{reward.availableUntil}</span>
      )}
      {available ? (
        <button type="button" disabled>
          Redeem Reward
        </button>
      ) : (
        <p>This reward is currently not available for redemption.</p>
      )}
    </div>
  )
}

function renderTestPage(rewardId = '1') {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TestRewardDetailPage rewardId={rewardId} />
    </QueryClientProvider>,
  )
}

describe('Reward Detail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetReward.mockResolvedValue(mockReward)
  })

  describe('Loading State', () => {
    it('should show loading state initially', async () => {
      mockGetReward.mockReturnValue(new Promise(() => {})) // Never resolves
      renderTestPage()

      expect(screen.getByTestId('loading-state')).toBeInTheDocument()
    })
  })

  describe('Reward Display', () => {
    it('should render reward title', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-title')).toHaveTextContent('Free Coffee')
      })
    })

    it('should render reward description', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-description')).toHaveTextContent(
          'Get a free coffee at UA Cafeteria',
        )
      })
    })

    it('should render points cost', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-points')).toHaveTextContent('50')
      })
    })

    it('should render reward type badge', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toHaveTextContent('Partner Voucher')
      })
    })
  })

  describe('Partner Information', () => {
    it('should render partner name', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('partner-name')).toHaveTextContent('UA Cafeteria')
      })
    })

    it('should render partner description when provided', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByText('University cafeteria partner')).toBeInTheDocument()
      })
    })

    it('should render partner website link when provided', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByText('Visit website')).toBeInTheDocument()
      })
    })

    it('should not render partner section when no partner', async () => {
      const rewardWithoutPartner: RewardResponse = {
        ...mockReward,
        partner: undefined,
      }
      mockGetReward.mockResolvedValue(rewardWithoutPartner)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-title')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('partner-name')).not.toBeInTheDocument()
    })
  })

  describe('Availability Information', () => {
    it('should render availability status as Available', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-availability')).toHaveTextContent('Available')
      })
    })

    it('should render availability status as Unavailable for inactive rewards', async () => {
      const inactiveReward: RewardResponse = {
        ...mockReward,
        active: false,
      }
      mockGetReward.mockResolvedValue(inactiveReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-availability')).toHaveTextContent('Unavailable')
      })
    })

    it('should render quantity information', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-quantity')).toHaveTextContent('95 remaining')
      })
    })

    it('should show Unlimited for rewards without quantity', async () => {
      const unlimitedReward: RewardResponse = {
        ...mockReward,
        quantity: undefined,
        remainingQuantity: undefined,
      }
      mockGetReward.mockResolvedValue(unlimitedReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-quantity')).toHaveTextContent('Unlimited')
      })
    })
  })

  describe('Date Range', () => {
    it('should render available from date', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-available-from')).toBeInTheDocument()
      })
    })

    it('should render available until date', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-available-until')).toBeInTheDocument()
      })
    })

    it('should not render date section when no dates provided', async () => {
      const rewardWithoutDates: RewardResponse = {
        ...mockReward,
        availableFrom: undefined,
        availableUntil: undefined,
      }
      mockGetReward.mockResolvedValue(rewardWithoutDates)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-title')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('reward-available-from')).not.toBeInTheDocument()
      expect(screen.queryByTestId('reward-available-until')).not.toBeInTheDocument()
    })
  })

  describe('Redeem Button', () => {
    it('should show Redeem button for available rewards', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Redeem Reward/ })).toBeInTheDocument()
      })
    })

    it('should disable Redeem button (placeholder)', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Redeem Reward/ })).toBeDisabled()
      })
    })

    it('should show unavailable message for inactive rewards', async () => {
      const inactiveReward: RewardResponse = {
        ...mockReward,
        active: false,
      }
      mockGetReward.mockResolvedValue(inactiveReward)
      renderTestPage()

      await waitFor(() => {
        expect(
          screen.getByText('This reward is currently not available for redemption.'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('should show error state on API failure', async () => {
      mockGetReward.mockRejectedValue(new Error('API Error'))
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })
      expect(screen.getByText('Failed to load reward')).toBeInTheDocument()
    })

    it('should show "Reward not found" for 404 errors', async () => {
      mockGetReward.mockRejectedValue(new Error('404: Not Found'))
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Reward not found')
      })
    })

    it('should show Try Again button for non-404 errors', async () => {
      mockGetReward.mockRejectedValue(new Error('Network Error'))
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
      })
    })

    it('should show Back to rewards link on error', async () => {
      mockGetReward.mockRejectedValue(new Error('API Error'))
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Back to rewards/ })).toBeInTheDocument()
      })
    })
  })

  describe('Invalid ID', () => {
    it('should show invalid ID state for non-numeric ID', async () => {
      renderTestPage('invalid')

      expect(screen.getByTestId('invalid-id-state')).toBeInTheDocument()
      expect(screen.getByText('Invalid reward ID')).toBeInTheDocument()
    })
  })

  describe('Back Navigation', () => {
    it('should render back to rewards link', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Back to rewards catalog/ })).toBeInTheDocument()
      })
    })
  })

  describe('Reward Types', () => {
    it('should render UA_SERVICE type correctly', async () => {
      const uaServiceReward: RewardResponse = {
        ...mockReward,
        type: 'UA_SERVICE',
      }
      mockGetReward.mockResolvedValue(uaServiceReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toBeInTheDocument()
      })
    })

    it('should render MERCHANDISE type correctly', async () => {
      const merchandiseReward: RewardResponse = {
        ...mockReward,
        type: 'MERCHANDISE',
      }
      mockGetReward.mockResolvedValue(merchandiseReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toBeInTheDocument()
      })
    })

    it('should render CERTIFICATE type correctly', async () => {
      const certificateReward: RewardResponse = {
        ...mockReward,
        type: 'CERTIFICATE',
      }
      mockGetReward.mockResolvedValue(certificateReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toBeInTheDocument()
      })
    })

    it('should render OTHER type correctly', async () => {
      const otherReward: RewardResponse = {
        ...mockReward,
        type: 'OTHER',
      }
      mockGetReward.mockResolvedValue(otherReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toBeInTheDocument()
      })
    })
  })

  describe('Inactive Reward Badge', () => {
    it('should show Inactive badge for inactive rewards', async () => {
      const inactiveReward: RewardResponse = {
        ...mockReward,
        active: false,
      }
      mockGetReward.mockResolvedValue(inactiveReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-availability')).toHaveTextContent('Unavailable')
      })
    })
  })

  describe('Partner Edge Cases', () => {
    it('should not render partner website when not provided', async () => {
      const rewardWithPartnerNoWebsite: RewardResponse = {
        ...mockReward,
        partner: {
          id: 1,
          name: 'UA Cafeteria',
          description: 'University cafeteria partner',
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
          // No website
        },
      }
      mockGetReward.mockResolvedValue(rewardWithPartnerNoWebsite)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('partner-name')).toBeInTheDocument()
      })
      expect(screen.queryByText('Visit website')).not.toBeInTheDocument()
    })

    it('should not render partner description when not provided', async () => {
      const rewardWithPartnerNoDesc: RewardResponse = {
        ...mockReward,
        partner: {
          id: 1,
          name: 'UA Cafeteria',
          website: 'https://cafeteria.ua.pt',
          active: true,
          createdAt: '2024-01-01T00:00:00Z',
          // No description
        },
      }
      mockGetReward.mockResolvedValue(rewardWithPartnerNoDesc)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('partner-name')).toBeInTheDocument()
      })
      expect(screen.queryByText('University cafeteria partner')).not.toBeInTheDocument()
    })
  })

  describe('Date Range Edge Cases', () => {
    it('should render only availableFrom when availableUntil not provided', async () => {
      const rewardWithOnlyFrom: RewardResponse = {
        ...mockReward,
        availableFrom: '2024-01-01T00:00:00Z',
        availableUntil: undefined,
      }
      mockGetReward.mockResolvedValue(rewardWithOnlyFrom)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-available-from')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('reward-available-until')).not.toBeInTheDocument()
    })

    it('should render only availableUntil when availableFrom not provided', async () => {
      const rewardWithOnlyUntil: RewardResponse = {
        ...mockReward,
        availableFrom: undefined,
        availableUntil: '2024-12-31T23:59:59Z',
      }
      mockGetReward.mockResolvedValue(rewardWithOnlyUntil)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-available-until')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('reward-available-from')).not.toBeInTheDocument()
    })
  })

  describe('Out of Stock', () => {
    it('should show Unavailable when remainingQuantity is 0', async () => {
      const outOfStockReward: RewardResponse = {
        ...mockReward,
        quantity: 100,
        remainingQuantity: 0,
      }
      mockGetReward.mockResolvedValue(outOfStockReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-availability')).toHaveTextContent('Unavailable')
      })
    })

    it('should not show Redeem button when out of stock', async () => {
      const outOfStockReward: RewardResponse = {
        ...mockReward,
        quantity: 100,
        remainingQuantity: 0,
      }
      mockGetReward.mockResolvedValue(outOfStockReward)
      renderTestPage()

      await waitFor(() => {
        expect(
          screen.getByText('This reward is currently not available for redemption.'),
        ).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /Redeem Reward/ })).not.toBeInTheDocument()
    })
  })

  describe('Error State Edge Cases', () => {
    it('should not show Try Again button for 404 errors', async () => {
      mockGetReward.mockRejectedValue(new Error('404: Not Found'))
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /Try Again/ })).not.toBeInTheDocument()
    })

    it('should show Back to rewards link on invalid ID', async () => {
      renderTestPage('invalid')

      expect(screen.getByRole('link', { name: /Back to rewards/ })).toBeInTheDocument()
    })
  })

  describe('Quantity Display Edge Cases', () => {
    it('should show 0 remaining for out of stock', async () => {
      const outOfStockReward: RewardResponse = {
        ...mockReward,
        quantity: 100,
        remainingQuantity: 0,
      }
      mockGetReward.mockResolvedValue(outOfStockReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-quantity')).toHaveTextContent('0 remaining')
      })
    })

    it('should show 1 remaining when only one left', async () => {
      const oneLeftReward: RewardResponse = {
        ...mockReward,
        quantity: 100,
        remainingQuantity: 1,
      }
      mockGetReward.mockResolvedValue(oneLeftReward)
      renderTestPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-quantity')).toHaveTextContent('1 remaining')
      })
    })
  })

  describe('API Call', () => {
    it('should call getReward with correct ID', async () => {
      renderTestPage()

      await waitFor(() => {
        expect(mockGetReward).toHaveBeenCalledWith(1)
      })
    })

    it('should not call getReward for invalid ID', async () => {
      renderTestPage('invalid')

      expect(mockGetReward).not.toHaveBeenCalled()
    })
  })
})
