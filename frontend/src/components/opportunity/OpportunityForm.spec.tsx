import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { OpportunityForm } from './OpportunityForm'

// Mock the opportunity module
vi.mock('@/lib/opportunity', () => ({
  createOpportunity: vi.fn(),
  parseOpportunityError: vi.fn(),
}))

// Mock the profile module for getSkills
vi.mock('@/lib/profile', () => ({
  getSkills: vi.fn(),
}))

import { createOpportunity, parseOpportunityError } from '@/lib/opportunity'
import { getSkills } from '@/lib/profile'

describe('OpportunityForm', () => {
  const mockOnSuccess = vi.fn()

  const mockSkills = [
    {
      id: 1,
      name: 'Communication',
      category: 'COMMUNICATION' as const,
      description: 'Effective communication',
    },
    { id: 2, name: 'Leadership', category: 'LEADERSHIP' as const, description: 'Ability to lead' },
    {
      id: 3,
      name: 'Programming',
      category: 'TECHNICAL' as const,
      description: 'Software development',
    },
  ]

  const mockOpportunityResponse = {
    id: 1,
    title: 'UA Open Day Support',
    description: 'Help with university open day activities',
    pointsReward: 50,
    startDate: '2024-02-01T09:00:00Z',
    endDate: '2024-02-07T17:00:00Z',
    maxVolunteers: 10,
    status: 'DRAFT' as const,
    location: 'University Campus',
    promoter: {
      id: 1,
      email: 'promoter@ua.pt',
      name: 'Promoter',
      role: 'PROMOTER' as const,
      points: 0,
      createdAt: '2024-01-01T00:00:00Z',
    },
    requiredSkills: [{ id: 1, name: 'Communication', category: 'COMMUNICATION' as const }],
    createdAt: '2024-01-15T00:00:00Z',
  }

  // Helper to get future dates for form input
  const getStartDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().slice(0, 16)
  }

  const getEndDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 16)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSkills).mockResolvedValue(mockSkills)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading indicator while fetching skills', () => {
      vi.mocked(getSkills).mockImplementation(() => new Promise(() => {}))

      render(<OpportunityForm />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should call getSkills on mount', async () => {
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(getSkills).toHaveBeenCalled()
      })
    })
  })

  describe('Rendering', () => {
    it('should render the form with all fields after loading', async () => {
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create opportunity/i })).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/points reward/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/max volunteers/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
      expect(screen.getByText('Required Skills')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create opportunity/i })).toBeInTheDocument()
    })

    it('should display available skills by category', async () => {
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Communication' })).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: 'Leadership' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Programming' })).toBeInTheDocument()
    })

    it('should display character count for description', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/description/i), 'Test description')

      expect(
        screen.getByText((_content, element) => {
          return element?.tagName === 'SPAN' && element?.textContent === '16/2000'
        }),
      ).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when title is empty', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })

    it('should show error when description is empty', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      expect(screen.getByText(/description is required/i)).toBeInTheDocument()
    })

    it('should show error when points reward is empty', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      expect(screen.getByText(/points reward is required/i)).toBeInTheDocument()
    })

    it('should show error when max volunteers is less than 1', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '0')
      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      expect(screen.getByText(/max volunteers must be at least 1/i)).toBeInTheDocument()
    })

    it('should show error when end date is before start date', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      const laterDate = getEndDate()
      const earlierDate = getStartDate()

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '10')
      await user.type(screen.getByLabelText(/start date/i), laterDate)
      await user.type(screen.getByLabelText(/end date/i), earlierDate)
      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument()
    })

    it('should show error when no skills are selected', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '10')
      await user.type(screen.getByLabelText(/start date/i), getStartDate())
      await user.type(screen.getByLabelText(/end date/i), getEndDate())
      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      expect(screen.getByText(/at least one skill is required/i)).toBeInTheDocument()
    })

    it('should not call createOpportunity if validation fails', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      expect(createOpportunity).not.toHaveBeenCalled()
    })
  })

  describe('Skill Selection', () => {
    it('should toggle skill selection when clicked', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Communication' })).toBeInTheDocument()
      })

      const communicationButton = screen.getByRole('button', { name: 'Communication' })

      // Initially not selected
      expect(communicationButton).not.toHaveClass('bg-primary-500')

      // Click to select
      await user.click(communicationButton)
      expect(communicationButton).toHaveClass('bg-primary-500')

      // Click to deselect
      await user.click(communicationButton)
      expect(communicationButton).not.toHaveClass('bg-primary-500')
    })

    it('should allow selecting multiple skills', async () => {
      const user = userEvent.setup()
      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Communication' })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'Communication' }))
      await user.click(screen.getByRole('button', { name: 'Leadership' }))

      expect(screen.getByRole('button', { name: 'Communication' })).toHaveClass('bg-primary-500')
      expect(screen.getByRole('button', { name: 'Leadership' })).toHaveClass('bg-primary-500')
    })
  })

  describe('Form Submission', () => {
    it('should call createOpportunity with correct data on successful submission', async () => {
      const user = userEvent.setup()
      vi.mocked(createOpportunity).mockResolvedValue(mockOpportunityResponse)

      render(<OpportunityForm onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'UA Open Day Support')
      await user.type(
        screen.getByLabelText(/description/i),
        'Help with university open day activities',
      )
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '10')
      await user.type(screen.getByLabelText(/start date/i), getStartDate())
      await user.type(screen.getByLabelText(/end date/i), getEndDate())
      await user.type(screen.getByLabelText(/location/i), 'University Campus')
      await user.click(screen.getByRole('button', { name: 'Communication' }))

      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      await waitFor(() => {
        expect(createOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'UA Open Day Support',
            description: 'Help with university open day activities',
            pointsReward: 50,
            maxVolunteers: 10,
            location: 'University Campus',
            requiredSkillIds: [1],
          }),
        )
      })
    })

    it('should show success message after successful submission', async () => {
      const user = userEvent.setup()
      vi.mocked(createOpportunity).mockResolvedValue(mockOpportunityResponse)

      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '10')
      await user.type(screen.getByLabelText(/start date/i), getStartDate())
      await user.type(screen.getByLabelText(/end date/i), getEndDate())
      await user.click(screen.getByRole('button', { name: 'Communication' }))

      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      await waitFor(() => {
        expect(screen.getByText(/opportunity created successfully/i)).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup()
      vi.mocked(createOpportunity).mockResolvedValue(mockOpportunityResponse)

      render(<OpportunityForm onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '10')
      await user.type(screen.getByLabelText(/start date/i), getStartDate())
      await user.type(screen.getByLabelText(/end date/i), getEndDate())
      await user.click(screen.getByRole('button', { name: 'Communication' }))

      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockOpportunityResponse)
      })
    })

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup()
      vi.mocked(createOpportunity).mockResolvedValue(mockOpportunityResponse)

      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '10')
      await user.type(screen.getByLabelText(/start date/i), getStartDate())
      await user.type(screen.getByLabelText(/end date/i), getEndDate())
      await user.click(screen.getByRole('button', { name: 'Communication' }))

      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('')
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      vi.mocked(createOpportunity).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockOpportunityResponse), 100)),
      )

      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '10')
      await user.type(screen.getByLabelText(/start date/i), getStartDate())
      await user.type(screen.getByLabelText(/end date/i), getEndDate())
      await user.click(screen.getByRole('button', { name: 'Communication' }))

      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      const user = userEvent.setup()
      vi.mocked(createOpportunity).mockRejectedValue(new Error('API Error'))
      vi.mocked(parseOpportunityError).mockResolvedValue('Failed to create opportunity')

      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      await user.type(screen.getByLabelText(/points reward/i), '50')
      await user.type(screen.getByLabelText(/max volunteers/i), '10')
      await user.type(screen.getByLabelText(/start date/i), getStartDate())
      await user.type(screen.getByLabelText(/end date/i), getEndDate())
      await user.click(screen.getByRole('button', { name: 'Communication' }))

      await user.click(screen.getByRole('button', { name: /create opportunity/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to create opportunity')
      })
    })

    it('should display error when fetching skills fails', async () => {
      vi.mocked(getSkills).mockRejectedValue(new Error('Failed to fetch'))
      vi.mocked(parseOpportunityError).mockResolvedValue('Failed to load skills')

      render(<OpportunityForm />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load skills')
      })
    })
  })
})
