import { useQuery } from '@tanstack/react-query'
import { Filter, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Input, Label } from '@/components/ui'
import type { OpportunityFilters as Filters } from '@/lib/opportunity'
import { getSkills, type SkillResponse } from '@/lib/profile'
import { groupSkillsByCategory, SKILL_CATEGORY_LABELS } from '@/lib/skills'

interface OpportunityFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function OpportunityFilters({ filters, onFiltersChange }: OpportunityFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: () => getSkills(),
  })

  const selectedSkillIds = new Set(filters.skillIds || [])
  const skillsByCategory = groupSkillsByCategory(skills)

  const activeFiltersCount = countActiveFilters(filters)

  const handleSkillToggle = (skillId: number) => {
    const newSkillIds = new Set(selectedSkillIds)
    if (newSkillIds.has(skillId)) {
      newSkillIds.delete(skillId)
    } else {
      newSkillIds.add(skillId)
    }
    onFiltersChange({
      ...filters,
      skillIds: newSkillIds.size > 0 ? Array.from(newSkillIds) : undefined,
    })
  }

  const handleDateChange = (field: 'startDateFrom' | 'startDateTo', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value ? `${value}T00:00:00` : undefined,
    })
  }

  const handlePointsChange = (field: 'minPoints' | 'maxPoints', value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined
    onFiltersChange({
      ...filters,
      [field]: numValue && !Number.isNaN(numValue) ? numValue : undefined,
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  return (
    <div className="mb-6">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
          data-testid="filter-toggle"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-primary-500 text-white text-xs px-2 py-0.5">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
            data-testid="clear-all-filters"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {isExpanded && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-6" data-testid="filters-panel">
          {/* Skills Filter */}
          <div>
            <Label className="mb-3 block">Filter by Skills</Label>
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <div key={category} className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {SKILL_CATEGORY_LABELS[category as keyof typeof SKILL_CATEGORY_LABELS] ||
                    category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill: SkillResponse) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleSkillToggle(skill.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
                        selectedSkillIds.has(skill.id)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-surface border-border hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }`}
                      data-testid={`skill-filter-${skill.id}`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {skills.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Loading skills...</p>
            )}
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDateFrom" className="mb-2 block">
                Start Date From
              </Label>
              <Input
                id="startDateFrom"
                type="date"
                value={filters.startDateFrom?.split('T')[0] || ''}
                onChange={(e) => handleDateChange('startDateFrom', e.target.value)}
                data-testid="filter-start-date-from"
              />
            </div>
            <div>
              <Label htmlFor="startDateTo" className="mb-2 block">
                Start Date To
              </Label>
              <Input
                id="startDateTo"
                type="date"
                value={filters.startDateTo?.split('T')[0] || ''}
                onChange={(e) => handleDateChange('startDateTo', e.target.value)}
                data-testid="filter-start-date-to"
              />
            </div>
          </div>

          {/* Points Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minPoints" className="mb-2 block">
                Minimum Points
              </Label>
              <Input
                id="minPoints"
                type="number"
                min={0}
                placeholder="e.g., 50"
                value={filters.minPoints ?? ''}
                onChange={(e) => handlePointsChange('minPoints', e.target.value)}
                data-testid="filter-min-points"
              />
            </div>
            <div>
              <Label htmlFor="maxPoints" className="mb-2 block">
                Maximum Points
              </Label>
              <Input
                id="maxPoints"
                type="number"
                min={0}
                placeholder="e.g., 200"
                value={filters.maxPoints ?? ''}
                onChange={(e) => handlePointsChange('maxPoints', e.target.value)}
                data-testid="filter-max-points"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function countActiveFilters(filters: Filters): number {
  let count = 0
  if (filters.skillIds && filters.skillIds.length > 0) count++
  if (filters.startDateFrom) count++
  if (filters.startDateTo) count++
  if (filters.minPoints !== undefined) count++
  if (filters.maxPoints !== undefined) count++
  return count
}
