import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Check, CheckCircle2, Clock, Loader2, Star, User, X } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  type ApplicationResponse,
  approveApplication,
  completeApplication,
  getApplicationStatusColor,
  getApplicationStatusLabel,
  getApplicationsForOpportunity,
  rejectApplication,
} from '@/lib/application'

interface ApplicationsManagementProps {
  opportunityId: number
  maxVolunteers: number
  endDate: string
  pointsReward: number
}

export function ApplicationsManagement({
  opportunityId,
  maxVolunteers,
  endDate,
  pointsReward,
}: ApplicationsManagementProps) {
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const {
    data: applications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['opportunity-applications', opportunityId],
    queryFn: () => getApplicationsForOpportunity(opportunityId),
  })

  const approveMutation = useMutation({
    mutationFn: approveApplication,
    onMutate: (applicationId) => {
      setProcessingId(applicationId)
      setMutationError(null)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunity-applications', opportunityId] })
      await queryClient.invalidateQueries({ queryKey: ['application-count', opportunityId] })
    },
    onError: (error) => {
      console.error('Failed to approve application:', error)
      setMutationError('Failed to approve application. Please try again.')
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectApplication,
    onMutate: (applicationId) => {
      setProcessingId(applicationId)
      setMutationError(null)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunity-applications', opportunityId] })
    },
    onError: (error) => {
      console.error('Failed to reject application:', error)
      setMutationError('Failed to reject application. Please try again.')
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const completeMutation = useMutation({
    mutationFn: completeApplication,
    onMutate: (applicationId) => {
      setProcessingId(applicationId)
      setMutationError(null)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunity-applications', opportunityId] })
      await queryClient.invalidateQueries({ queryKey: ['application-count', opportunityId] })
    },
    onError: (error) => {
      console.error('Failed to complete application:', error)
      setMutationError('Failed to mark participation as completed. Please try again.')
    },
    onSettled: () => {
      setProcessingId(null)
    },
  })

  const handleApprove = (applicationId: number) => {
    approveMutation.mutate(applicationId)
  }

  const handleReject = (applicationId: number) => {
    rejectMutation.mutate(applicationId)
  }

  const handleComplete = (applicationId: number) => {
    completeMutation.mutate(applicationId)
  }

  // Check if the opportunity has ended
  const hasOpportunityEnded = new Date(endDate) < new Date()

  const approvedCount = applications.filter((app) => app.status === 'APPROVED').length
  const pendingCount = applications.filter((app) => app.status === 'PENDING').length
  const spotsRemaining = maxVolunteers - approvedCount

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load applications</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Applications
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount} pending
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {approvedCount} / {maxVolunteers} spots filled
          {spotsRemaining > 0 && ` (${spotsRemaining} remaining)`}
        </p>
      </CardHeader>
      <CardContent>
        {mutationError && (
          <div
            className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm"
            role="alert"
            data-testid="mutation-error"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {mutationError}
            </div>
          </div>
        )}
        {applications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No applications yet</p>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onApprove={handleApprove}
                onReject={handleReject}
                onComplete={handleComplete}
                isProcessing={processingId === application.id}
                spotsRemaining={spotsRemaining}
                hasOpportunityEnded={hasOpportunityEnded}
                pointsReward={pointsReward}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ApplicationCardProps {
  application: ApplicationResponse
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onComplete: (id: number) => void
  isProcessing: boolean
  spotsRemaining: number
  hasOpportunityEnded: boolean
  pointsReward: number
  formatDate: (dateString: string) => string
}

function ApplicationCard({
  application,
  onApprove,
  onReject,
  onComplete,
  isProcessing,
  spotsRemaining,
  hasOpportunityEnded,
  pointsReward,
  formatDate,
}: ApplicationCardProps) {
  const isPending = application.status === 'PENDING'
  const isApproved = application.status === 'APPROVED'
  const isCompleted = application.status === 'COMPLETED'
  const canApprove = isPending && spotsRemaining > 0
  const canComplete = isApproved && hasOpportunityEnded

  return (
    <div
      className="border rounded-lg p-4 space-y-3"
      data-testid={`application-card-${application.id}`}
    >
      {/* Header with volunteer info and status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium" data-testid="volunteer-name">
              {application.volunteer.name}
            </p>
            <p className="text-sm text-muted-foreground">{application.volunteer.email}</p>
          </div>
        </div>
        <Badge
          className={getApplicationStatusColor(application.status)}
          data-testid="application-status"
        >
          {getApplicationStatusLabel(application.status)}
        </Badge>
      </div>

      {/* Application message */}
      {application.message && (
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-sm text-muted-foreground italic" data-testid="application-message">
            "{application.message}"
          </p>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Applied: {formatDate(application.appliedAt)}
        </div>
        {application.reviewedAt && (
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Reviewed: {formatDate(application.reviewedAt)}
          </div>
        )}
        {application.completedAt && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed: {formatDate(application.completedAt)}
          </div>
        )}
      </div>

      {/* Points awarded indicator for completed applications */}
      {isCompleted && pointsReward > 0 && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-md p-2">
          <Star className="h-4 w-4" />
          <span data-testid="points-awarded">+{pointsReward} points awarded</span>
        </div>
      )}

      {/* Action buttons for pending applications */}
      {isPending && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            size="sm"
            onClick={() => onApprove(application.id)}
            disabled={isProcessing || !canApprove}
            data-testid="approve-button"
            className="flex-1"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Approve
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject(application.id)}
            disabled={isProcessing}
            data-testid="reject-button"
            className="flex-1"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="h-4 w-4 mr-1" />
                Reject
              </>
            )}
          </Button>
        </div>
      )}

      {/* Action button for approved applications - Mark Complete */}
      {isApproved && (
        <div className="flex flex-col gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onComplete(application.id)}
            disabled={isProcessing || !canComplete}
            data-testid="complete-button"
            className="w-full"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Complete
                {pointsReward > 0 && ` (+${pointsReward} pts)`}
              </>
            )}
          </Button>
          {!hasOpportunityEnded && (
            <p className="text-xs text-muted-foreground" data-testid="complete-disabled-message">
              Participation can only be marked as completed after the opportunity ends
            </p>
          )}
        </div>
      )}

      {/* Warning if no spots available */}
      {isPending && !canApprove && (
        <p className="text-xs text-destructive">Cannot approve: No spots remaining</p>
      )}
    </div>
  )
}
