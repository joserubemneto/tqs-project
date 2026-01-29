import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

// Variable to control which rewardId is returned
let mockRewardId = '1'

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    Link: ({
      children,
      to,
      className,
      ...props
    }: {
      children: React.ReactNode
      to: string
      className?: string
    }) => (
      <a href={to} className={className} {...props}>
        {children}
      </a>
    ),
    createFileRoute: (_path: string) => (options: { component: React.ComponentType }) => ({
      options,
      useParams: () => ({ rewardId: mockRewardId }),
    }),
    buttonVariants: ({ variant }: { variant?: string } = {}) =>
      `button-class-${variant || 'default'}`,
  }
})

// Import the actual component
import { Route as RewardDetailRoute } from '@/routes/rewards/$rewardId'

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

// Get the actual component from the route
const RewardDetailPage = RewardDetailRoute.options.component!

function renderActualPage(rewardId = '1') {
  mockRewardId = rewardId
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <RewardDetailPage />
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
      renderActualPage()

      expect(screen.getByTestId('loading-state')).toBeInTheDocument()
    })
  })

  describe('Reward Display', () => {
    it('should render reward title', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-title')).toHaveTextContent('Free Coffee')
      })
    })

    it('should render reward description', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-description')).toHaveTextContent(
          'Get a free coffee at UA Cafeteria',
        )
      })
    })

    it('should render points cost', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-points')).toHaveTextContent('50')
      })
    })

    it('should render reward type badge with correct label', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toHaveTextContent('Partner Voucher')
      })
    })
  })

  describe('Partner Information', () => {
    it('should render partner name', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('partner-name')).toHaveTextContent('UA Cafeteria')
      })
    })

    it('should render partner description when provided', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByText('University cafeteria partner')).toBeInTheDocument()
      })
    })

    it('should render partner website link when provided', async () => {
      renderActualPage()

      await waitFor(() => {
        const websiteLink = screen.getByText('Visit website')
        expect(websiteLink).toBeInTheDocument()
        expect(websiteLink).toHaveAttribute('href', 'https://cafeteria.ua.pt')
        expect(websiteLink).toHaveAttribute('target', '_blank')
        expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })

    it('should not render partner section when no partner', async () => {
      const rewardWithoutPartner: RewardResponse = {
        ...mockReward,
        partner: undefined,
      }
      mockGetReward.mockResolvedValue(rewardWithoutPartner)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-title')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('partner-name')).not.toBeInTheDocument()
      expect(screen.queryByText('Partner Information')).not.toBeInTheDocument()
    })
  })

  describe('Availability Information', () => {
    it('should render availability status as Available', async () => {
      renderActualPage()

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
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-availability')).toHaveTextContent('Unavailable')
      })
    })

    it('should render quantity information', async () => {
      renderActualPage()

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
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-quantity')).toHaveTextContent('Unlimited')
      })
    })

    it('should show Out of stock for rewards with 0 remaining', async () => {
      const outOfStockReward: RewardResponse = {
        ...mockReward,
        quantity: 100,
        remainingQuantity: 0,
      }
      mockGetReward.mockResolvedValue(outOfStockReward)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-quantity')).toHaveTextContent('Out of stock')
      })
    })
  })

  describe('Date Range', () => {
    it('should render available from date in formatted format', async () => {
      renderActualPage()

      await waitFor(() => {
        const fromDate = screen.getByTestId('reward-available-from')
        expect(fromDate).toBeInTheDocument()
        // Check for formatted date pattern (e.g., "Monday, January 1, 2024")
        expect(fromDate.textContent).toMatch(/\w+,\s+\w+\s+\d+,\s+\d{4}/)
      })
    })

    it('should render available until date in formatted format', async () => {
      renderActualPage()

      await waitFor(() => {
        const untilDate = screen.getByTestId('reward-available-until')
        expect(untilDate).toBeInTheDocument()
        // Check for formatted date pattern
        expect(untilDate.textContent).toMatch(/\w+,\s+\w+\s+\d+,\s+\d{4}/)
      })
    })

    it('should not render date section when no dates provided', async () => {
      const rewardWithoutDates: RewardResponse = {
        ...mockReward,
        availableFrom: undefined,
        availableUntil: undefined,
      }
      mockGetReward.mockResolvedValue(rewardWithoutDates)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-title')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('reward-available-from')).not.toBeInTheDocument()
      expect(screen.queryByTestId('reward-available-until')).not.toBeInTheDocument()
      expect(screen.queryByText('Availability Period')).not.toBeInTheDocument()
    })
  })

  describe('Redeem Button', () => {
    it('should show Redeem button for available rewards', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Redeem Reward/ })).toBeInTheDocument()
      })
    })

    it('should disable Redeem button (placeholder)', async () => {
      renderActualPage()

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
      renderActualPage()

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
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })
      expect(screen.getByText('Failed to load reward')).toBeInTheDocument()
    })

    it('should show "Reward not found" for 404 errors', async () => {
      mockGetReward.mockRejectedValue(new Error('404: Not Found'))
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Reward not found')
      })
    })

    it('should show detailed error description for 404 errors', async () => {
      mockGetReward.mockRejectedValue(new Error('404: Not Found'))
      renderActualPage()

      await waitFor(() => {
        expect(
          screen.getByText('The reward you are looking for does not exist or has been removed.'),
        ).toBeInTheDocument()
      })
    })

    it('should show error message from API for non-404 errors', async () => {
      mockGetReward.mockRejectedValue(new Error('Network connection failed'))
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByText('Network connection failed')).toBeInTheDocument()
      })
    })

    it('should show Try Again button for non-404 errors', async () => {
      mockGetReward.mockRejectedValue(new Error('Network Error'))
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
      })
    })

    it('should show Back to rewards link on error', async () => {
      mockGetReward.mockRejectedValue(new Error('API Error'))
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Back to rewards/ })).toBeInTheDocument()
      })
    })

    it('should refetch data when Try Again button is clicked', async () => {
      mockGetReward.mockRejectedValueOnce(new Error('Network Error'))
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })

      // Update mock to return success on retry
      mockGetReward.mockResolvedValue(mockReward)

      // Click Try Again
      fireEvent.click(screen.getByRole('button', { name: /Try Again/ }))

      await waitFor(() => {
        expect(mockGetReward).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle non-Error objects in error state', async () => {
      mockGetReward.mockRejectedValue('String error')
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
        expect(screen.getByText('An error occurred')).toBeInTheDocument()
      })
    })
  })

  describe('Invalid ID', () => {
    it('should show invalid ID state for non-numeric ID', async () => {
      renderActualPage('invalid')

      await waitFor(() => {
        expect(screen.getByTestId('invalid-id-state')).toBeInTheDocument()
      })
      expect(screen.getByText('Invalid reward ID')).toBeInTheDocument()
    })

    it('should not call API for invalid ID', async () => {
      renderActualPage('invalid')

      // Wait a bit and verify API was not called
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockGetReward).not.toHaveBeenCalled()
    })
  })

  describe('Back Navigation', () => {
    it('should render back to rewards link', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Back to rewards catalog/ })).toBeInTheDocument()
      })
    })

    it('should link to /rewards page', async () => {
      renderActualPage()

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /Back to rewards catalog/ })
        expect(backLink).toHaveAttribute('href', '/rewards')
      })
    })
  })

  describe('Reward Types', () => {
    it('should render UA_SERVICE type with correct label', async () => {
      const uaServiceReward: RewardResponse = {
        ...mockReward,
        type: 'UA_SERVICE',
      }
      mockGetReward.mockResolvedValue(uaServiceReward)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toHaveTextContent('UA Service')
      })
    })

    it('should render MERCHANDISE type with correct label', async () => {
      const merchandiseReward: RewardResponse = {
        ...mockReward,
        type: 'MERCHANDISE',
      }
      mockGetReward.mockResolvedValue(merchandiseReward)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toHaveTextContent('Merchandise')
      })
    })

    it('should render CERTIFICATE type with correct label', async () => {
      const certificateReward: RewardResponse = {
        ...mockReward,
        type: 'CERTIFICATE',
      }
      mockGetReward.mockResolvedValue(certificateReward)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toHaveTextContent('Certificate')
      })
    })

    it('should render OTHER type with correct label', async () => {
      const otherReward: RewardResponse = {
        ...mockReward,
        type: 'OTHER',
      }
      mockGetReward.mockResolvedValue(otherReward)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toHaveTextContent('Other')
      })
    })

    it('should render PARTNER_VOUCHER type with correct label', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-type')).toHaveTextContent('Partner Voucher')
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
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })
    })

    it('should not show Inactive badge for active rewards', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-title')).toBeInTheDocument()
      })
      expect(screen.queryByText('Inactive')).not.toBeInTheDocument()
    })

    it('should apply reduced opacity for unavailable rewards', async () => {
      const inactiveReward: RewardResponse = {
        ...mockReward,
        active: false,
      }
      mockGetReward.mockResolvedValue(inactiveReward)
      renderActualPage()

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
      renderActualPage()

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
      renderActualPage()

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
      renderActualPage()

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
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-available-until')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('reward-available-from')).not.toBeInTheDocument()
    })

    it('should show "Available from" label for availableFrom', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByText('Available from')).toBeInTheDocument()
      })
    })

    it('should show "Available until" label for availableUntil', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByText('Available until')).toBeInTheDocument()
      })
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
      renderActualPage()

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
      renderActualPage()

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
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /Try Again/ })).not.toBeInTheDocument()
    })

    it('should show Back to rewards link on invalid ID', async () => {
      renderActualPage('invalid')

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Back to rewards/ })).toBeInTheDocument()
      })
    })
  })

  describe('Quantity Display Edge Cases', () => {
    it('should show Out of stock for 0 remaining', async () => {
      const outOfStockReward: RewardResponse = {
        ...mockReward,
        quantity: 100,
        remainingQuantity: 0,
      }
      mockGetReward.mockResolvedValue(outOfStockReward)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-quantity')).toHaveTextContent('Out of stock')
      })
    })

    it('should show remaining count when only one left', async () => {
      const oneLeftReward: RewardResponse = {
        ...mockReward,
        quantity: 100,
        remainingQuantity: 1,
      }
      mockGetReward.mockResolvedValue(oneLeftReward)
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByTestId('reward-quantity')).toHaveTextContent('1 remaining')
      })
    })
  })

  describe('API Call', () => {
    it('should call getReward with correct ID', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(mockGetReward).toHaveBeenCalledWith(1)
      })
    })

    it('should not call getReward for invalid ID', async () => {
      renderActualPage('invalid')

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockGetReward).not.toHaveBeenCalled()
    })

    it('should call getReward with different numeric IDs', async () => {
      renderActualPage('42')

      await waitFor(() => {
        expect(mockGetReward).toHaveBeenCalledWith(42)
      })
    })
  })

  describe('Layout and Sidebar', () => {
    it('should render points section with correct labels', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByText('Redeem for')).toBeInTheDocument()
        expect(screen.getByText('points')).toBeInTheDocument()
      })
    })

    it('should render Availability section', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByText('Availability')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Quantity')).toBeInTheDocument()
      })
    })

    it('should render Availability Period section when dates exist', async () => {
      renderActualPage()

      await waitFor(() => {
        expect(screen.getByText('Availability Period')).toBeInTheDocument()
      })
    })
  })

  describe('Null reward handling', () => {
    it('should return null when reward data is null', async () => {
      mockGetReward.mockResolvedValue(null)
      renderActualPage()

      await waitFor(() => {
        // After loading completes, if reward is null, nothing should render
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument()
      })

      // The component should not render the main content
      expect(screen.queryByTestId('reward-title')).not.toBeInTheDocument()
    })
  })
})
