import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  cancelOpportunity,
  type OpportunityResponse,
  parseOpportunityError,
} from '@/lib/opportunity'

interface CancelOpportunityDialogProps {
  opportunity: OpportunityResponse
  isOpen: boolean
  onClose: () => void
  onSuccess: (response: OpportunityResponse) => void
}

export function CancelOpportunityDialog({
  opportunity,
  isOpen,
  onClose,
  onSuccess,
}: CancelOpportunityDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await cancelOpportunity(opportunity.id)
      onSuccess(response)
      onClose()
    } catch (err) {
      const message = await parseOpportunityError(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-testid="cancel-dialog-overlay"
    >
      <div className="w-full max-w-md mx-4">
        <Card>
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={onClose}
              disabled={isLoading}
              data-testid="close-dialog-button"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Cancel Opportunity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to cancel{' '}
              <span className="font-semibold text-foreground">&quot;{opportunity.title}&quot;</span>
              ?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All enrolled volunteers will be notified that the
              opportunity has been cancelled.
            </p>

            {error && (
              <div
                className="p-3 rounded-lg bg-error/10 border border-error text-error text-sm"
                role="alert"
                data-testid="error-message"
              >
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                data-testid="keep-opportunity-button"
              >
                Keep Opportunity
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
                loading={isLoading}
                disabled={isLoading}
                data-testid="confirm-cancel-button"
              >
                {isLoading ? 'Cancelling...' : 'Cancel Opportunity'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
