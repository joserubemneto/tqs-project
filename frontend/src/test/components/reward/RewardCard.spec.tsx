import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RewardCard } from '@/components/reward/RewardCard'
import type { RewardResponse } from '@/lib/reward'

// Mock TanStack Router's Link component
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: React.ReactNode
    to: string
    params?: Record<string, string>
  }) => {
    const href = params?.rewardId ? to.replace('$rewardId', params.rewardId) : to
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

const mockReward: RewardResponse = {
  id: 1,
  title: 'Free Coffee',
  description: 'Get a free coffee at UA Cafeteria',
  pointsCost: 50,
  type: 'PARTNER_VOUCHER',
  partner: {
    id: 1,
    name: 'UA Cafeteria',
    description: 'University cafeteria',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  quantity: 100,
  remainingQuantity: 95,
  active: true,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('RewardCard', () => {
  describe('Basic Rendering', () => {
    it('should render reward title', () => {
      render(<RewardCard reward={mockReward} />)
      expect(screen.getByText('Free Coffee')).toBeInTheDocument()
    })

    it('should render reward description', () => {
      render(<RewardCard reward={mockReward} />)
      expect(screen.getByText('Get a free coffee at UA Cafeteria')).toBeInTheDocument()
    })

    it('should render points cost', () => {
      render(<RewardCard reward={mockReward} />)
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('points')).toBeInTheDocument()
    })

    it('should render reward type badge', () => {
      render(<RewardCard reward={mockReward} />)
      expect(screen.getByText('Partner Voucher')).toBeInTheDocument()
    })

    it('should render partner name when provided', () => {
      render(<RewardCard reward={mockReward} />)
      expect(screen.getByText(/Provided by UA Cafeteria/)).toBeInTheDocument()
    })

    it('should render remaining quantity', () => {
      render(<RewardCard reward={mockReward} />)
      expect(screen.getByText('95 remaining')).toBeInTheDocument()
    })
  })

  describe('Quantity Display', () => {
    it('should show "Unlimited" for rewards without quantity limit', () => {
      const unlimitedReward: RewardResponse = {
        ...mockReward,
        quantity: undefined,
        remainingQuantity: undefined,
      }
      render(<RewardCard reward={unlimitedReward} />)
      expect(screen.getByText('Unlimited')).toBeInTheDocument()
    })

    it('should show "Out of stock" when remaining quantity is 0', () => {
      const outOfStockReward: RewardResponse = {
        ...mockReward,
        quantity: 100,
        remainingQuantity: 0,
      }
      render(<RewardCard reward={outOfStockReward} />)
      expect(screen.getByText('Out of stock')).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should show "Inactive" badge for inactive rewards', () => {
      const inactiveReward: RewardResponse = {
        ...mockReward,
        active: false,
      }
      render(<RewardCard reward={inactiveReward} />)
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    it('should apply reduced opacity to unavailable rewards', () => {
      const unavailableReward: RewardResponse = {
        ...mockReward,
        active: false,
      }
      const { container } = render(<RewardCard reward={unavailableReward} />)
      const card = container.querySelector('[class*="opacity-60"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Partner Display', () => {
    it('should not show partner section when no partner', () => {
      const noPartnerReward: RewardResponse = {
        ...mockReward,
        partner: undefined,
      }
      render(<RewardCard reward={noPartnerReward} />)
      expect(screen.queryByText(/Provided by/)).not.toBeInTheDocument()
    })
  })

  describe('Date Display', () => {
    it('should render availability dates when provided', () => {
      const rewardWithDates: RewardResponse = {
        ...mockReward,
        availableFrom: '2024-01-01T00:00:00Z',
        availableUntil: '2024-12-31T23:59:59Z',
      }
      render(<RewardCard reward={rewardWithDates} />)
      expect(screen.getByText(/From/)).toBeInTheDocument()
      expect(screen.getByText(/Until/)).toBeInTheDocument()
    })

    it('should render only start date when end date is not provided', () => {
      const rewardWithStartDate: RewardResponse = {
        ...mockReward,
        availableFrom: '2024-01-01T00:00:00Z',
        availableUntil: undefined,
      }
      render(<RewardCard reward={rewardWithStartDate} />)
      expect(screen.getByText(/From/)).toBeInTheDocument()
      expect(screen.queryByText(/Until/)).not.toBeInTheDocument()
    })

    it('should render only end date when start date is not provided', () => {
      const rewardWithEndDate: RewardResponse = {
        ...mockReward,
        availableFrom: undefined,
        availableUntil: '2024-12-31T23:59:59Z',
      }
      render(<RewardCard reward={rewardWithEndDate} />)
      expect(screen.queryByText(/From/)).not.toBeInTheDocument()
      expect(screen.getByText(/Until/)).toBeInTheDocument()
    })

    it('should not render date section when no dates provided', () => {
      const rewardWithNoDates: RewardResponse = {
        ...mockReward,
        availableFrom: undefined,
        availableUntil: undefined,
      }
      render(<RewardCard reward={rewardWithNoDates} />)
      // Check that the date-related text is not present
      expect(screen.queryByText(/From.*Jan/)).not.toBeInTheDocument()
    })
  })

  describe('Reward Type Badges', () => {
    it('should render UA Service badge correctly', () => {
      const uaServiceReward: RewardResponse = {
        ...mockReward,
        type: 'UA_SERVICE',
      }
      render(<RewardCard reward={uaServiceReward} />)
      expect(screen.getByText('UA Service')).toBeInTheDocument()
    })

    it('should render Merchandise badge correctly', () => {
      const merchandiseReward: RewardResponse = {
        ...mockReward,
        type: 'MERCHANDISE',
      }
      render(<RewardCard reward={merchandiseReward} />)
      expect(screen.getByText('Merchandise')).toBeInTheDocument()
    })

    it('should render Certificate badge correctly', () => {
      const certificateReward: RewardResponse = {
        ...mockReward,
        type: 'CERTIFICATE',
      }
      render(<RewardCard reward={certificateReward} />)
      expect(screen.getByText('Certificate')).toBeInTheDocument()
    })

    it('should render Other badge correctly', () => {
      const otherReward: RewardResponse = {
        ...mockReward,
        type: 'OTHER',
      }
      render(<RewardCard reward={otherReward} />)
      expect(screen.getByText('Other')).toBeInTheDocument()
    })
  })

  describe('Actions (Admin View)', () => {
    it('should show Edit button when showActions and onEdit provided', () => {
      const mockOnEdit = vi.fn()
      render(<RewardCard reward={mockReward} showActions onEdit={mockOnEdit} />)
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('should show Deactivate button when showActions and onDelete provided', () => {
      const mockOnDelete = vi.fn()
      render(<RewardCard reward={mockReward} showActions onDelete={mockOnDelete} />)
      expect(screen.getByText('Deactivate')).toBeInTheDocument()
    })

    it('should call onEdit when Edit button is clicked', () => {
      const mockOnEdit = vi.fn()
      render(<RewardCard reward={mockReward} showActions onEdit={mockOnEdit} />)

      fireEvent.click(screen.getByText('Edit'))
      expect(mockOnEdit).toHaveBeenCalledWith(mockReward)
    })

    it('should call onDelete when Deactivate button is clicked', () => {
      const mockOnDelete = vi.fn()
      render(<RewardCard reward={mockReward} showActions onDelete={mockOnDelete} />)

      fireEvent.click(screen.getByText('Deactivate'))
      expect(mockOnDelete).toHaveBeenCalledWith(mockReward)
    })

    it('should not show action buttons when showActions is false', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()
      render(<RewardCard reward={mockReward} onEdit={mockOnEdit} onDelete={mockOnDelete} />)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.queryByText('Deactivate')).not.toBeInTheDocument()
    })

    it('should not show action buttons when callbacks are not provided', () => {
      render(<RewardCard reward={mockReward} showActions />)

      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.queryByText('Deactivate')).not.toBeInTheDocument()
    })

    it('should show both Edit and Deactivate buttons when both callbacks provided', () => {
      const mockOnEdit = vi.fn()
      const mockOnDelete = vi.fn()
      render(
        <RewardCard reward={mockReward} showActions onEdit={mockOnEdit} onDelete={mockOnDelete} />,
      )

      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Deactivate')).toBeInTheDocument()
    })
  })

  describe('Clickable Card (Public View)', () => {
    it('should render as a link when showActions is false', () => {
      render(<RewardCard reward={mockReward} />)

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/rewards/1')
    })

    it('should not render as a link when showActions is true', () => {
      render(<RewardCard reward={mockReward} showActions />)

      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('should have hover effect class when clickable', () => {
      const { container } = render(<RewardCard reward={mockReward} />)

      // Check for the hover class in the card element
      const card = container.querySelector('[class*="hover:shadow"]')
      expect(card).toBeInTheDocument()
    })
  })
})
