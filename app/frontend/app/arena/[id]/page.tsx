"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TradingChart } from "@/components/trading-chart"
import { SwapInterface } from "@/components/swap-interface"
import { Leaderboard } from "@/components/leaderboard"
import { PortfolioStats } from "@/components/portfolio-stats"
import { TrendingDown, Target, Zap, Activity } from "lucide-react"

// Mock trading data
const mockTokens = [
  { symbol: "SOL", name: "Solana", price: 98.45, change: 2.34, logo: "/solana-blockchain.png" },
  { symbol: "USDC", name: "USD Coin", price: 1.0, change: 0.01, logo: "/usdc-coins.png" },
  { symbol: "RAY", name: "Raydium", price: 1.87, change: -1.23, logo: "/raydium.jpg" },
  { symbol: "ORCA", name: "Orca", price: 3.21, change: 4.56, logo: "/orca.jpg" },
]

const mockLeaderboard = [
  { rank: 1, username: "CryptoNinja", pnl: 1247.83, pnlPercent: 12.48, avatar: "", isUser: false },
  { rank: 2, username: "DiamondHands", pnl: 892.45, pnlPercent: 8.92, avatar: "", isUser: false },
  { rank: 3, username: "You", pnl: 634.21, pnlPercent: 6.34, avatar: "", isUser: true },
  { rank: 4, username: "MoonTrader", pnl: 423.67, pnlPercent: 4.24, avatar: "", isUser: false },
  { rank: 5, username: "BullRun2024", pnl: 298.34, pnlPercent: 2.98, avatar: "", isUser: false },
]

export default function TradingArenaPage() {
  const params = useParams()
  const contestId = params.id as string
  const [timeLeft, setTimeLeft] = useState(287) // 4m 47s
  const [userBalance, setUserBalance] = useState(10634.21)
  const [userPnL, setUserPnL] = useState(634.21)
  const [selectedToken, setSelectedToken] = useState(mockTokens[0])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const pnlPercent = (userPnL / 10000) * 100
  const progressPercent = ((300 - timeLeft) / 300) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-display font-bold neon-text-teal tracking-wider">TRADING ARENA</h1>
              <Badge variant="outline" className="text-hot-pink border-hot-pink font-mono animate-pulse">
                LIVE
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              {/* Contest Timer */}
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-hot-pink">{formatTime(timeLeft)}</div>
                <div className="text-xs text-muted-foreground font-mono">TIME LEFT</div>
              </div>

              {/* User Stats */}
              <div className="text-center">
                <div className="text-lg font-display font-bold text-electric-teal">${userBalance.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground font-mono">BALANCE</div>
              </div>

              <div className="text-center">
                <div
                  className={`text-lg font-display font-bold ${userPnL >= 0 ? "text-electric-teal" : "text-hot-pink"}`}
                >
                  {userPnL >= 0 ? "+" : ""}${userPnL.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground font-mono">P&L</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progressPercent} className="h-1" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Trading Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Portfolio Stats */}
            <PortfolioStats balance={userBalance} pnl={userPnL} pnlPercent={pnlPercent} rank={3} totalTrades={12} />

            {/* Trading Chart */}
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-display font-bold">Price Chart</h3>
                    <div className="flex items-center gap-2">
                      {mockTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => setSelectedToken(token)}
                          className={`px-3 py-1 rounded-md text-sm font-mono transition-colors ${
                            selectedToken.symbol === token.symbol
                              ? "bg-electric-teal text-quantum-void"
                              : "bg-background/50 hover:bg-background/80"
                          }`}
                        >
                          {token.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-display font-bold">${selectedToken.price}</span>
                    <span
                      className={`text-sm font-mono ${selectedToken.change >= 0 ? "text-electric-teal" : "text-hot-pink"}`}
                    >
                      {selectedToken.change >= 0 ? "+" : ""}
                      {selectedToken.change}%
                    </span>
                  </div>
                </div>
              </div>
              <TradingChart token={selectedToken} />
            </GlassCard>

            {/* Swap Interface */}
            <SwapInterface tokens={mockTokens} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Leaderboard participants={mockLeaderboard} />

            {/* Contest Info */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-vibrant-purple" />
                Contest Info
              </h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contest ID:</span>
                  <span className="text-electric-teal">#{contestId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="text-hot-pink border-hot-pink">
                    LIGHTNING
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prize Pool:</span>
                  <span className="text-electric-teal">2,500 USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Players:</span>
                  <span>25/25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Rank:</span>
                  <span className="text-vibrant-purple">#3</span>
                </div>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-electric-teal" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <NeonButton size="sm" className="w-full">
                  <Activity className="w-4 h-4" />
                  Market Buy SOL
                </NeonButton>
                <NeonButton variant="destructive" size="sm" className="w-full">
                  <TrendingDown className="w-4 h-4" />
                  Market Sell SOL
                </NeonButton>
                <NeonButton variant="outline" size="sm" className="w-full">
                  Close All Positions
                </NeonButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
