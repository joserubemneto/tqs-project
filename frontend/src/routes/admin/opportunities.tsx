import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Send,
  X,
  XCircle,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { getAuthToken, isAdmin } from '@/lib/auth'
import {
  cancelOpportunity,
  getAdminOpportunities,
  type OpportunityResponse,
  type OpportunityStatus,
  publishOpportunity,
} from '@/lib/opportunity'

export const Route = createFileRoute('/admin/opportunities')({
  beforeLoad: () => {
    const token = getAuthToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
    // Check if user has admin role
    if (!isAdmin()) {
      throw redirect({ to: '/', search: { error: 'forbidden' } })
    }
  },
  component: OpportunitiesPage,
})

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'FULL', label: 'Full' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const STATUS_BADGE_VARIANTS: Record<
  OpportunityStatus,
  'default' | 'secondary' | 'outline' | 'error' | 'success' | 'warning'
> = {
  DRAFT: 'secondary',
  OPEN: 'success',
  FULL: 'warning',
  IN_PROGRESS: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'error',
}

const PAGE_SIZE = 10

// Helper to parse error messages from API responses
function parseErrorMessage(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : fallback
  try {
    const parsed = JSON.parse(message)
    return parsed.message || message
  } catch {
    return message
  }
}

// Helper to create opportunity mutation config
function createOpportunityMutationConfig(
  queryClient: ReturnType<typeof useQueryClient>,
  setNotification: (n: { type: 'success' | 'error'; message: string }) => void,
  action: string,
) {
  return {
    onSuccess: (updatedOpportunity: OpportunityResponse) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'opportunities'] })
      setNotification({
        type: 'success' as const,
        message: `Successfully ${action} "${updatedOpportunity.title}"`,
      })
    },
    onError: (err: unknown) => {
      setNotification({
        type: 'error' as const,
        message: parseErrorMessage(err, `Failed to ${action} opportunity`),
      })
    },
  }
}

function OpportunitiesPage() {
  const queryClient = useQueryClient()

  // State
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | ''>('')
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Reset page when filter changes
  useEffect(() => {
    setPage(0)
  }, [statusFilter])

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Fetch opportunities query
  const {
    data: opportunitiesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'opportunities', page, statusFilter],
    queryFn: () =>
      getAdminOpportunities({
        page,
        size: PAGE_SIZE,
        status: statusFilter || undefined,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
  })

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (id: number) => publishOpportunity(id),
    ...createOpportunityMutationConfig(queryClient, setNotification, 'published'),
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelOpportunity(id),
    ...createOpportunityMutationConfig(queryClient, setNotification, 'cancelled'),
  })

  const clearFilters = () => {
    setStatusFilter('')
    setPage(0)
  }

  const hasFilters = statusFilter !== ''

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Opportunities</h1>
          <p className="text-muted-foreground mt-2">View and manage all opportunities</p>
        </div>
        <Link to="/admin">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-md flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-auto hover:opacity-70"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Opportunities List</span>
            {opportunitiesData && (
              <span className="text-sm font-normal text-muted-foreground">
                {opportunitiesData.totalElements} total opportunities
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OpportunityStatus | '')}
              />
            </div>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
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
              <p className="text-destructive font-medium">Failed to load opportunities</p>
              <p className="text-muted-foreground text-sm mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
          )}

          {/* Opportunities Table */}
          {opportunitiesData && !isLoading && !isError && (
            <>
              {opportunitiesData.content.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {hasFilters ? 'No opportunities match your filter' : 'No opportunities found'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Promoter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunitiesData.content.map((opportunity) => (
                      <OpportunityRow
                        key={opportunity.id}
                        opportunity={opportunity}
                        onPublish={() => publishMutation.mutate(opportunity.id)}
                        onCancel={() => cancelMutation.mutate(opportunity.id)}
                        isPublishing={publishMutation.isPending}
                        isCancelling={cancelMutation.isPending}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {opportunitiesData.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Reusable action button with loading state
interface ActionButtonProps {
  onClick: () => void
  isLoading: boolean
  title: string
  icon: ReactNode
}

function ActionButton({ onClick, isLoading, title, icon }: ActionButtonProps) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={isLoading} title={title}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    </Button>
  )
}

// Format date helper
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface OpportunityRowProps {
  opportunity: OpportunityResponse
  onPublish: () => void
  onCancel: () => void
  isPublishing: boolean
  isCancelling: boolean
}

function OpportunityRow({
  opportunity,
  onPublish,
  onCancel,
  isPublishing,
  isCancelling,
}: OpportunityRowProps) {
  const canPublish = opportunity.status === 'DRAFT'
  const canCancel = ['DRAFT', 'OPEN', 'FULL'].includes(opportunity.status)

  return (
    <TableRow>
      <TableCell className="font-medium max-w-[200px] truncate">{opportunity.title}</TableCell>
      <TableCell>{opportunity.promoter.name}</TableCell>
      <TableCell>
        <Badge variant={STATUS_BADGE_VARIANTS[opportunity.status]}>{opportunity.status}</Badge>
      </TableCell>
      <TableCell>{formatDate(opportunity.startDate)}</TableCell>
      <TableCell>{opportunity.pointsReward}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Link
            to="/opportunities/$opportunityId"
            params={{ opportunityId: String(opportunity.id) }}
          >
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {canPublish && (
            <ActionButton
              onClick={onPublish}
              isLoading={isPublishing}
              title="Publish"
              icon={<Send className="h-4 w-4 text-green-600" />}
            />
          )}
          {canCancel && (
            <ActionButton
              onClick={onCancel}
              isLoading={isCancelling}
              title="Cancel"
              icon={<XCircle className="h-4 w-4 text-red-600" />}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
