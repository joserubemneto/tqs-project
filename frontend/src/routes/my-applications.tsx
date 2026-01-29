import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Loader2,
  MapPin,
  RefreshCw,
  Star,
} from 'lucide-react'
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import {
  type ApplicationResponse,
  type ApplicationStatus,
  getApplicationStatusColor,
  getApplicationStatusLabel,
  getMyApplications,
} from '@/lib/application'

export const Route = createFileRoute('/my-applications')({
  component: MyApplicationsPage,
})

function MyApplicationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()

  const {
    data: applications,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-applications'],
    queryFn: getMyApplications,
    enabled: user?.role === 'VOLUNTEER',
  })

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12" data-testid="auth-loading">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" />
  }

  // Redirect if not a volunteer
  if (user.role !== 'VOLUNTEER') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-testid="not-volunteer"
        >
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Access Restricted</p>
          <p className="text-muted-foreground mt-2">
            Only volunteers can view applications. Your role is: {user.role}
          </p>
          <Link to="/opportunities" className={`${buttonVariants({ variant: 'outline' })} mt-4`}>
            Browse Opportunities
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
        <p className="text-muted-foreground mt-2">Track your volunteer opportunity applications</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12" data-testid="loading-state">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-testid="error-state"
        >
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium">Failed to load applications</p>
          <p className="text-muted-foreground text-sm mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {/* Applications List */}
      {applications &&
        !isLoading &&
        !isError &&
        (applications.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-state">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              You haven&apos;t applied to any opportunities yet
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Browse available opportunities and submit your first application
            </p>
            <Link to="/opportunities" className={`${buttonVariants({ variant: 'primary' })} mt-4`}>
              Browse Opportunities
            </Link>
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-4">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </p>

            {/* Applications Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          </>
        ))}
    </div>
  )
}

interface ApplicationCardProps {
  application: ApplicationResponse
}

function ApplicationCard({ application }: ApplicationCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Link
      to="/opportunities/$opportunityId"
      params={{ opportunityId: String(application.opportunity.id) }}
      className="block"
      data-testid={`application-card-link-${application.id}`}
    >
      <Card
        className="flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer"
        data-testid={`application-card-${application.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{application.opportunity.title}</CardTitle>
            <StatusBadge status={application.status} />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Opportunity Details */}
          <div className="space-y-2 mb-4">
            {application.opportunity.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{application.opportunity.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                {formatDate(application.opportunity.startDate)} -{' '}
                {formatDate(application.opportunity.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 flex-shrink-0 text-yellow-500" />
              <span className="font-medium">{application.opportunity.pointsReward} points</span>
            </div>
          </div>

          {/* Application Info */}
          <div className="mt-auto pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Applied on {formatDateTime(application.appliedAt)}
            </p>
            {application.message && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                Message: {application.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const colorClass = getApplicationStatusColor(status)
  const label = getApplicationStatusLabel(status)

  return (
    <Badge className={`${colorClass} flex-shrink-0`} data-testid="status-badge">
      {label}
    </Badge>
  )
}
