import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { AlertCircle, Award, Copy, Loader2, RefreshCw, Ticket } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { getAuthToken, isVolunteer } from '@/lib/auth'
import {
  getMyRedemptions,
  getRewardTypeColor,
  getRewardTypeLabel,
  type RedemptionResponse,
} from '@/lib/reward'

export const Route = createFileRoute('/rewards/my-redemptions')({
  beforeLoad: () => {
    const token = getAuthToken()
    if (!token) {
      throw redirect({ to: '/login' })
    }
    if (!isVolunteer()) {
      throw redirect({ to: '/', search: { error: 'forbidden' } })
    }
  },
  component: MyRedemptionsPage,
})

function MyRedemptionsPage() {
  const { user } = useAuth()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const {
    data: redemptions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-redemptions'],
    queryFn: getMyRedemptions,
  })

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Redemptions</h1>
          <p className="text-muted-foreground mt-2">
            View your redeemed rewards and codes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-yellow-600">{user?.points ?? 0} pts</p>
          </div>
          <Link to="/rewards">
            <Button variant="outline">Browse Rewards</Button>
          </Link>
        </div>
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
          <p className="text-destructive font-medium">Failed to load redemptions</p>
          <p className="text-muted-foreground text-sm mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}

      {/* Redemptions List */}
      {redemptions && !isLoading && !isError && (
        <>
          {redemptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Ticket className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">No redemptions yet</p>
              <p className="text-muted-foreground text-sm mt-2">
                Browse rewards and redeem your points for valuable benefits
              </p>
              <Link to="/rewards">
                <Button variant="primary" className="mt-4">
                  Browse Rewards
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {redemptions.map((redemption) => (
                <RedemptionCard
                  key={redemption.id}
                  redemption={redemption}
                  onCopyCode={copyCode}
                  isCopied={copiedCode === redemption.code}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface RedemptionCardProps {
  redemption: RedemptionResponse
  onCopyCode: (code: string) => void
  isCopied: boolean
  formatDate: (date: string) => string
}

function RedemptionCard({ redemption, onCopyCode, isCopied, formatDate }: RedemptionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg line-clamp-1">{redemption.reward.title}</CardTitle>
          </div>
          <Badge className={getRewardTypeColor(redemption.reward.type)}>
            {getRewardTypeLabel(redemption.reward.type)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Redemption Code */}
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Redemption Code</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold">{redemption.code}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyCode(redemption.code)}
              className="h-8 w-8 p-0"
            >
              <Copy className={`h-4 w-4 ${isCopied ? 'text-green-600' : ''}`} />
            </Button>
          </div>
          {isCopied && (
            <p className="text-xs text-green-600 mt-1">Copied!</p>
          )}
        </div>

        {/* Details */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Points spent</span>
          <span className="font-medium">{redemption.pointsSpent}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Redeemed on</span>
          <span className="font-medium">{formatDate(redemption.redeemedAt)}</span>
        </div>
        {redemption.reward.partnerName && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Partner</span>
            <span className="font-medium">{redemption.reward.partnerName}</span>
          </div>
        )}

        {/* View Reward Link */}
        <Link to="/rewards/$rewardId" params={{ rewardId: String(redemption.reward.id) }}>
          <Button variant="outline" size="sm" className="w-full">
            View Reward Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
