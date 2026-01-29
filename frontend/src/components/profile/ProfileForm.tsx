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
  getProfile,
  getSkills,
  type ProfileResponse,
  parseProfileError,
  type SkillResponse,
  updateProfile,
} from '@/lib/profile'

interface ProfileFormProps {
  onSuccess?: (response: ProfileResponse) => void
}

interface FormErrors {
  name?: string
  bio?: string
  general?: string
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<number>>(new Set())
  const [availableSkills, setAvailableSkills] = useState<SkillResponse[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

  // Load profile and skills on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, skillsData] = await Promise.all([getProfile(), getSkills()])

        setName(profileData.name)
        setBio(profileData.bio || '')
        setSelectedSkillIds(new Set(profileData.skills.map((s) => s.id)))
        setAvailableSkills(skillsData)
      } catch (error) {
        const message = await parseProfileError(error)
        setErrors({ general: message })
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadData()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!name) {
      newErrors.name = 'Name is required'
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (bio && bio.length > 500) {
      newErrors.bio = 'Bio must be at most 500 characters'
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
      const response = await updateProfile({
        name,
        bio: bio || undefined,
        skillIds: Array.from(selectedSkillIds),
      })

      setSuccessMessage('Profile updated successfully!')
      onSuccess?.(response)
    } catch (error) {
      const message = await parseProfileError(error)
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

  if (isLoadingProfile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            <span className="ml-3 text-muted">Loading profile...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Edit Profile</CardTitle>
        <CardDescription>Update your profile information and skills</CardDescription>
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
            <Label htmlFor="name" required>
              Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              disabled={isLoading}
              autoComplete="name"
            />
            {errors.name && <p className="text-sm text-error">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself and your volunteering interests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              error={!!errors.bio}
              disabled={isLoading}
              rows={4}
            />
            <div className="flex justify-between text-xs text-muted">
              <span>{errors.bio && <span className="text-error">{errors.bio}</span>}</span>
              <span className={bio.length > 500 ? 'text-error' : ''}>{bio.length}/500</span>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Skills</Label>
            <p className="text-sm text-muted">
              Select the skills that describe your abilities and interests
            </p>

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
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
