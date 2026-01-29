import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RewardsManagement } from '@/components/reward/RewardsManagement'
import type { PageResponse, RewardResponse } from '@/lib/reward'

// Mock the reward API
const mockGetRewards = vi.fn()
const mockCreateReward = vi.fn()
const mockUpdateReward = vi.fn()
const mockDeleteReward = vi.fn()

vi.mock('@/lib/reward', async () => {
  const actual = await vi.importActual('@/lib/reward')
  return {
    ...actual,
    getRewards: (...args: unknown[]) => mockGetRewards(...args),
    createReward: (data: unknown) => mockCreateReward(data),
    updateReward: (id: number, data: unknown) => mockUpdateReward(id, data),
    deleteReward: (id: number) => mockDeleteReward(id),
  }
})

const mockRewards: RewardResponse[] = [
  {
    id: 1,
    title: 'Free Coffee',
    description: 'Get a free coffee at UA Cafeteria',
    pointsCost: 50,
    type: 'PARTNER_VOUCHER',
    partner: {
      id: 1,
      name: 'UA Cafeteria',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
    quantity: 100,
    remainingQuantity: 95,
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

const mockPageResponse: PageResponse<RewardResponse> = {
  content: mockRewards,
  totalElements: 2,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
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

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = createQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('RewardsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRewards.mockResolvedValue(mockPageResponse)
  })

  it('should render loading state initially', () => {
    mockGetRewards.mockReturnValue(new Promise(() => {})) // Never resolves
    renderWithQueryClient(<RewardsManagement />)

    expect(screen.getByText('Rewards Management')).toBeInTheDocument()
  })

  it('should render rewards list after loading', async () => {
    renderWithQueryClient(<RewardsManagement />)

    await waitFor(() => {
      expect(screen.getByText('Free Coffee')).toBeInTheDocument()
    })
    // Certificate appears both as title and as type badge, so use getAllByText
    expect(screen.getAllByText('Certificate').length).toBeGreaterThanOrEqual(1)
  })

  it('should show "Add Reward" button', async () => {
    renderWithQueryClient(<RewardsManagement />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Reward/ })).toBeInTheDocument()
    })
  })

  it('should show active count badge', async () => {
    renderWithQueryClient(<RewardsManagement />)

    await waitFor(() => {
      expect(screen.getByText('2 active')).toBeInTheDocument()
    })
  })

  it('should show empty state when no rewards', async () => {
    mockGetRewards.mockResolvedValue({
      ...mockPageResponse,
      content: [],
      totalElements: 0,
    })

    renderWithQueryClient(<RewardsManagement />)

    await waitFor(() => {
      expect(screen.getByText('No rewards yet')).toBeInTheDocument()
    })
    expect(screen.getByText('Create your first reward to get started')).toBeInTheDocument()
  })

  it('should open create form when "Add Reward" is clicked', async () => {
    renderWithQueryClient(<RewardsManagement />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Reward/ })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Add Reward/ }))

    await waitFor(() => {
      expect(screen.getByText('Create New Reward')).toBeInTheDocument()
    })
  })

  it('should show error state when loading fails', async () => {
    mockGetRewards.mockRejectedValue(new Error('Failed to load'))

    renderWithQueryClient(<RewardsManagement />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load rewards')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
  })

  it('should show Edit and Deactivate actions for each reward', async () => {
    renderWithQueryClient(<RewardsManagement />)

    await waitFor(() => {
      expect(screen.getByText('Free Coffee')).toBeInTheDocument()
    })

    // Should show edit and deactivate links for each reward
    const editButtons = screen.getAllByText('Edit')
    const deactivateButtons = screen.getAllByText('Deactivate')

    expect(editButtons).toHaveLength(2)
    expect(deactivateButtons).toHaveLength(2)
  })
})
