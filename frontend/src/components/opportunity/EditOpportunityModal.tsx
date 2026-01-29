import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  SkillSelector,
  Textarea,
} from '@/components/ui'
import {
  type OpportunityResponse,
  parseOpportunityError,
  updateOpportunity,
  type UpdateOpportunityData,
} from '@/lib/opportunity'
import { getSkills, type SkillResponse } from '@/lib/profile'

interface EditOpportunityModalProps {
  opportunity: OpportunityResponse
  isOpen: boolean
  onClose: () => void
  onSuccess: (response: OpportunityResponse) => void
}

interface FormErrors {
  title?: string
  description?: string
  pointsReward?: string
  startDate?: string
  endDate?: string
  maxVolunteers?: string
  skills?: string
  general?: string
}

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

function FormField({ id, label, required, error, children }: FormFieldProps) {
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

function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function EditOpportunityModal({
  opportunity,
  isOpen,
  onClose,
  onSuccess,
}: EditOpportunityModalProps) {
  const [title, setTitle] = useState(opportunity.title)
  const [description, setDescription] = useState(opportunity.description)
  const [pointsReward, setPointsReward] = useState(String(opportunity.pointsReward))
  const [startDate, setStartDate] = useState(formatDateTimeLocal(opportunity.startDate))
  const [endDate, setEndDate] = useState(formatDateTimeLocal(opportunity.endDate))
  const [maxVolunteers, setMaxVolunteers] = useState(String(opportunity.maxVolunteers))
  const [location, setLocation] = useState(opportunity.location || '')
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<number>>(
    new Set(opportunity.requiredSkills.map((s) => s.id)),
  )
  const [availableSkills, setAvailableSkills] = useState<SkillResponse[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)

  // Load skills on mount
  useEffect(() => {
    async function loadSkills() {
      try {
        const skillsData = await getSkills()
        setAvailableSkills(skillsData)
      } catch (error) {
        const message = await parseOpportunityError(error)
        setErrors({ general: message })
      } finally {
        setIsLoadingSkills(false)
      }
    }

    if (isOpen) {
      loadSkills()
    }
  }, [isOpen])

  // Reset form when opportunity changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(opportunity.title)
      setDescription(opportunity.description)
      setPointsReward(String(opportunity.pointsReward))
      setStartDate(formatDateTimeLocal(opportunity.startDate))
      setEndDate(formatDateTimeLocal(opportunity.endDate))
      setMaxVolunteers(String(opportunity.maxVolunteers))
      setLocation(opportunity.location || '')
      setSelectedSkillIds(new Set(opportunity.requiredSkills.map((s) => s.id)))
      setErrors({})
    }
  }, [isOpen, opportunity])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length > 255) {
      newErrors.title = 'Title must be at most 255 characters'
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required'
    } else if (description.length > 2000) {
      newErrors.description = 'Description must be at most 2000 characters'
    }

    const points = parseInt(pointsReward, 10)
    if (!pointsReward) {
      newErrors.pointsReward = 'Points reward is required'
    } else if (Number.isNaN(points) || points < 0) {
      newErrors.pointsReward = 'Points reward must be at least 0'
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    const volunteers = parseInt(maxVolunteers, 10)
    if (!maxVolunteers) {
      newErrors.maxVolunteers = 'Max volunteers is required'
    } else if (Number.isNaN(volunteers) || volunteers < 1) {
      newErrors.maxVolunteers = 'Max volunteers must be at least 1'
    }

    if (selectedSkillIds.size === 0) {
      newErrors.skills = 'At least one skill is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const updateData: UpdateOpportunityData = {
        title: title.trim(),
        description: description.trim(),
        pointsReward: parseInt(pointsReward, 10),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxVolunteers: parseInt(maxVolunteers, 10),
        location: location.trim() || undefined,
        requiredSkillIds: Array.from(selectedSkillIds),
      }

      const response = await updateOpportunity(opportunity.id, updateData)
      onSuccess(response)
      onClose()
    } catch (error) {
      const message = await parseOpportunityError(error)
      setErrors({ general: message })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      data-testid="edit-modal-overlay"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={onClose}
              disabled={isLoading}
              data-testid="close-modal-button"
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl">Edit Opportunity</CardTitle>
            <CardDescription>Update the details of your volunteering opportunity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSkills ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                <span className="ml-3 text-muted">Loading...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {errors.general && (
                  <div
                    className="p-3 rounded-lg bg-error/10 border border-error text-error text-sm"
                    role="alert"
                    data-testid="error-message"
                  >
                    {errors.general}
                  </div>
                )}

                <FormField id="edit-title" label="Title" required error={errors.title}>
                  <Input
                    id="edit-title"
                    name="title"
                    type="text"
                    placeholder="e.g., UA Open Day Support"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={!!errors.title}
                    disabled={isLoading}
                    data-testid="edit-title-input"
                  />
                </FormField>

                <div className="space-y-2">
                  <Label htmlFor="edit-description" required>
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    placeholder="Describe the opportunity and what volunteers will be doing..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    error={!!errors.description}
                    disabled={isLoading}
                    rows={4}
                    data-testid="edit-description-input"
                  />
                  <div className="flex justify-between text-xs text-muted">
                    <span>
                      {errors.description && <span className="text-error">{errors.description}</span>}
                    </span>
                    <span className={description.length > 2000 ? 'text-error' : ''}>
                      {description.length}/2000
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="edit-pointsReward"
                    label="Points Reward"
                    required
                    error={errors.pointsReward}
                  >
                    <Input
                      id="edit-pointsReward"
                      name="pointsReward"
                      type="number"
                      min="0"
                      placeholder="50"
                      value={pointsReward}
                      onChange={(e) => setPointsReward(e.target.value)}
                      error={!!errors.pointsReward}
                      disabled={isLoading}
                      data-testid="edit-points-input"
                    />
                  </FormField>

                  <FormField
                    id="edit-maxVolunteers"
                    label="Max Volunteers"
                    required
                    error={errors.maxVolunteers}
                  >
                    <Input
                      id="edit-maxVolunteers"
                      name="maxVolunteers"
                      type="number"
                      min="1"
                      placeholder="10"
                      value={maxVolunteers}
                      onChange={(e) => setMaxVolunteers(e.target.value)}
                      error={!!errors.maxVolunteers}
                      disabled={isLoading}
                      data-testid="edit-max-volunteers-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField id="edit-startDate" label="Start Date" required error={errors.startDate}>
                    <Input
                      id="edit-startDate"
                      name="startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      error={!!errors.startDate}
                      disabled={isLoading}
                      data-testid="edit-start-date-input"
                    />
                  </FormField>

                  <FormField id="edit-endDate" label="End Date" required error={errors.endDate}>
                    <Input
                      id="edit-endDate"
                      name="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      error={!!errors.endDate}
                      disabled={isLoading}
                      data-testid="edit-end-date-input"
                    />
                  </FormField>
                </div>

                <FormField id="edit-location" label="Location">
                  <Input
                    id="edit-location"
                    name="location"
                    type="text"
                    placeholder="e.g., University Campus, Building A"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isLoading}
                    data-testid="edit-location-input"
                  />
                </FormField>

                <SkillSelector
                  skills={availableSkills}
                  selectedSkillIds={selectedSkillIds}
                  onSelectionChange={setSelectedSkillIds}
                  disabled={isLoading}
                  label="Required Skills"
                  description="Select the skills that volunteers should have to apply"
                  error={errors.skills}
                  required
                />

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                    data-testid="cancel-edit-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                    disabled={isLoading}
                    data-testid="save-edit-button"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
