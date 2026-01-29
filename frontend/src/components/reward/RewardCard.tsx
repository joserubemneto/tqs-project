import { Link } from '@tanstack/react-router'
import { Award, Building2, Calendar, Package } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  getAvailabilityText,
  getRewardTypeColor,
  getRewardTypeLabel,
  isRewardAvailable,
  type RewardResponse,
} from '@/lib/reward'

interface RewardCardProps {
  reward: RewardResponse
  showActions?: boolean
  onEdit?: (reward: RewardResponse) => void
  onDelete?: (reward: RewardResponse) => void
}

export function RewardCard({ reward, showActions, onEdit, onDelete }: RewardCardProps) {
  const available = isRewardAvailable(reward)
  const availabilityText = getAvailabilityText(reward)

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const cardContent = (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{reward.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getRewardTypeColor(reward.type)}>
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
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <span className="text-xl">{reward.pointsCost}</span>
            <span className="text-sm">points</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{availabilityText}</span>
          </div>
        </div>

        {reward.partner && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
            <Building2 className="h-4 w-4" />
            <span>Provided by {reward.partner.name}</span>
          </div>
        )}

        {(reward.availableFrom || reward.availableUntil) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {reward.availableFrom && `From ${formatDate(reward.availableFrom)}`}
              {reward.availableFrom && reward.availableUntil && ' - '}
              {reward.availableUntil && `Until ${formatDate(reward.availableUntil)}`}
            </span>
          </div>
        )}

        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-2 border-t">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit(reward)
                }}
                className="text-sm text-primary hover:underline"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(reward)
                }}
                className="text-sm text-destructive hover:underline"
              >
                Deactivate
              </button>
            )}
          </div>
        )}
      </CardContent>
    </>
  )

  // If showing actions (admin view), don't make the card clickable
  if (showActions) {
    return (
      <Card className={`relative ${!available ? 'opacity-60' : ''}`}>
        {cardContent}
      </Card>
    )
  }

  // Public view - make the card clickable
  return (
    <Link to="/rewards/$rewardId" params={{ rewardId: reward.id.toString() }} className="block">
      <Card className={`relative transition-shadow hover:shadow-md ${!available ? 'opacity-60' : ''}`}>
        {cardContent}
      </Card>
    </Link>
  )
}
