import { Link } from '@tanstack/react-router'
import { Check, LogIn, Send, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import {
  type ApplicationResponse,
  type ApplicationStatus,
  applyToOpportunity,
  getApplicationStatusColor,
  getApplicationStatusLabel,
  parseApplicationError,
} from '@/lib/application'
import type { OpportunityStatus } from '@/lib/opportunity'

interface ApplyButtonProps {
  opportunityId: number
  opportunityStatus: OpportunityStatus
  maxVolunteers: number
  approvedCount: number
  existingApplication: ApplicationResponse | null
  onApplicationSuccess?: (application: ApplicationResponse) => void
}

export function ApplyButton({
  opportunityId,
  opportunityStatus,
  maxVolunteers,
  approvedCount,
  existingApplication,
  onApplicationSuccess,
}: ApplyButtonProps) {
  const { user } = useAuth()
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [application, setApplication] = useState<ApplicationResponse | null>(existingApplication)

  const spotsRemaining = maxVolunteers - approvedCount
  const hasSpots = spotsRemaining > 0
  const isVolunteer = user?.role === 'VOLUNTEER'
  const isOpen = opportunityStatus === 'OPEN'
  const hasApplied = application !== null

  const handleApply = async () => {
    if (!user || !isVolunteer) return

    setIsApplying(true)
    setError(null)

    try {
      const response = await applyToOpportunity(opportunityId)
      setApplication(response)
      onApplicationSuccess?.(response)
    } catch (err) {
      const message = await parseApplicationError(err)
      setError(message)
    } finally {
      setIsApplying(false)
    }
  }

  // Not logged in - show login prompt
  if (!user) {
    return (
      <div className="space-y-2" data-testid="apply-login-prompt">
        <Link to="/login">
          <Button className="w-full" variant="primary">
            <LogIn className="mr-2 h-4 w-4" />
            Login to Apply
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground text-center">
          You need to be logged in as a volunteer to apply
        </p>
      </div>
    )
  }

  // Not a volunteer - don't show button
  if (!isVolunteer) {
    return null
  }

  // Already applied - show status
  if (hasApplied && application) {
    return (
      <div className="space-y-3" data-testid="application-status">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <span className="font-medium">You have applied</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <StatusBadge status={application.status} />
        </div>
        {application.appliedAt && (
          <p className="text-xs text-muted-foreground">
            Applied on {new Date(application.appliedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    )
  }

  // Opportunity not open
  if (!isOpen) {
    return (
      <div className="space-y-2" data-testid="opportunity-not-open">
        <Button className="w-full" disabled>
          Not Available
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          This opportunity is not currently accepting applications
        </p>
      </div>
    )
  }

  // No spots available
  if (!hasSpots) {
    return (
      <div className="space-y-2" data-testid="no-spots-available">
        <Button className="w-full" disabled>
          <Users className="mr-2 h-4 w-4" />
          No Spots Available
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          All volunteer spots have been filled
        </p>
      </div>
    )
  }

  // Can apply
  return (
    <div className="space-y-3" data-testid="apply-section">
      <Button
        className="w-full"
        onClick={handleApply}
        loading={isApplying}
        disabled={isApplying}
        data-testid="apply-button"
      >
        <Send className="mr-2 h-4 w-4" />
        {isApplying ? 'Applying...' : 'Apply Now'}
      </Button>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining
        </span>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg bg-error/10 border border-error text-error text-sm"
          role="alert"
          data-testid="apply-error"
        >
          {error}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const colorClass = getApplicationStatusColor(status)
  const label = getApplicationStatusLabel(status)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      data-testid="status-badge"
    >
      {label}
    </span>
  )
}
