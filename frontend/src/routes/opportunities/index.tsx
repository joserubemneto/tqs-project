import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { OpportunityFilters } from '@/components/opportunity/OpportunityFilters'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  type OpportunityFilters as Filters,
  getOpportunities,
  type OpportunityResponse,
} from '@/lib/opportunity'

export const Route = createFileRoute('/opportunities/')({
  component: OpportunitiesPage,
})

const PAGE_SIZE = 10

function OpportunitiesPage() {
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<Filters>({})

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPage(0) // Reset to first page when filters change
  }

  const {
    data: opportunitiesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['opportunities', page, filters],
    queryFn: () =>
      getOpportunities({
        page,
        size: PAGE_SIZE,
        sortBy: 'startDate',
        sortDir: 'asc',
        ...filters,
      }),
  })

  const hasActiveFilters =
    (filters.skillIds && filters.skillIds.length > 0) ||
    filters.startDateFrom ||
    filters.startDateTo ||
    filters.minPoints !== undefined ||
    filters.maxPoints !== undefined

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Volunteering Opportunities</h1>
        <p className="text-muted-foreground mt-2">
          Browse available opportunities and find one that matches your skills
        </p>
      </div>

      {/* Filters */}
      <OpportunityFilters filters={filters} onFiltersChange={handleFiltersChange} />

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
          <p className="text-destructive font-medium">Failed to load opportunities</p>
          <p className="text-muted-foreground text-sm mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {/* Opportunities List */}
      {opportunitiesData &&
        !isLoading &&
        !isError &&
        (opportunitiesData.content.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-state">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              {hasActiveFilters ? (
                <Filter className="h-12 w-12 text-muted-foreground" />
              ) : (
                <Calendar className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground text-lg">
              {hasActiveFilters
                ? 'No opportunities match your filters'
                : 'No opportunities available at the moment'}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              {hasActiveFilters
                ? 'Try adjusting your filter criteria'
                : 'Check back later for new volunteering opportunities'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={() => handleFiltersChange({})}
                className="mt-4"
                data-testid="clear-filters-empty"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-4">
              Showing {opportunitiesData.content.length} of {opportunitiesData.totalElements}{' '}
              opportunities
            </p>

            {/* Opportunities Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {opportunitiesData.content.map((opportunity) => (
                <Link
                  key={opportunity.id}
                  to="/opportunities/$opportunityId"
                  params={{ opportunityId: String(opportunity.id) }}
                  className="block"
                  data-testid={`opportunity-card-link-${opportunity.id}`}
                >
                  <OpportunityCard opportunity={opportunity} />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {opportunitiesData.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {opportunitiesData.number + 1} of {opportunitiesData.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={opportunitiesData.number === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={opportunitiesData.number >= opportunitiesData.totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ))}
    </div>
  )
}

interface OpportunityCardProps {
  opportunity: OpportunityResponse
}

function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card
      className="flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer"
      data-testid={`opportunity-card-${opportunity.id}`}
    >
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{opportunity.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Description */}
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{opportunity.description}</p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          {opportunity.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{opportunity.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              {formatDate(opportunity.startDate)} - {formatDate(opportunity.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>Max {opportunity.maxVolunteers} volunteers</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 flex-shrink-0 text-yellow-500" />
            <span className="font-medium">{opportunity.pointsReward} points</span>
          </div>
        </div>

        {/* Skills */}
        {opportunity.requiredSkills.length > 0 && (
          <div className="mt-auto">
            <p className="text-xs text-muted-foreground mb-2">Required Skills:</p>
            <div className="flex flex-wrap gap-1">
              {opportunity.requiredSkills.slice(0, 3).map((skill) => (
                <Badge key={skill.id} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
              {opportunity.requiredSkills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{opportunity.requiredSkills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
