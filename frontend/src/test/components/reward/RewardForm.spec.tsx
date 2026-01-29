import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RewardForm } from '@/components/reward/RewardForm'
import type { RewardResponse } from '@/lib/reward'

// Mock the partner API
const mockGetActivePartners = vi.fn()

vi.mock('@/lib/partner', () => ({
  getActivePartners: () => mockGetActivePartners(),
}))

const mockPartners = [
  {
    id: 1,
    name: 'UA Cafeteria',
    description: 'University cafeteria',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Campus Bookstore',
    description: 'University bookstore',
    active: true,
    createdAt: '2024-01-02T00:00:00Z',
  },
]

describe('RewardForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
    mockGetActivePartners.mockClear()
    mockGetActivePartners.mockResolvedValue(mockPartners)
  })

  it('should render all form fields', () => {
    render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/Title/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Points Cost/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Quantity/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Available From/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Available Until/)).toBeInTheDocument()
  })

  it('should show validation errors for empty required fields', async () => {
    render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const submitButton = screen.getByRole('button', { name: /Create Reward/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Title is required/)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show validation error for invalid points cost', async () => {
    const user = userEvent.setup()
    render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.type(screen.getByLabelText(/Title/), 'Test Reward')
    await user.type(screen.getByLabelText(/Description/), 'Test description')
    // Leave points cost empty to trigger validation error

    const submitButton = screen.getByRole('button', { name: /Create Reward/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Points cost must be at least 1/)).toBeInTheDocument()
    })
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should call onSubmit with valid data', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValueOnce(undefined)

    render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.type(screen.getByLabelText(/Title/), 'New Reward')
    await user.type(screen.getByLabelText(/Description/), 'A great reward')
    await user.clear(screen.getByLabelText(/Points Cost/))
    await user.type(screen.getByLabelText(/Points Cost/), '100')

    const submitButton = screen.getByRole('button', { name: /Create Reward/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Reward',
          description: 'A great reward',
          pointsCost: 100,
        }),
      )
    })
  })

  it('should call onCancel when cancel button is clicked', async () => {
    render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByRole('button', { name: /Cancel/ })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should pre-fill form when editing existing reward', () => {
    const existingReward: RewardResponse = {
      id: 1,
      title: 'Existing Reward',
      description: 'Existing description',
      pointsCost: 75,
      type: 'CERTIFICATE',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
    }

    render(
      <RewardForm initialData={existingReward} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    )

    expect(screen.getByLabelText(/Title/)).toHaveValue('Existing Reward')
    expect(screen.getByLabelText(/Description/)).toHaveValue('Existing description')
    expect(screen.getByLabelText(/Points Cost/)).toHaveValue(75)
  })

  it('should show "Update Reward" button when editing', () => {
    const existingReward: RewardResponse = {
      id: 1,
      title: 'Existing Reward',
      description: 'Existing description',
      pointsCost: 75,
      type: 'CERTIFICATE',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
    }

    render(
      <RewardForm initialData={existingReward} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    )

    expect(screen.getByRole('button', { name: /Update Reward/ })).toBeInTheDocument()
  })

  it('should show active checkbox when editing', () => {
    const existingReward: RewardResponse = {
      id: 1,
      title: 'Existing Reward',
      description: 'Existing description',
      pointsCost: 75,
      type: 'CERTIFICATE',
      active: true,
      createdAt: '2024-01-01T00:00:00Z',
    }

    render(
      <RewardForm initialData={existingReward} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    )

    expect(screen.getByLabelText(/Active/)).toBeInTheDocument()
  })

  it('should disable buttons when submitting', () => {
    render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isSubmitting={true} />)

    expect(screen.getByRole('button', { name: /Saving/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeDisabled()
  })

  describe('Partner Selection', () => {
    it('should not show partner selector for non-partner voucher types', () => {
      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      // Default type is OTHER, so partner selector should not be visible
      expect(screen.queryByLabelText(/Partner/)).not.toBeInTheDocument()
    })

    it('should show partner selector when type is PARTNER_VOUCHER', async () => {
      const user = userEvent.setup()
      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      // Change type to PARTNER_VOUCHER
      await user.selectOptions(screen.getByLabelText(/Type/), 'PARTNER_VOUCHER')

      await waitFor(() => {
        expect(screen.getByLabelText(/Partner/)).toBeInTheDocument()
      })
    })

    it('should load partners when type is PARTNER_VOUCHER', async () => {
      const user = userEvent.setup()
      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.selectOptions(screen.getByLabelText(/Type/), 'PARTNER_VOUCHER')

      await waitFor(() => {
        expect(mockGetActivePartners).toHaveBeenCalled()
      })
    })

    it('should show partner options in dropdown', async () => {
      const user = userEvent.setup()
      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.selectOptions(screen.getByLabelText(/Type/), 'PARTNER_VOUCHER')

      await waitFor(() => {
        expect(screen.getByText('UA Cafeteria')).toBeInTheDocument()
        expect(screen.getByText('Campus Bookstore')).toBeInTheDocument()
      })
    })

    it('should show loading message while partners are being fetched', async () => {
      mockGetActivePartners.mockReturnValue(new Promise(() => {})) // Never resolves
      const user = userEvent.setup()
      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.selectOptions(screen.getByLabelText(/Type/), 'PARTNER_VOUCHER')

      await waitFor(() => {
        expect(screen.getByText('Loading partners...')).toBeInTheDocument()
      })
    })

    it('should show message when no partners available', async () => {
      mockGetActivePartners.mockResolvedValue([])
      const user = userEvent.setup()
      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.selectOptions(screen.getByLabelText(/Type/), 'PARTNER_VOUCHER')

      await waitFor(() => {
        expect(screen.getByText('No active partners available')).toBeInTheDocument()
      })
    })

    it('should clear partner when type changes away from PARTNER_VOUCHER', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValueOnce(undefined)

      const existingReward: RewardResponse = {
        id: 1,
        title: 'Test',
        description: 'Test desc',
        pointsCost: 50,
        type: 'PARTNER_VOUCHER',
        partner: { id: 1, name: 'UA Cafeteria', active: true, createdAt: '2024-01-01' },
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
      }

      render(
        <RewardForm initialData={existingReward} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
      )

      // Change type away from PARTNER_VOUCHER
      await user.selectOptions(screen.getByLabelText(/Type/), 'CERTIFICATE')

      // Partner selector should no longer be visible
      expect(screen.queryByLabelText(/Partner/)).not.toBeInTheDocument()
    })

    it('should include partnerId in submit data when selected', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValueOnce(undefined)

      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText(/Title/), 'New Reward')
      await user.type(screen.getByLabelText(/Description/), 'A great reward')
      await user.clear(screen.getByLabelText(/Points Cost/))
      await user.type(screen.getByLabelText(/Points Cost/), '100')
      await user.selectOptions(screen.getByLabelText(/Type/), 'PARTNER_VOUCHER')

      await waitFor(() => {
        expect(screen.getByText('UA Cafeteria')).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText(/Partner/), '1')

      fireEvent.click(screen.getByRole('button', { name: /Create Reward/ }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            partnerId: 1,
          }),
        )
      })
    })
  })

  describe('Date Validation', () => {
    it('should show error when end date is before start date', async () => {
      const user = userEvent.setup()
      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText(/Title/), 'Test Reward')
      await user.type(screen.getByLabelText(/Description/), 'Test description')
      await user.clear(screen.getByLabelText(/Points Cost/))
      await user.type(screen.getByLabelText(/Points Cost/), '50')

      // Set end date before start date
      fireEvent.change(screen.getByLabelText(/Available From/), {
        target: { value: '2024-12-31T00:00' },
      })
      fireEvent.change(screen.getByLabelText(/Available Until/), {
        target: { value: '2024-01-01T00:00' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Reward/ }))

      await waitFor(() => {
        expect(screen.getByText(/End date must be after start date/)).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Quantity Field', () => {
    it('should allow empty quantity for unlimited rewards', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockResolvedValueOnce(undefined)

      render(<RewardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

      await user.type(screen.getByLabelText(/Title/), 'Test Reward')
      await user.type(screen.getByLabelText(/Description/), 'Test description')
      await user.clear(screen.getByLabelText(/Points Cost/))
      await user.type(screen.getByLabelText(/Points Cost/), '50')
      // Leave quantity empty

      fireEvent.click(screen.getByRole('button', { name: /Create Reward/ }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: undefined,
          }),
        )
      })
    })
  })
})
