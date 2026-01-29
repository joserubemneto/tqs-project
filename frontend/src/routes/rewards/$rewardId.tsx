import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'
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
  getAvailabilityText,
  getReward,
  getRewardTypeColor,
  getRewardTypeLabel,
  isRewardAvailable,
  redeemReward,
  type RedemptionResponse,
} from '@/lib/reward'

export const Route = createFileRoute('/rewards/$rewardId')({
  component: RewardDetailPage,
})

function RewardDetailPage() {
  const { rewardId } = Route.useParams()
  const id = parseInt(rewardId, 10)
  const { user, refreshPoints } = useAuth()
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResponse | null>(null)
  const [redemptionError, setRedemptionError] = useState<string | null>(null)

  const {
    data: reward,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['reward', id],
    queryFn: () => getReward(id),
    enabled: !Number.isNaN(id),
  })

  const redeemMutation = useMutation({
    mutationFn: () => redeemReward(id),
    onSuccess: async (result) => {
      setRedemptionResult(result)
      setRedemptionError(null)
      // Refresh user points
      await refreshPoints()
      // Refetch reward to update remaining quantity
      refetch()
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to redeem reward'
      try {
        const parsed = JSON.parse(message)
        setRedemptionError(parsed.message || message)
      } catch {
        setRedemptionError(message)
      }
    },
  })

  const isVolunteer = user?.role === 'VOLUNTEER'
  const hasEnoughPoints = user?.points !== undefined && reward && user.points >= reward.pointsCost

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
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
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-testid="error-state"
        >
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium" data-testid="error-message">
            {is404 ? 'Reward not found' : 'Failed to load reward'}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {is404
              ? 'The reward you are looking for does not exist or has been removed.'
              : error instanceof Error
                ? error.message
                : 'An error occurred'}
          </p>
          <div className="flex gap-2 mt-4">
            <Link to="/rewards" className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to rewards
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
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-testid="invalid-id-state"
        >
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium">Invalid reward ID</p>
          <Link to="/rewards" className={`${buttonVariants({ variant: 'outline' })} mt-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to rewards
          </Link>
        </div>
      </div>
    )
  }

  if (!reward) {
    return null
  }

  const available = isRewardAvailable(reward)
  const availabilityText = getAvailabilityText(reward)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Link to="/rewards" className={buttonVariants({ variant: 'ghost' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to rewards catalog
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className={!available ? 'opacity-75' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl" data-testid="reward-title">
                    {reward.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRewardTypeColor(reward.type)} data-testid="reward-type">
                    {getRewardTypeLabel(reward.type)}
                  </Badge>
                  {!reward.active && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p
                className="text-muted-foreground whitespace-pre-wrap"
                data-testid="reward-description"
              >
                {reward.description}
              </p>
            </CardContent>
          </Card>

          {/* Partner Card (if applicable) */}
          {reward.partner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Partner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-lg" data-testid="partner-name">
                    {reward.partner.name}
                  </p>
                  {reward.partner.description && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {reward.partner.description}
                    </p>
                  )}
                </div>
                {reward.partner.website && (
                  <a
                    href={reward.partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Visit website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Points Cost Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Redeem for</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary" data-testid="reward-points">
                  {reward.pointsCost}
                </div>
                <div className="text-muted-foreground">points</div>
              </div>
            </CardContent>
          </Card>

          {/* Availability Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={available ? 'default' : 'secondary'}
                  data-testid="reward-availability"
                >
                  {available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium" data-testid="reward-quantity">
                  {availabilityText}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Date Range Card (if applicable) */}
          {(reward.availableFrom || reward.availableUntil) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Availability Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reward.availableFrom && (
                  <div>
                    <p className="text-sm text-muted-foreground">Available from</p>
                    <p className="font-medium" data-testid="reward-available-from">
                      {formatDate(reward.availableFrom)}
                    </p>
                  </div>
                )}
                {reward.availableUntil && (
                  <div>
                    <p className="text-sm text-muted-foreground">Available until</p>
                    <p className="font-medium" data-testid="reward-available-until">
                      {formatDate(reward.availableUntil)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Redemption Success */}
          {redemptionResult && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-semibold text-green-800">Reward Redeemed!</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your redemption code:
                    </p>
                    <p className="text-2xl font-mono font-bold text-green-900 mt-2">
                      {redemptionResult.code}
                    </p>
                  </div>
                  <p className="text-xs text-green-600">
                    Save this code to claim your reward
                  </p>
                  <Link to="/rewards/my-redemptions">
                    <Button variant="outline" size="sm" className="mt-2">
                      View All My Redemptions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Redemption Error */}
          {redemptionError && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Redemption Failed</p>
                  <p className="text-sm text-red-700 mt-1">{redemptionError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Redeem Button */}
          {available && !redemptionResult && isVolunteer && (
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                Your balance: <span className="font-semibold text-yellow-600">{user?.points ?? 0} points</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => redeemMutation.mutate()}
                disabled={redeemMutation.isPending || !hasEnoughPoints}
              >
                {redeemMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Award className="h-4 w-4 mr-2" />
                )}
                {hasEnoughPoints ? 'Redeem Reward' : 'Not Enough Points'}
              </Button>
              {!hasEnoughPoints && (
                <p className="text-center text-xs text-muted-foreground">
                  You need {reward.pointsCost - (user?.points ?? 0)} more points
                </p>
              )}
            </div>
          )}

          {/* Not logged in or not volunteer */}
          {available && !redemptionResult && !isVolunteer && (
            <div className="space-y-3">
              <Button className="w-full" size="lg" disabled>
                <Award className="h-4 w-4 mr-2" />
                Redeem Reward
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {user ? 'Only volunteers can redeem rewards' : 'Sign in as a volunteer to redeem'}
              </p>
            </div>
          )}

          {!available && (
            <p className="text-center text-sm text-muted-foreground">
              This reward is currently not available for redemption.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
