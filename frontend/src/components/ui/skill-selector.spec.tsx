import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SkillResponse } from '@/lib/profile'
import { render, screen } from '@/test/test-utils'
import { SkillSelector } from './skill-selector'

describe('SkillSelector', () => {
  const mockSkills: SkillResponse[] = [
    { id: 1, name: 'Programming', category: 'TECHNICAL', description: 'Coding skills' },
    { id: 2, name: 'Web Development', category: 'TECHNICAL', description: 'Web skills' },
    { id: 3, name: 'Communication', category: 'COMMUNICATION', description: 'Talking skills' },
    { id: 4, name: 'Leadership', category: 'LEADERSHIP', description: 'Leading skills' },
  ]

  const defaultProps = {
    skills: mockSkills,
    selectedSkillIds: new Set<number>(),
    onSelectionChange: vi.fn(),
  }

  describe('Rendering', () => {
    it('should render with default label', () => {
      render(<SkillSelector {...defaultProps} />)

      expect(screen.getByText('Skills')).toBeInTheDocument()
    })

    it('should render with custom label', () => {
      render(<SkillSelector {...defaultProps} label="Required Skills" />)

      expect(screen.getByText('Required Skills')).toBeInTheDocument()
    })

    it('should render description when provided', () => {
      render(<SkillSelector {...defaultProps} description="Select your skills" />)

      expect(screen.getByText('Select your skills')).toBeInTheDocument()
    })

    it('should not render description when not provided', () => {
      render(<SkillSelector {...defaultProps} />)

      expect(screen.queryByText('Select your skills')).not.toBeInTheDocument()
    })

    it('should render error message when provided', () => {
      render(<SkillSelector {...defaultProps} error="At least one skill is required" />)

      expect(screen.getByText('At least one skill is required')).toBeInTheDocument()
    })

    it('should not render error message when not provided', () => {
      render(<SkillSelector {...defaultProps} />)

      expect(screen.queryByText('At least one skill is required')).not.toBeInTheDocument()
    })

    it('should render all skill buttons', () => {
      render(<SkillSelector {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Programming' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Web Development' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Communication' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Leadership' })).toBeInTheDocument()
    })

    it('should render category headings', () => {
      const { container } = render(<SkillSelector {...defaultProps} />)

      const headings = container.querySelectorAll('h4')
      const headingTexts = Array.from(headings).map((h) => h.textContent)

      expect(headingTexts).toContain('Technical')
      expect(headingTexts).toContain('Communication')
      expect(headingTexts).toContain('Leadership')
    })

    it('should render empty state when no skills provided', () => {
      render(<SkillSelector {...defaultProps} skills={[]} />)

      expect(screen.getByText('No skills available')).toBeInTheDocument()
    })

    it('should show required indicator when required prop is true', () => {
      render(<SkillSelector {...defaultProps} required />)

      // The Label component shows a * span when required
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should not show required indicator when required prop is false', () => {
      render(<SkillSelector {...defaultProps} required={false} />)

      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })

    it('should set title attribute on skill buttons', () => {
      render(<SkillSelector {...defaultProps} />)

      const programmingButton = screen.getByRole('button', { name: 'Programming' })
      expect(programmingButton).toHaveAttribute('title', 'Coding skills')
    })
  })

  describe('Selection State', () => {
    it('should show selected skills with different styling', () => {
      const selectedIds = new Set([1, 3])
      render(<SkillSelector {...defaultProps} selectedSkillIds={selectedIds} />)

      const programmingButton = screen.getByRole('button', { name: 'Programming' })
      const webDevButton = screen.getByRole('button', { name: 'Web Development' })
      const communicationButton = screen.getByRole('button', { name: 'Communication' })

      expect(programmingButton).toHaveClass('bg-primary-500')
      expect(webDevButton).not.toHaveClass('bg-primary-500')
      expect(communicationButton).toHaveClass('bg-primary-500')
    })

    it('should show unselected skills with surface background', () => {
      render(<SkillSelector {...defaultProps} selectedSkillIds={new Set([1])} />)

      const webDevButton = screen.getByRole('button', { name: 'Web Development' })
      expect(webDevButton).toHaveClass('bg-surface')
    })
  })

  describe('User Interaction', () => {
    it('should call onSelectionChange when clicking an unselected skill', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(<SkillSelector {...defaultProps} onSelectionChange={onSelectionChange} />)

      await user.click(screen.getByRole('button', { name: 'Programming' }))

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      const newSet = onSelectionChange.mock.calls[0][0]
      expect(newSet.has(1)).toBe(true)
    })

    it('should call onSelectionChange when clicking a selected skill', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <SkillSelector
          {...defaultProps}
          selectedSkillIds={new Set([1])}
          onSelectionChange={onSelectionChange}
        />,
      )

      await user.click(screen.getByRole('button', { name: 'Programming' }))

      expect(onSelectionChange).toHaveBeenCalledTimes(1)
      const newSet = onSelectionChange.mock.calls[0][0]
      expect(newSet.has(1)).toBe(false)
    })

    it('should toggle multiple skills independently', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(<SkillSelector {...defaultProps} onSelectionChange={onSelectionChange} />)

      await user.click(screen.getByRole('button', { name: 'Programming' }))
      await user.click(screen.getByRole('button', { name: 'Leadership' }))

      expect(onSelectionChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Disabled State', () => {
    it('should disable all skill buttons when disabled prop is true', () => {
      render(<SkillSelector {...defaultProps} disabled />)

      expect(screen.getByRole('button', { name: 'Programming' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Web Development' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Communication' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Leadership' })).toBeDisabled()
    })

    it('should not call onSelectionChange when clicking a disabled skill', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(<SkillSelector {...defaultProps} disabled onSelectionChange={onSelectionChange} />)

      await user.click(screen.getByRole('button', { name: 'Programming' }))

      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('should apply disabled styling when disabled', () => {
      render(<SkillSelector {...defaultProps} disabled />)

      const programmingButton = screen.getByRole('button', { name: 'Programming' })
      expect(programmingButton).toHaveClass('opacity-50')
      expect(programmingButton).toHaveClass('cursor-not-allowed')
    })
  })

  describe('Category Grouping', () => {
    it('should group skills by category', () => {
      render(<SkillSelector {...defaultProps} />)

      // Check that Technical category has two skills
      const technicalHeading = screen.getByText('Technical')
      const technicalSection = technicalHeading.closest('div')
      expect(technicalSection).toContainElement(screen.getByRole('button', { name: 'Programming' }))
      expect(technicalSection).toContainElement(
        screen.getByRole('button', { name: 'Web Development' }),
      )
    })

    it('should handle unknown category gracefully', () => {
      const skillsWithUnknownCategory: SkillResponse[] = [
        { id: 1, name: 'Unknown Skill', category: 'UNKNOWN_CATEGORY' as never },
      ]

      render(<SkillSelector {...defaultProps} skills={skillsWithUnknownCategory} />)

      // Should fall back to showing the category key
      expect(screen.getByText('UNKNOWN_CATEGORY')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Unknown Skill' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have type="button" on all skill buttons', () => {
      render(<SkillSelector {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(<SkillSelector {...defaultProps} onSelectionChange={onSelectionChange} />)

      const programmingButton = screen.getByRole('button', { name: 'Programming' })
      programmingButton.focus()
      await user.keyboard('{Enter}')

      expect(onSelectionChange).toHaveBeenCalled()
    })

    it('should support space key activation', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(<SkillSelector {...defaultProps} onSelectionChange={onSelectionChange} />)

      const programmingButton = screen.getByRole('button', { name: 'Programming' })
      programmingButton.focus()
      await user.keyboard(' ')

      expect(onSelectionChange).toHaveBeenCalled()
    })
  })
})
