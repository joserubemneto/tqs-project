import { type FormEvent, useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui'
import {
  createOpportunity,
  type OpportunityResponse,
  parseOpportunityError,
} from '@/lib/opportunity'
import { getSkills, type SkillResponse } from '@/lib/profile'

interface OpportunityFormProps {
  onSuccess?: (response: OpportunityResponse) => void
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
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

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

  const handleSkillToggle = (skillId: number) => {
    setSelectedSkillIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(skillId)) {
        newSet.delete(skillId)
      } else {
        newSet.add(skillId)
      }
      return newSet
    })
  }

  // Group skills by category
  const skillsByCategory = availableSkills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    },
    {} as Record<string, SkillResponse[]>,
  )

  const categoryLabels: Record<string, string> = {
    TECHNICAL: 'Technical',
    COMMUNICATION: 'Communication',
    LEADERSHIP: 'Leadership',
    CREATIVE: 'Creative',
    ADMINISTRATIVE: 'Administrative',
    SOCIAL: 'Social',
    LANGUAGE: 'Language',
    OTHER: 'Other',
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

          {successMessage && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500 text-green-700 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" required>
              Title
            </Label>
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
            {errors.title && <p className="text-sm text-error">{errors.title}</p>}
          </div>

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
            <div className="space-y-2">
              <Label htmlFor="pointsReward" required>
                Points Reward
              </Label>
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
              {errors.pointsReward && <p className="text-sm text-error">{errors.pointsReward}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxVolunteers" required>
                Max Volunteers
              </Label>
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
              {errors.maxVolunteers && <p className="text-sm text-error">{errors.maxVolunteers}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" required>
                Start Date
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                error={!!errors.startDate}
                disabled={isLoading}
              />
              {errors.startDate && <p className="text-sm text-error">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" required>
                End Date
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                error={!!errors.endDate}
                disabled={isLoading}
              />
              {errors.endDate && <p className="text-sm text-error">{errors.endDate}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="e.g., University Campus, Building A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <Label required>Required Skills</Label>
            <p className="text-sm text-muted">
              Select the skills that volunteers should have to apply
            </p>
            {errors.skills && <p className="text-sm text-error">{errors.skills}</p>}

            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  {categoryLabels[category] || category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleSkillToggle(skill.id)}
                      disabled={isLoading}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selectedSkillIds.has(skill.id)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-surface border-border hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={skill.description}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {availableSkills.length === 0 && (
              <p className="text-sm text-muted italic">No skills available</p>
            )}
          </div>

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
