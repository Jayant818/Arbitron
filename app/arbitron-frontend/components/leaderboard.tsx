import { GlassCard } from "@/components/ui/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"

interface LeaderboardProps {
  participants: Array<{
    rank: number
    username: string
    pnl: number
    pnlPercent: number
    avatar: string
    isUser: boolean
  }>
}

export function Leaderboard({ participants }: LeaderboardProps) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-electric-teal"
      case 2:
        return "text-vibrant-purple"
      case 3:
        return "text-hot-pink"
      default:
        return "text-muted-foreground"
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className="w-4 h-4" />
    }
    return <span className="text-sm font-display font-bold">#{rank}</span>
  }

  return (
    <GlassCard>
      <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-electric-teal" />
        Leaderboard
      </h3>
      <div className="space-y-3">
        {participants.map((participant) => (
          <div
            key={participant.rank}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              participant.isUser ? "bg-vibrant-purple/10 border border-vibrant-purple/30" : "hover:bg-background/30"
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 ${getRankColor(participant.rank)}`}>
              {getRankIcon(participant.rank)}
            </div>

            <Avatar className="w-8 h-8">
              <AvatarImage src={participant.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-electric-teal/20 text-electric-teal text-xs">
                {participant.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm truncate">{participant.username}</span>
                {participant.isUser && (
                  <Badge variant="outline" className="text-vibrant-purple border-vibrant-purple">
                    YOU
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right">
              <div
                className={`font-display font-bold text-sm ${
                  participant.pnl >= 0 ? "text-electric-teal" : "text-hot-pink"
                }`}
              >
                {participant.pnl >= 0 ? "+" : ""}${participant.pnl.toFixed(2)}
              </div>
              <div
                className={`text-xs font-mono flex items-center gap-1 ${
                  participant.pnlPercent >= 0 ? "text-electric-teal" : "text-hot-pink"
                }`}
              >
                {participant.pnlPercent >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {participant.pnlPercent >= 0 ? "+" : ""}
                {participant.pnlPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
