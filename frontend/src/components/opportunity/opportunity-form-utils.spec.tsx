import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/test-utils'
import {
  FormField,
  formatDateTimeLocal,
  hasValidationErrors,
  type OpportunityFormData,
  type OpportunityFormErrors,
  validateOpportunityForm,
} from './opportunity-form-utils'

describe('opportunity-form-utils', () => {
  describe('FormField', () => {
    it('should render label and children', () => {
      render(
        <FormField id="test-field" label="Test Label">
          <input id="test-field" type="text" />
        </FormField>,
      )

      expect(screen.getByText('Test Label')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should render required indicator when required prop is true', () => {
      render(
        <FormField id="test-field" label="Required Field" required>
          <input id="test-field" type="text" />
        </FormField>,
      )

      const label = screen.getByText('Required Field')
      expect(label).toBeInTheDocument()
    })

    it('should render error message when error prop is provided', () => {
      render(
        <FormField id="test-field" label="Field with Error" error="This field has an error">
          <input id="test-field" type="text" />
        </FormField>,
      )

      expect(screen.getByText('This field has an error')).toBeInTheDocument()
    })

    it('should not render error message when error prop is not provided', () => {
      render(
        <FormField id="test-field" label="Test Field">
          <input id="test-field" type="text" />
        </FormField>,
      )

      // The error paragraph should not exist
      expect(screen.queryByText('This field has an error')).not.toBeInTheDocument()
    })
  })

  describe('formatDateTimeLocal', () => {
    it('should format ISO string to datetime-local format', () => {
      const isoString = '2024-03-15T14:30:00.000Z'
      const result = formatDateTimeLocal(isoString)

      // The result depends on the local timezone, but should match the pattern
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    })

    it('should pad single digit months and days', () => {
      // January 5th
      const date = new Date(2024, 0, 5, 9, 5)
      const isoString = date.toISOString()
      const result = formatDateTimeLocal(isoString)

      expect(result).toContain('-01-05')
      expect(result).toContain('T09:05')
    })

    it('should handle dates with double digit values', () => {
      const date = new Date(2024, 11, 25, 15, 45) // December 25th, 15:45
      const isoString = date.toISOString()
      const result = formatDateTimeLocal(isoString)

      expect(result).toContain('-12-25')
      expect(result).toContain('T15:45')
    })
  })

  describe('validateOpportunityForm', () => {
    const validFormData: OpportunityFormData = {
      title: 'Test Opportunity',
      description: 'Test description for the opportunity',
      pointsReward: '50',
      startDate: '2024-03-01T09:00',
      endDate: '2024-03-07T17:00',
      maxVolunteers: '10',
      location: 'Test Location',
      selectedSkillIds: new Set([1, 2]),
    }

    it('should return no errors for valid form data', () => {
      const errors = validateOpportunityForm(validFormData)
      expect(errors).toEqual({})
    })

    describe('title validation', () => {
      it('should return error when title is empty', () => {
        const errors = validateOpportunityForm({ ...validFormData, title: '' })
        expect(errors.title).toBe('Title is required')
      })

      it('should return error when title is only whitespace', () => {
        const errors = validateOpportunityForm({ ...validFormData, title: '   ' })
        expect(errors.title).toBe('Title is required')
      })

      it('should return error when title exceeds 255 characters', () => {
        const longTitle = 'a'.repeat(256)
        const errors = validateOpportunityForm({ ...validFormData, title: longTitle })
        expect(errors.title).toBe('Title must be at most 255 characters')
      })

      it('should accept title with exactly 255 characters', () => {
        const maxTitle = 'a'.repeat(255)
        const errors = validateOpportunityForm({ ...validFormData, title: maxTitle })
        expect(errors.title).toBeUndefined()
      })
    })

    describe('description validation', () => {
      it('should return error when description is empty', () => {
        const errors = validateOpportunityForm({ ...validFormData, description: '' })
        expect(errors.description).toBe('Description is required')
      })

      it('should return error when description is only whitespace', () => {
        const errors = validateOpportunityForm({ ...validFormData, description: '   ' })
        expect(errors.description).toBe('Description is required')
      })

      it('should return error when description exceeds 2000 characters', () => {
        const longDescription = 'a'.repeat(2001)
        const errors = validateOpportunityForm({ ...validFormData, description: longDescription })
        expect(errors.description).toBe('Description must be at most 2000 characters')
      })

      it('should accept description with exactly 2000 characters', () => {
        const maxDescription = 'a'.repeat(2000)
        const errors = validateOpportunityForm({ ...validFormData, description: maxDescription })
        expect(errors.description).toBeUndefined()
      })
    })

    describe('pointsReward validation', () => {
      it('should return error when pointsReward is empty', () => {
        const errors = validateOpportunityForm({ ...validFormData, pointsReward: '' })
        expect(errors.pointsReward).toBe('Points reward is required')
      })

      it('should return error when pointsReward is negative', () => {
        const errors = validateOpportunityForm({ ...validFormData, pointsReward: '-1' })
        expect(errors.pointsReward).toBe('Points reward must be at least 0')
      })

      it('should return error when pointsReward is not a number', () => {
        const errors = validateOpportunityForm({ ...validFormData, pointsReward: 'abc' })
        expect(errors.pointsReward).toBe('Points reward must be at least 0')
      })

      it('should accept pointsReward of 0', () => {
        const errors = validateOpportunityForm({ ...validFormData, pointsReward: '0' })
        expect(errors.pointsReward).toBeUndefined()
      })
    })

    describe('date validation', () => {
      it('should return error when startDate is empty', () => {
        const errors = validateOpportunityForm({ ...validFormData, startDate: '' })
        expect(errors.startDate).toBe('Start date is required')
      })

      it('should return error when endDate is empty', () => {
        const errors = validateOpportunityForm({ ...validFormData, endDate: '' })
        expect(errors.endDate).toBe('End date is required')
      })

      it('should return error when endDate is before startDate', () => {
        const errors = validateOpportunityForm({
          ...validFormData,
          startDate: '2024-03-07T17:00',
          endDate: '2024-03-01T09:00',
        })
        expect(errors.endDate).toBe('End date must be after start date')
      })

      it('should return error when endDate equals startDate', () => {
        const errors = validateOpportunityForm({
          ...validFormData,
          startDate: '2024-03-01T09:00',
          endDate: '2024-03-01T09:00',
        })
        expect(errors.endDate).toBe('End date must be after start date')
      })

      it('should accept when endDate is after startDate', () => {
        const errors = validateOpportunityForm({
          ...validFormData,
          startDate: '2024-03-01T09:00',
          endDate: '2024-03-01T10:00',
        })
        expect(errors.endDate).toBeUndefined()
      })
    })

    describe('maxVolunteers validation', () => {
      it('should return error when maxVolunteers is empty', () => {
        const errors = validateOpportunityForm({ ...validFormData, maxVolunteers: '' })
        expect(errors.maxVolunteers).toBe('Max volunteers is required')
      })

      it('should return error when maxVolunteers is 0', () => {
        const errors = validateOpportunityForm({ ...validFormData, maxVolunteers: '0' })
        expect(errors.maxVolunteers).toBe('Max volunteers must be at least 1')
      })

      it('should return error when maxVolunteers is negative', () => {
        const errors = validateOpportunityForm({ ...validFormData, maxVolunteers: '-1' })
        expect(errors.maxVolunteers).toBe('Max volunteers must be at least 1')
      })

      it('should return error when maxVolunteers is not a number', () => {
        const errors = validateOpportunityForm({ ...validFormData, maxVolunteers: 'abc' })
        expect(errors.maxVolunteers).toBe('Max volunteers must be at least 1')
      })

      it('should accept maxVolunteers of 1', () => {
        const errors = validateOpportunityForm({ ...validFormData, maxVolunteers: '1' })
        expect(errors.maxVolunteers).toBeUndefined()
      })
    })

    describe('skills validation', () => {
      it('should return error when no skills are selected', () => {
        const errors = validateOpportunityForm({
          ...validFormData,
          selectedSkillIds: new Set(),
        })
        expect(errors.skills).toBe('At least one skill is required')
      })

      it('should accept when at least one skill is selected', () => {
        const errors = validateOpportunityForm({
          ...validFormData,
          selectedSkillIds: new Set([1]),
        })
        expect(errors.skills).toBeUndefined()
      })
    })

    it('should return multiple errors when multiple fields are invalid', () => {
      const errors = validateOpportunityForm({
        title: '',
        description: '',
        pointsReward: '',
        startDate: '',
        endDate: '',
        maxVolunteers: '',
        location: '',
        selectedSkillIds: new Set(),
      })

      expect(errors.title).toBeDefined()
      expect(errors.description).toBeDefined()
      expect(errors.pointsReward).toBeDefined()
      expect(errors.startDate).toBeDefined()
      expect(errors.endDate).toBeDefined()
      expect(errors.maxVolunteers).toBeDefined()
      expect(errors.skills).toBeDefined()
    })
  })

  describe('hasValidationErrors', () => {
    it('should return false for empty errors object', () => {
      const errors: OpportunityFormErrors = {}
      expect(hasValidationErrors(errors)).toBe(false)
    })

    it('should return true when there is at least one error', () => {
      const errors: OpportunityFormErrors = { title: 'Title is required' }
      expect(hasValidationErrors(errors)).toBe(true)
    })

    it('should return true when there are multiple errors', () => {
      const errors: OpportunityFormErrors = {
        title: 'Title is required',
        description: 'Description is required',
      }
      expect(hasValidationErrors(errors)).toBe(true)
    })
  })
})
