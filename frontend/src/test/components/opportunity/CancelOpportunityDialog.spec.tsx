import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CancelOpportunityDialog } from '@/components/opportunity/CancelOpportunityDialog'
import type { OpportunityResponse } from '@/lib/opportunity'

// Mock the opportunity API
vi.mock('@/lib/opportunity', async () => {
  const actual = await vi.importActual('@/lib/opportunity')
  return {
    ...actual,
    cancelOpportunity: vi.fn(),
    parseOpportunityError: vi.fn().mockResolvedValue('An error occurred'),
  }
})

import { cancelOpportunity, parseOpportunityError } from '@/lib/opportunity'

const mockOpportunity: OpportunityResponse = {
  id: 1,
  title: 'Test Opportunity',
  description: 'Test description',
  pointsReward: 50,
  startDate: '2024-02-01T09:00:00Z',
  endDate: '2024-02-07T17:00:00Z',
  maxVolunteers: 10,
  status: 'DRAFT',
  location: 'Test Location',
  promoter: {
    id: 1,
    email: 'promoter@ua.pt',
    name: 'Promoter',
    role: 'PROMOTER',
    points: 0,
    createdAt: '2024-01-01T00:00:00Z',
  },
  requiredSkills: [],
  createdAt: '2024-01-15T00:00:00Z',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('CancelOpportunityDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <CancelOpportunityDialog
        opportunity={mockOpportunity}
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.queryByTestId('cancel-dialog-overlay')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <CancelOpportunityDialog
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByTestId('cancel-dialog-overlay')).toBeInTheDocument()
  })

  it('should display opportunity title in confirmation message', () => {
    render(
      <CancelOpportunityDialog
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText(/"Test Opportunity"/)).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <CancelOpportunityDialog
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('close-dialog-button'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when keep opportunity button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <CancelOpportunityDialog
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('keep-opportunity-button'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call cancelOpportunity and onSuccess on confirm', async () => {
    const user = userEvent.setup()
    const cancelledOpportunity = { ...mockOpportunity, status: 'CANCELLED' as const }
    vi.mocked(cancelOpportunity).mockResolvedValue(cancelledOpportunity)

    render(
      <CancelOpportunityDialog
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('confirm-cancel-button'))

    await waitFor(() => {
      expect(cancelOpportunity).toHaveBeenCalledWith(1)
      expect(mockOnSuccess).toHaveBeenCalledWith(cancelledOpportunity)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should show error message on API error', async () => {
    const user = userEvent.setup()
    vi.mocked(cancelOpportunity).mockRejectedValue(new Error('API Error'))
    vi.mocked(parseOpportunityError).mockResolvedValue('Cannot cancel opportunity in progress')

    render(
      <CancelOpportunityDialog
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('confirm-cancel-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Cannot cancel opportunity in progress',
      )
    })

    // Should not close on error
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should show loading state while cancelling', async () => {
    const user = userEvent.setup()
    // Create a promise that we can control
    let resolveCancel: (value: OpportunityResponse) => void
    const cancelPromise = new Promise<OpportunityResponse>((resolve) => {
      resolveCancel = resolve
    })
    vi.mocked(cancelOpportunity).mockReturnValue(cancelPromise)

    render(
      <CancelOpportunityDialog
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('confirm-cancel-button'))

    // Button should show loading text
    expect(screen.getByTestId('confirm-cancel-button')).toHaveTextContent('Cancelling...')

    // Resolve the promise
    resolveCancel!({ ...mockOpportunity, status: 'CANCELLED' })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })
})
