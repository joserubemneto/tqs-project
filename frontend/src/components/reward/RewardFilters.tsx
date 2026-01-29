import { Filter, Search, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Input, Label } from '@/components/ui'
import { getRewardTypeColor, getRewardTypeLabel, type RewardType } from '@/lib/reward'

export interface RewardFiltersState {
  search?: string
  types?: RewardType[]
  minPoints?: number
  maxPoints?: number
}

interface RewardFiltersProps {
  filters: RewardFiltersState
  onFiltersChange: (filters: RewardFiltersState) => void
}

const REWARD_TYPES: RewardType[] = [
  'UA_SERVICE',
  'PARTNER_VOUCHER',
  'MERCHANDISE',
  'CERTIFICATE',
  'OTHER',
]

export function RewardFilters({ filters, onFiltersChange }: RewardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const selectedTypes = new Set(filters.types || [])
  const activeFiltersCount = countActiveFilters(filters)

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined,
    })
  }

  const handleTypeToggle = (type: RewardType) => {
    const newTypes = new Set(selectedTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    onFiltersChange({
      ...filters,
      types: newTypes.size > 0 ? Array.from(newTypes) : undefined,
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
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search rewards..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            data-testid="reward-search"
          />
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
            data-testid="filter-toggle"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
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
      </div>

      {/* Expanded Filters Panel */}
      {isExpanded && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-6" data-testid="filters-panel">
          {/* Type Filter */}
          <div>
            <Label className="mb-3 block">Filter by Type</Label>
            <div className="flex flex-wrap gap-2">
              {REWARD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeToggle(type)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer ${
                    selectedTypes.has(type)
                      ? getRewardTypeColor(type)
                      : 'bg-surface border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                  data-testid={`type-filter-${type}`}
                >
                  {getRewardTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Points Cost Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minPoints" className="mb-2 block">
                Minimum Points Cost
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
                Maximum Points Cost
              </Label>
              <Input
                id="maxPoints"
                type="number"
                min={0}
                placeholder="e.g., 500"
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

function countActiveFilters(filters: RewardFiltersState): number {
  let count = 0
  if (filters.search) count++
  if (filters.types && filters.types.length > 0) count++
  if (filters.minPoints !== undefined) count++
  if (filters.maxPoints !== undefined) count++
  return count
}
