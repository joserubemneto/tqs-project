import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Award, Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  type CreateRewardRequest,
  createReward,
  deleteReward,
  getRewards,
  type RewardResponse,
  type UpdateRewardRequest,
  updateReward,
} from '@/lib/reward'
import { RewardCard } from './RewardCard'
import { RewardForm } from './RewardForm'

export function RewardsManagement() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingReward, setEditingReward] = useState<RewardResponse | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const {
    data: rewardsPage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-rewards', page],
    queryFn: () => getRewards(page, 10),
  })

  const createMutation = useMutation({
    mutationFn: createReward,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-rewards'] })
      setShowForm(false)
      setMutationError(null)
    },
    onError: (error) => {
      console.error('Failed to create reward:', error)
      setMutationError('Failed to create reward. Please try again.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRewardRequest }) => updateReward(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-rewards'] })
      setEditingReward(null)
      setMutationError(null)
    },
    onError: (error) => {
      console.error('Failed to update reward:', error)
      setMutationError('Failed to update reward. Please try again.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReward,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-rewards'] })
      setMutationError(null)
    },
    onError: (error) => {
      console.error('Failed to deactivate reward:', error)
      setMutationError('Failed to deactivate reward. Please try again.')
    },
  })

  const handleCreate = async (data: CreateRewardRequest | UpdateRewardRequest) => {
    await createMutation.mutateAsync(data as CreateRewardRequest)
  }

  const handleUpdate = async (data: CreateRewardRequest | UpdateRewardRequest) => {
    if (!editingReward) return
    await updateMutation.mutateAsync({ id: editingReward.id, data: data as UpdateRewardRequest })
  }

  const handleDelete = (reward: RewardResponse) => {
    if (window.confirm(`Are you sure you want to deactivate "${reward.title}"?`)) {
      deleteMutation.mutate(reward.id)
    }
  }

  const rewards = rewardsPage?.content || []
  const totalPages = rewardsPage?.totalPages || 0
  const activeCount = rewards.filter((r) => r.active).length

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            Rewards Management
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
            <Award className="h-5 w-5" />
            Rewards Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground">Failed to load rewards</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            Rewards Management
          </CardTitle>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeCount} active
            </Badge>
          )}
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Reward
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {mutationError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{mutationError}</p>
            <button type="button" onClick={() => setMutationError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Create New Reward</h2>
              <RewardForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                isSubmitting={createMutation.isPending}
              />
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {editingReward && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Edit Reward</h2>
              <RewardForm
                initialData={editingReward}
                onSubmit={handleUpdate}
                onCancel={() => setEditingReward(null)}
                isSubmitting={updateMutation.isPending}
              />
            </div>
          </div>
        )}

        {rewards.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No rewards yet</p>
            <p className="text-sm text-muted-foreground">Create your first reward to get started</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  showActions
                  onEdit={setEditingReward}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
