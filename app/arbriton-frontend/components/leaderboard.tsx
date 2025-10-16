"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Player {
  id: string
  name: string
  avatar: string
  pnl: number
  rank: number
  previousRank: number
}

export function Leaderboard({ players }: { players: Player[] }) {
  const getRankChange = (current: number, previous: number) => {
    if (current < previous) return "up"
    if (current > previous) return "down"
    return "same"
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Live Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {players.map((player, i) => {
            const rankChange = getRankChange(player.rank, player.previousRank)
            return (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Rank */}
                <div className="flex items-center gap-2 w-12">
                  <span className={`text-lg font-bold ${player.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                    #{player.rank}
                  </span>
                  {rankChange === "up" && <TrendingUp className="h-3 w-3 text-success" />}
                  {rankChange === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                  {rankChange === "same" && <Minus className="h-3 w-3 text-muted-foreground" />}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{player.avatar}</AvatarFallback>
                </Avatar>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{player.name}</div>
                </div>

                {/* P&L */}
                <Badge
                  variant="outline"
                  className={`font-mono ${
                    player.pnl >= 0
                      ? "border-success/50 bg-success/10 text-success"
                      : "border-destructive/50 bg-destructive/10 text-destructive"
                  }`}
                >
                  {player.pnl >= 0 ? "+" : ""}
                  {player.pnl.toFixed(1)}%
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}