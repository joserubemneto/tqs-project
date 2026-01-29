import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Award, Loader2, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RewardCard, RewardFilters, type RewardFiltersState } from '@/components/reward'
import { Button, Label, Select } from '@/components/ui'
import { getAvailableRewards } from '@/lib/reward'

export const Route = createFileRoute('/rewards/')({
  component: RewardsPage,
})

type SortOption = 'points-asc' | 'points-desc' | 'newest' | 'title-asc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'points-asc', label: 'Points: Low to High' },
  { value: 'points-desc', label: 'Points: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'title-asc', label: 'Title: A to Z' },
]

function RewardsPage() {
  const [filters, setFilters] = useState<RewardFiltersState>({})
  const [sortBy, setSortBy] = useState<SortOption>('points-asc')

  const {
    data: rewards,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['available-rewards'],
    queryFn: getAvailableRewards,
  })

  // Apply filters and sorting client-side
  const filteredAndSortedRewards = useMemo(() => {
    if (!rewards) return []

    let result = [...rewards]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower),
      )
    }

    // Apply type filter
    if (filters.types && filters.types.length > 0) {
      result = result.filter((r) => filters.types!.includes(r.type))
    }

    // Apply points range filter
    if (filters.minPoints !== undefined) {
      result = result.filter((r) => r.pointsCost >= filters.minPoints!)
    }
    if (filters.maxPoints !== undefined) {
      result = result.filter((r) => r.pointsCost <= filters.maxPoints!)
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'points-asc':
          return a.pointsCost - b.pointsCost
        case 'points-desc':
          return b.pointsCost - a.pointsCost
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'title-asc':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return result
  }, [rewards, filters, sortBy])

  const hasActiveFilters =
    filters.search ||
    (filters.types && filters.types.length > 0) ||
    filters.minPoints !== undefined ||
    filters.maxPoints !== undefined

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Rewards Catalog</h1>
        <p className="text-muted-foreground mt-2">Redeem your earned points for valuable rewards</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium">Failed to load rewards</p>
          <p className="text-muted-foreground text-sm mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {/* Rewards Content */}
      {rewards && !isLoading && !isError && (
        <>
          {/* Filters */}
          <RewardFilters filters={filters} onFiltersChange={setFilters} />

          {/* Sorting and Results Count */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <p className="text-sm text-muted-foreground" data-testid="results-count">
              {filteredAndSortedRewards.length} reward
              {filteredAndSortedRewards.length !== 1 ? 's' : ''}{' '}
              {hasActiveFilters ? 'found' : 'available'}
              {hasActiveFilters && rewards.length !== filteredAndSortedRewards.length && (
                <span className="text-muted-foreground/70"> (of {rewards.length} total)</span>
              )}
            </p>

            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-sm text-muted-foreground whitespace-nowrap">
                Sort by:
              </Label>
              <Select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                options={SORT_OPTIONS}
                className="w-48"
                data-testid="sort-select"
              />
            </div>
          </div>

          {/* Empty State */}
          {filteredAndSortedRewards.length === 0 && (
            <div className="text-center py-12" data-testid="empty-state">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Award className="h-12 w-12 text-muted-foreground" />
              </div>
              {hasActiveFilters ? (
                <>
                  <p className="text-muted-foreground text-lg">No rewards match your filters</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({})}
                    className="mt-4"
                    data-testid="clear-filters-button"
                  >
                    Clear All Filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-lg">
                    No rewards available at the moment
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Check back later for new rewards to redeem
                  </p>
                </>
              )}
            </div>
          )}

          {/* Rewards Grid */}
          {filteredAndSortedRewards.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="rewards-grid">
              {filteredAndSortedRewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
