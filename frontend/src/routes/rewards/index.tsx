import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Award, Loader2, RefreshCw } from 'lucide-react'
import { RewardCard } from '@/components/reward'
import { Button } from '@/components/ui'
import { getAvailableRewards } from '@/lib/reward'

export const Route = createFileRoute('/rewards/')({
  component: RewardsPage,
})

function RewardsPage() {
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

      {/* Rewards List - Empty State */}
      {rewards && !isLoading && !isError && rewards.length === 0 && (
        <div className="text-center py-12" data-testid="empty-state">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Award className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">No rewards available at the moment</p>
          <p className="text-muted-foreground text-sm mt-2">
            Check back later for new rewards to redeem
          </p>
        </div>
      )}

      {/* Rewards List - With Results */}
      {rewards && !isLoading && !isError && rewards.length > 0 && (
        <div>
          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            {rewards.length} reward{rewards.length !== 1 ? 's' : ''} available
          </p>

          {/* Rewards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
