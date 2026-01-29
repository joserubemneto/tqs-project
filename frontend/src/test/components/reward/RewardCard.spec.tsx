import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RewardCard } from '@/components/reward/RewardCard'
import type { RewardResponse } from '@/lib/reward'

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

  it('should show "Unlimited" for rewards without quantity limit', () => {
    const unlimitedReward: RewardResponse = {
      ...mockReward,
      quantity: undefined,
      remainingQuantity: undefined,
    }
    render(<RewardCard reward={unlimitedReward} />)
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
  })

  it('should show "Inactive" badge for inactive rewards', () => {
    const inactiveReward: RewardResponse = {
      ...mockReward,
      active: false,
    }
    render(<RewardCard reward={inactiveReward} />)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('should not show partner section when no partner', () => {
    const noPartnerReward: RewardResponse = {
      ...mockReward,
      partner: undefined,
    }
    render(<RewardCard reward={noPartnerReward} />)
    expect(screen.queryByText(/Provided by/)).not.toBeInTheDocument()
  })

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
})
