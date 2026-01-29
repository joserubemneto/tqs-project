import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditOpportunityModal } from '@/components/opportunity/EditOpportunityModal'
import type { OpportunityResponse } from '@/lib/opportunity'

// Mock the opportunity API
vi.mock('@/lib/opportunity', async () => {
  const actual = await vi.importActual('@/lib/opportunity')
  return {
    ...actual,
    updateOpportunity: vi.fn(),
    parseOpportunityError: vi.fn().mockResolvedValue('An error occurred'),
  }
})

// Mock the profile API for skills
vi.mock('@/lib/profile', () => ({
  getSkills: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Communication',
      category: 'COMMUNICATION',
      description: 'Communication skills',
    },
    { id: 2, name: 'Leadership', category: 'LEADERSHIP', description: 'Leadership skills' },
  ]),
}))

import { parseOpportunityError, updateOpportunity } from '@/lib/opportunity'

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
  requiredSkills: [
    {
      id: 1,
      name: 'Communication',
      category: 'COMMUNICATION',
      description: 'Communication skills',
    },
  ],
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

describe('EditOpportunityModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    expect(screen.queryByTestId('edit-modal-overlay')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', async () => {
    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('edit-modal-overlay')).toBeInTheDocument()
    })
  })

  it('should display opportunity data in form fields', async () => {
    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('edit-title-input')).toHaveValue('Test Opportunity')
    })
    expect(screen.getByTestId('edit-description-input')).toHaveValue('Test description')
    expect(screen.getByTestId('edit-points-input')).toHaveValue(50)
    expect(screen.getByTestId('edit-max-volunteers-input')).toHaveValue(10)
    expect(screen.getByTestId('edit-location-input')).toHaveValue('Test Location')
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('close-modal-button')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('close-modal-button'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('cancel-edit-button')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('cancel-edit-button'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when overlay is clicked', async () => {
    const user = userEvent.setup()

    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('edit-modal-overlay')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('edit-modal-overlay'))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show validation error when title is empty', async () => {
    const user = userEvent.setup()

    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('edit-title-input')).toBeInTheDocument()
    })

    // Clear the title field
    await user.clear(screen.getByTestId('edit-title-input'))

    // Submit the form
    await user.click(screen.getByTestId('save-edit-button'))

    expect(screen.getByText('Title is required')).toBeInTheDocument()
  })

  it('should call updateOpportunity and onSuccess on successful submit', async () => {
    const user = userEvent.setup()
    const updatedOpportunity = { ...mockOpportunity, title: 'Updated Title' }
    vi.mocked(updateOpportunity).mockResolvedValue(updatedOpportunity)

    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('edit-title-input')).toBeInTheDocument()
    })

    // Clear and update the title
    await user.clear(screen.getByTestId('edit-title-input'))
    await user.type(screen.getByTestId('edit-title-input'), 'Updated Title')

    // Submit the form
    await user.click(screen.getByTestId('save-edit-button'))

    await waitFor(() => {
      expect(updateOpportunity).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Updated Title',
        }),
      )
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedOpportunity)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should show error message on API error', async () => {
    const user = userEvent.setup()
    vi.mocked(updateOpportunity).mockRejectedValue(new Error('API Error'))
    vi.mocked(parseOpportunityError).mockResolvedValue('Cannot edit opportunity in current status')

    render(
      <EditOpportunityModal
        opportunity={mockOpportunity}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(screen.getByTestId('save-edit-button')).toBeInTheDocument()
    })

    // Submit the form
    await user.click(screen.getByTestId('save-edit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Cannot edit opportunity in current status',
      )
    })
  })
})
