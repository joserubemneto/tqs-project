import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  RefreshCw,
  Star,
  User,
  Users,
} from 'lucide-react'
import { Badge, Button, buttonVariants, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { getOpportunityById } from '@/lib/opportunity'

export const Route = createFileRoute('/opportunities/$opportunityId')({
  component: OpportunityDetailPage,
})

function OpportunityDetailPage() {
  const { opportunityId } = Route.useParams()
  const id = parseInt(opportunityId, 10)

  const {
    data: opportunity,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunityById(id),
    enabled: !isNaN(id),
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'FULL':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'DRAFT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12" data-testid="loading-state">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Error State
  if (isError) {
    const is404 = error instanceof Error && error.message.includes('404')
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="error-state">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium" data-testid="error-message">
            {is404 ? 'Opportunity not found' : 'Failed to load opportunity'}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {is404
              ? 'The opportunity you are looking for does not exist or has been removed.'
              : error instanceof Error
                ? error.message
                : 'An error occurred'}
          </p>
          <div className="flex gap-2 mt-4">
            <Link to="/opportunities" className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to opportunities
            </Link>
            {!is404 && (
              <Button variant="outline" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Invalid ID
  if (Number.isNaN(id)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="invalid-id-state">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium">Invalid opportunity ID</p>
          <Link to="/opportunities" className={`${buttonVariants({ variant: 'outline' })} mt-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to opportunities
          </Link>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link to="/opportunities" className={`${buttonVariants({ variant: 'ghost' })} mb-6`}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to opportunities
      </Link>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-2xl" data-testid="opportunity-title">
                  {opportunity.title}
                </CardTitle>
                <Badge className={getStatusColor(opportunity.status)} data-testid="opportunity-status">
                  {opportunity.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap" data-testid="opportunity-description">
                {opportunity.description}
              </p>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium" data-testid="opportunity-start-date">
                  {formatDateTime(opportunity.startDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium" data-testid="opportunity-end-date">
                  {formatDateTime(opportunity.endDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Required Skills Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {opportunity.requiredSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="opportunity-skills">
                  {opportunity.requiredSkills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-sm">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No specific skills required</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Points */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points Reward</p>
                  <p className="font-semibold text-lg" data-testid="opportunity-points">
                    {opportunity.pointsReward} points
                  </p>
                </div>
              </div>

              {/* Max Volunteers */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Volunteers</p>
                  <p className="font-semibold" data-testid="opportunity-max-volunteers">
                    {opportunity.maxVolunteers}
                  </p>
                </div>
              </div>

              {/* Location */}
              {opportunity.location && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold" data-testid="opportunity-location">
                      {opportunity.location}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Promoter Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Promoter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium" data-testid="opportunity-promoter">
                {opportunity.promoter.name}
              </p>
            </CardContent>
          </Card>

          {/* Created At Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Posted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground" data-testid="opportunity-created-at">
                {formatDate(opportunity.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
