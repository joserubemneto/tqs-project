import type { SkillResponse } from '@/lib/profile'
import { groupSkillsByCategory, SKILL_CATEGORY_LABELS, toggleSkillId } from '@/lib/skills'
import { Label } from './label'

interface SkillSelectorProps {
  skills: SkillResponse[]
  selectedSkillIds: Set<number>
  onSelectionChange: (skillIds: Set<number>) => void
  disabled?: boolean
  label?: string
  description?: string
  error?: string
  required?: boolean
}

export function SkillSelector({
  skills,
  selectedSkillIds,
  onSelectionChange,
  disabled = false,
  label = 'Skills',
  description,
  error,
  required = false,
}: SkillSelectorProps) {
  const skillsByCategory = groupSkillsByCategory(skills)

  const handleSkillToggle = (skillId: number) => {
    onSelectionChange(toggleSkillId(selectedSkillIds, skillId))
  }

  return (
    <div className="space-y-4">
      <Label required={required}>{label}</Label>
      {description && <p className="text-sm text-muted">{description}</p>}
      {error && <p className="text-sm text-error">{error}</p>}

      {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            {SKILL_CATEGORY_LABELS[category as keyof typeof SKILL_CATEGORY_LABELS] || category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {categorySkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => handleSkillToggle(skill.id)}
                disabled={disabled}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedSkillIds.has(skill.id)
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-surface border-border hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={skill.description}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {skills.length === 0 && <p className="text-sm text-muted italic">No skills available</p>}
    </div>
  )
}
