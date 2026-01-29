import { type FormEvent, useEffect, useState } from 'react'
import {
  Button,
  buttonVariants,
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
  createOpportunity,
  type OpportunityResponse,
  parseOpportunityError,
} from '@/lib/opportunity'
import { getSkills, type SkillResponse } from '@/lib/profile'
import {
  FormField,
  hasValidationErrors,
  type OpportunityFormErrors,
  validateOpportunityForm,
} from './opportunity-form-utils'

interface OpportunityFormProps {
  onSuccess?: (response: OpportunityResponse) => void
}

export function OpportunityForm({ onSuccess }: OpportunityFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsReward, setPointsReward] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [maxVolunteers, setMaxVolunteers] = useState('')
  const [location, setLocation] = useState('')
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<number>>(new Set())
  const [availableSkills, setAvailableSkills] = useState<SkillResponse[]>([])
  const [errors, setErrors] = useState<OpportunityFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [createdOpportunityId, setCreatedOpportunityId] = useState<number | null>(null)

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

    loadSkills()
  }, [])

  const validateForm = (): boolean => {
    const newErrors = validateOpportunityForm({
      title,
      description,
      pointsReward,
      startDate,
      endDate,
      maxVolunteers,
      location,
      selectedSkillIds,
    })
    setErrors(newErrors)
    return !hasValidationErrors(newErrors)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await createOpportunity({
        title: title.trim(),
        description: description.trim(),
        pointsReward: parseInt(pointsReward, 10),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        maxVolunteers: parseInt(maxVolunteers, 10),
        location: location.trim() || undefined,
        requiredSkillIds: Array.from(selectedSkillIds),
      })

      setSuccessMessage('Opportunity created successfully!')
      setCreatedOpportunityId(response.id)
      onSuccess?.(response)

      // Reset form
      setTitle('')
      setDescription('')
      setPointsReward('')
      setStartDate('')
      setEndDate('')
      setMaxVolunteers('')
      setLocation('')
      setSelectedSkillIds(new Set())
    } catch (error) {
      const message = await parseOpportunityError(error)
      setErrors({ general: message })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSkills) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            <span className="ml-3 text-muted">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Opportunity</CardTitle>
        <CardDescription>
          Create a new volunteering opportunity for volunteers to apply
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {errors.general && (
            <div
              className="p-3 rounded-lg bg-error/10 border border-error text-error text-sm"
              role="alert"
            >
              {errors.general}
            </div>
          )}

          {successMessage && createdOpportunityId && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-700 dark:text-green-400 text-sm flex items-center justify-between">
              <span>{successMessage}</span>
              <a
                href={`/opportunities/${createdOpportunityId}`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                data-testid="view-created-opportunity-link"
              >
                View Opportunity
              </a>
            </div>
          )}

          <FormField id="title" label="Title" required error={errors.title}>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="e.g., UA Open Day Support"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!errors.title}
              disabled={isLoading}
            />
          </FormField>

          <div className="space-y-2">
            <Label htmlFor="description" required>
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the opportunity and what volunteers will be doing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={!!errors.description}
              disabled={isLoading}
              rows={4}
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
            <FormField id="pointsReward" label="Points Reward" required error={errors.pointsReward}>
              <Input
                id="pointsReward"
                name="pointsReward"
                type="number"
                min="0"
                placeholder="50"
                value={pointsReward}
                onChange={(e) => setPointsReward(e.target.value)}
                error={!!errors.pointsReward}
                disabled={isLoading}
              />
            </FormField>

            <FormField
              id="maxVolunteers"
              label="Max Volunteers"
              required
              error={errors.maxVolunteers}
            >
              <Input
                id="maxVolunteers"
                name="maxVolunteers"
                type="number"
                min="1"
                placeholder="10"
                value={maxVolunteers}
                onChange={(e) => setMaxVolunteers(e.target.value)}
                error={!!errors.maxVolunteers}
                disabled={isLoading}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField id="startDate" label="Start Date" required error={errors.startDate}>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                error={!!errors.startDate}
                disabled={isLoading}
              />
            </FormField>

            <FormField id="endDate" label="End Date" required error={errors.endDate}>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                error={!!errors.endDate}
                disabled={isLoading}
              />
            </FormField>
          </div>

          <FormField id="location" label="Location">
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="e.g., University Campus, Building A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isLoading}
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Opportunity'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
