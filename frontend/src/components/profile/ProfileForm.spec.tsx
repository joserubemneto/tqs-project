import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { ProfileForm } from './ProfileForm'

// Mock the profile module
vi.mock('@/lib/profile', () => ({
  getProfile: vi.fn(),
  getSkills: vi.fn(),
  updateProfile: vi.fn(),
  parseProfileError: vi.fn(),
}))

import { getProfile, getSkills, parseProfileError, updateProfile } from '@/lib/profile'

describe('ProfileForm', () => {
  const mockOnSuccess = vi.fn()

  const mockProfile = {
    id: 1,
    email: 'volunteer@ua.pt',
    name: 'Sample Volunteer',
    role: 'VOLUNTEER' as const,
    points: 50,
    bio: 'I love volunteering',
    skills: [{ id: 1, name: 'Communication', category: 'COMMUNICATION' as const }],
    createdAt: '2024-01-01T00:00:00Z',
  }

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

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProfile).mockResolvedValue(mockProfile)
    vi.mocked(getSkills).mockResolvedValue(mockSkills)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading indicator while fetching profile', () => {
      vi.mocked(getProfile).mockImplementation(() => new Promise(() => {}))
      vi.mocked(getSkills).mockImplementation(() => new Promise(() => {}))

      render(<ProfileForm />)

      expect(screen.getByText(/loading profile/i)).toBeInTheDocument()
    })

    it('should call getProfile and getSkills on mount', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(getProfile).toHaveBeenCalled()
        expect(getSkills).toHaveBeenCalled()
      })
    })
  })

  describe('Rendering', () => {
    it('should render the form with all fields after loading', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
      expect(screen.getByText('Skills')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
    })

    it('should populate form with profile data', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveValue('Sample Volunteer')
      })

      expect(screen.getByLabelText(/bio/i)).toHaveValue('I love volunteering')
    })

    it('should show user skills as selected', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit profile/i })).toBeInTheDocument()
      })

      // Communication skill should appear selected (in the button list)
      const communicationButton = screen.getByRole('button', { name: 'Communication' })
      expect(communicationButton).toHaveClass('bg-primary-500')
    })

    it('should display available skills by category', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Communication' })).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: 'Leadership' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Programming' })).toBeInTheDocument()
    })

    it('should display character count for bio', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
      })

      // "I love volunteering" = 19 chars, text is split into nodes so use function matcher
      // Match only the span element, not its parent div
      expect(
        screen.getByText((_content, element) => {
          return element?.tagName === 'SPAN' && element?.textContent === '19/500'
        }),
      ).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show error when name is empty', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.clear(screen.getByLabelText(/name/i))
      await user.click(screen.getByRole('button', { name: /save profile/i }))

      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    })

    it('should show error when name is too short', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.clear(screen.getByLabelText(/name/i))
      await user.type(screen.getByLabelText(/name/i), 'A')
      await user.click(screen.getByRole('button', { name: /save profile/i }))

      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })

    it('should show error when bio exceeds 500 characters', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
      })

      await user.clear(screen.getByLabelText(/bio/i))
      await user.type(screen.getByLabelText(/bio/i), 'a'.repeat(501))
      await user.click(screen.getByRole('button', { name: /save profile/i }))

      expect(screen.getByText(/bio must be at most 500 characters/i)).toBeInTheDocument()
    })

    it('should not call updateProfile if validation fails', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.clear(screen.getByLabelText(/name/i))
      await user.click(screen.getByRole('button', { name: /save profile/i }))

      expect(updateProfile).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should call updateProfile with correct data on valid submission', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockResolvedValue({
        ...mockProfile,
        name: 'Updated Name',
        bio: 'Updated bio',
      })

      render(<ProfileForm onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.clear(screen.getByLabelText(/name/i))
      await user.type(screen.getByLabelText(/name/i), 'Updated Name')
      await user.clear(screen.getByLabelText(/bio/i))
      await user.type(screen.getByLabelText(/bio/i), 'Updated bio')
      await user.click(screen.getByRole('button', { name: /save profile/i }))

      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith({
          name: 'Updated Name',
          bio: 'Updated bio',
          skillIds: [1], // Communication skill is selected by default
        })
      })
    })

    it('should show success message after successful update', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockResolvedValue(mockProfile)

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save profile/i }))

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument()
      })
    })

    it('should call onSuccess callback after successful update', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockResolvedValue(mockProfile)

      render(<ProfileForm onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save profile/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockProfile)
      })
    })
  })

  describe('Skill Selection', () => {
    it('should toggle skill selection when clicked', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Leadership' })).toBeInTheDocument()
      })

      const leadershipButton = screen.getByRole('button', { name: 'Leadership' })

      // Initially not selected
      expect(leadershipButton).not.toHaveClass('bg-primary-500')

      // Click to select
      await user.click(leadershipButton)
      expect(leadershipButton).toHaveClass('bg-primary-500')

      // Click to deselect
      await user.click(leadershipButton)
      expect(leadershipButton).not.toHaveClass('bg-primary-500')
    })

    it('should include selected skills in form submission', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockResolvedValue(mockProfile)

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Leadership' })).toBeInTheDocument()
      })

      // Select Leadership skill
      await user.click(screen.getByRole('button', { name: 'Leadership' }))
      await user.click(screen.getByRole('button', { name: /save profile/i }))

      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            skillIds: expect.arrayContaining([1, 2]), // Communication and Leadership
          }),
        )
      })
    })

    it('should remove skill from submission when deselected', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockResolvedValue({
        ...mockProfile,
        skills: [],
      })

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Communication' })).toBeInTheDocument()
      })

      // Deselect Communication skill (which is selected by default from profile)
      await user.click(screen.getByRole('button', { name: 'Communication' }))
      await user.click(screen.getByRole('button', { name: /save profile/i }))

      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            skillIds: [],
          }),
        )
      })
    })
  })

  describe('Loading State During Submission', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockProfile), 100)),
      )

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save profile/i }))

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
    })

    it('should disable form fields during submission', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockProfile), 100)),
      )

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save profile/i }))

      expect(screen.getByLabelText(/name/i)).toBeDisabled()
      expect(screen.getByLabelText(/bio/i)).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when profile loading fails', async () => {
      vi.mocked(getProfile).mockRejectedValue(new Error('Failed to load'))
      vi.mocked(parseProfileError).mockResolvedValue('Failed to load profile')

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load profile')
      })
    })

    it('should display error message when update fails', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockRejectedValue(new Error('Update failed'))
      vi.mocked(parseProfileError).mockResolvedValue('Failed to update profile')

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save profile/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to update profile')
      })
    })

    it('should not call onSuccess when update fails', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockRejectedValue(new Error('Update failed'))
      vi.mocked(parseProfileError).mockResolvedValue('Failed to update profile')

      render(<ProfileForm onSuccess={mockOnSuccess} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save profile/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Input Handling', () => {
    it('should update name field value', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')

      expect(nameInput).toHaveValue('New Name')
    })

    it('should update bio field value', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
      })

      const bioInput = screen.getByLabelText(/bio/i)
      await user.clear(bioInput)
      await user.type(bioInput, 'New bio text')

      expect(bioInput).toHaveValue('New bio text')
    })

    it('should update character count as bio changes', async () => {
      const user = userEvent.setup()
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
      })

      const bioInput = screen.getByLabelText(/bio/i)
      await user.clear(bioInput)
      await user.type(bioInput, 'Hello')

      expect(screen.getByText(/5\/500/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible labels for all inputs', async () => {
      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument()
    })

    it('should display error alert with role="alert"', async () => {
      vi.mocked(getProfile).mockRejectedValue(new Error('Failed'))
      vi.mocked(parseProfileError).mockResolvedValue('Error message')

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('should display success message"', async () => {
      const user = userEvent.setup()
      vi.mocked(updateProfile).mockResolvedValue(mockProfile)

      render(<ProfileForm />)

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /save profile/i }))

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
      })
    })
  })
})
