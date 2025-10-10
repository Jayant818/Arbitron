"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useState, useEffect } from "react"

interface Player {
  id: string
  name: string
  avatar: string
  pnl: number
  rank: number
  previousRank: number
}

const initialPlayers: Player[] = [
  { id: "1", name: "CryptoKing", avatar: "CK", pnl: 15.2, rank: 1, previousRank: 1 },
  { id: "2", name: "SolanaWhale", avatar: "SW", pnl: 12.8, rank: 2, previousRank: 3 },
  { id: "3", name: "DiamondHands", avatar: "DH", pnl: 11.5, rank: 3, previousRank: 2 },
  { id: "4", name: "MoonShot", avatar: "MS", pnl: 8.3, rank: 4, previousRank: 5 },
  { id: "5", name: "BullRun", avatar: "BR", pnl: 6.7, rank: 5, previousRank: 4 },
  { id: "6", name: "DeFiMaster", avatar: "DM", pnl: 4.2, rank: 6, previousRank: 6 },
]

export function Leaderboard() {
  const [players, setPlayers] = useState(initialPlayers)

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setPlayers((prev) =>
        prev
          .map((player) => ({
            ...player,
            pnl: player.pnl + (Math.random() - 0.5) * 2,
            previousRank: player.rank,
          }))
          .sort((a, b) => b.pnl - a.pnl)
          .map((player, index) => ({
            ...player,
            rank: index + 1,
          })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

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
