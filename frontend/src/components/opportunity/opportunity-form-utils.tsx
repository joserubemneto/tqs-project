import type { ReactNode } from 'react'
import { Label } from '@/components/ui'

export interface OpportunityFormErrors {
  title?: string
  description?: string
  pointsReward?: string
  startDate?: string
  endDate?: string
  maxVolunteers?: string
  skills?: string
  general?: string
}

export interface OpportunityFormData {
  title: string
  description: string
  pointsReward: string
  startDate: string
  endDate: string
  maxVolunteers: string
  location: string
  selectedSkillIds: Set<number>
}

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

export function FormField({ id, label, required, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}

export function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function validateOpportunityForm(data: OpportunityFormData): OpportunityFormErrors {
  const errors: OpportunityFormErrors = {}

  if (!data.title.trim()) {
    errors.title = 'Title is required'
  } else if (data.title.length > 255) {
    errors.title = 'Title must be at most 255 characters'
  }

  if (!data.description.trim()) {
    errors.description = 'Description is required'
  } else if (data.description.length > 2000) {
    errors.description = 'Description must be at most 2000 characters'
  }

  const points = parseInt(data.pointsReward, 10)
  if (!data.pointsReward) {
    errors.pointsReward = 'Points reward is required'
  } else if (Number.isNaN(points) || points < 0) {
    errors.pointsReward = 'Points reward must be at least 0'
  }

  if (!data.startDate) {
    errors.startDate = 'Start date is required'
  }

  if (!data.endDate) {
    errors.endDate = 'End date is required'
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    if (end <= start) {
      errors.endDate = 'End date must be after start date'
    }
  }

  const volunteers = parseInt(data.maxVolunteers, 10)
  if (!data.maxVolunteers) {
    errors.maxVolunteers = 'Max volunteers is required'
  } else if (Number.isNaN(volunteers) || volunteers < 1) {
    errors.maxVolunteers = 'Max volunteers must be at least 1'
  }

  if (data.selectedSkillIds.size === 0) {
    errors.skills = 'At least one skill is required'
  }

  return errors
}

export function hasValidationErrors(errors: OpportunityFormErrors): boolean {
  return Object.keys(errors).length > 0
}
