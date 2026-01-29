import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RewardForm } from '@/components/reward/RewardForm'
import type { RewardResponse } from '@/lib/reward'

describe('RewardForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
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
})
