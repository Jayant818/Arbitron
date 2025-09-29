"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ParticleExplosion } from "@/components/particle-explosion"
import { NFTRewardCard } from "@/components/nft-reward-card"
import { Trophy, Star, TrendingUp, TrendingDown, Target, Zap, Home, RotateCcw } from "lucide-react"

// Mock results data
const mockResults = {
  contestId: "001",
  contestTitle: "Lightning Round Alpha",
  userRank: 3,
  totalParticipants: 25,
  userPnL: 634.21,
  userPnLPercent: 6.34,
  userReward: 500,
  startingBalance: 10000,
  finalBalance: 10634.21,
  totalTrades: 12,
  winRate: 75,
  bestTrade: 156.78,
  worstTrade: -43.21,
  leaderboard: [
    { rank: 1, username: "CryptoNinja", pnl: 1247.83, pnlPercent: 12.48, reward: 1250, avatar: "" },
    { rank: 2, username: "DiamondHands", pnl: 892.45, pnlPercent: 8.92, reward: 750, avatar: "" },
    { rank: 3, username: "You", pnl: 634.21, pnlPercent: 6.34, reward: 500, avatar: "", isUser: true },
    { rank: 4, username: "MoonTrader", pnl: 423.67, pnlPercent: 4.24, reward: 0, avatar: "" },
    { rank: 5, username: "BullRun2024", pnl: 298.34, pnlPercent: 2.98, reward: 0, avatar: "" },
  ],
}

export default function ContestResultsPage() {
  const params = useParams()
  const router = useRouter()
  const contestId = params.id as string
  const [showParticles, setShowParticles] = useState(true)
  const [showNFTFlip, setShowNFTFlip] = useState(false)

  useEffect(() => {
    // Show particle explosion on load
    const timer = setTimeout(() => {
      setShowParticles(false)
      setShowNFTFlip(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return "st"
    if (rank === 2) return "nd"
    if (rank === 3) return "rd"
    return "th"
  }

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

  const isWinner = mockResults.userRank <= 3

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Particle Explosion */}
      {showParticles && <ParticleExplosion />}

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-bold neon-text-teal tracking-wider">CONTEST RESULTS</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-hot-pink border-hot-pink font-mono">
              FINISHED
            </Badge>
            <NeonButton variant="outline" size="sm" onClick={() => router.push("/")}>
              <Home className="w-4 h-4" />
              Return Home
            </NeonButton>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Result Card */}
            <GlassCard className="text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-electric-teal/5 via-transparent to-vibrant-purple/5" />
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="text-sm text-muted-foreground font-mono mb-2">CONTEST #{contestId}</div>
                  <h2 className="text-2xl font-display font-bold mb-4">{mockResults.contestTitle}</h2>

                  {/* Rank Display */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className={`text-6xl font-display font-bold ${getRankColor(mockResults.userRank)}`}>
                      #{mockResults.userRank}
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-display font-bold">
                        {mockResults.userRank}
                        {getRankSuffix(mockResults.userRank)} Place
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        out of {mockResults.totalParticipants} traders
                      </div>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div
                        className={`text-3xl font-display font-bold mb-1 ${
                          mockResults.userPnL >= 0 ? "text-electric-teal" : "text-hot-pink"
                        }`}
                      >
                        {mockResults.userPnL >= 0 ? "+" : ""}${mockResults.userPnL.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">Total P&L</div>
                    </div>
                    <div>
                      <div
                        className={`text-3xl font-display font-bold mb-1 ${
                          mockResults.userPnLPercent >= 0 ? "text-electric-teal" : "text-hot-pink"
                        }`}
                      >
                        {mockResults.userPnLPercent >= 0 ? "+" : ""}
                        {mockResults.userPnLPercent.toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">Return</div>
                    </div>
                  </div>

                  {/* Reward */}
                  {isWinner && (
                    <div className="p-4 rounded-lg bg-electric-teal/10 border border-electric-teal/30 mb-6">
                      <div className="text-2xl font-display font-bold text-electric-teal mb-1">
                        ${mockResults.userReward} USDC
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">Prize Reward</div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <NeonButton size="lg">
                    <Trophy className="w-4 h-4" />
                    Claim Rewards
                  </NeonButton>
                  <NeonButton variant="outline" size="lg" onClick={() => router.push("/")}>
                    <RotateCcw className="w-4 h-4" />
                    Play Again
                  </NeonButton>
                </div>
              </div>
            </GlassCard>

            {/* Detailed Stats */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-vibrant-purple" />
                Performance Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-electric-teal mb-1">
                    ${mockResults.finalBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">Final Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-foreground mb-1">{mockResults.totalTrades}</div>
                  <div className="text-sm text-muted-foreground font-mono">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-vibrant-purple mb-1">{mockResults.winRate}%</div>
                  <div className="text-sm text-muted-foreground font-mono">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-electric-teal mb-1">
                    ${mockResults.bestTrade.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">Best Trade</div>
                </div>
              </div>
            </GlassCard>

            {/* Final Leaderboard */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-electric-teal" />
                Final Leaderboard
              </h3>
              <div className="space-y-3">
                {mockResults.leaderboard.map((participant) => (
                  <div
                    key={participant.rank}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                      participant.isUser
                        ? "bg-vibrant-purple/10 border border-vibrant-purple/30 glow-purple"
                        : "bg-background/30"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 ${getRankColor(participant.rank)}`}>
                      {participant.rank <= 3 ? (
                        <Trophy className="w-6 h-6" />
                      ) : (
                        <span className="text-lg font-display font-bold">#{participant.rank}</span>
                      )}
                    </div>

                    <Avatar className="w-10 h-10">
                      <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-electric-teal/20 text-electric-teal">
                        {participant.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{participant.username}</span>
                        {participant.isUser && (
                          <Badge variant="outline" className="text-vibrant-purple border-vibrant-purple">
                            YOU
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-display font-bold ${
                          participant.pnl >= 0 ? "text-electric-teal" : "text-hot-pink"
                        }`}
                      >
                        {participant.pnl >= 0 ? "+" : ""}${participant.pnl.toFixed(2)}
                      </div>
                      <div
                        className={`text-sm font-mono flex items-center gap-1 justify-end ${
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

                    {participant.reward > 0 && (
                      <div className="text-right">
                        <div className="text-lg font-display font-bold text-electric-teal">${participant.reward}</div>
                        <div className="text-xs text-muted-foreground font-mono">REWARD</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* NFT Reward */}
            {isWinner && <NFTRewardCard rank={mockResults.userRank} showFlip={showNFTFlip} />}

            {/* Contest Summary */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-electric-teal" />
                Contest Summary
              </h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contest Type:</span>
                  <Badge variant="outline" className="text-hot-pink border-hot-pink">
                    LIGHTNING
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>5 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Prize Pool:</span>
                  <span className="text-electric-teal">2,500 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry Fee:</span>
                  <span>100 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants:</span>
                  <span>{mockResults.totalParticipants}</span>
                </div>
              </div>
            </GlassCard>

            {/* Achievement Badges */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-vibrant-purple" />
                Achievements
              </h3>
              <div className="space-y-2">
                {isWinner && (
                  <Badge className="w-full justify-center bg-electric-teal/20 text-electric-teal border-electric-teal">
                    🏆 Top 3 Finisher
                  </Badge>
                )}
                {mockResults.winRate >= 70 && (
                  <Badge className="w-full justify-center bg-vibrant-purple/20 text-vibrant-purple border-vibrant-purple">
                    🎯 Sharp Shooter (70%+ Win Rate)
                  </Badge>
                )}
                {mockResults.totalTrades >= 10 && (
                  <Badge className="w-full justify-center bg-hot-pink/20 text-hot-pink border-hot-pink">
                    ⚡ Speed Trader (10+ Trades)
                  </Badge>
                )}
              </div>
            </GlassCard>

            {/* Next Contest */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4">Next Contest</h3>
              <div className="text-center">
                <div className="text-sm text-muted-foreground font-mono mb-2">Starting in</div>
                <div className="text-2xl font-display font-bold text-electric-teal mb-4">12:34</div>
                <NeonButton size="sm" className="w-full">
                  Join Next Round
                </NeonButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
