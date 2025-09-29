"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Trophy,
  Users,
  Clock,
  Zap,
  Target,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Shield,
  Star,
} from "lucide-react"

// Mock contest data
const mockContest = {
  id: "001",
  title: "Lightning Round Alpha",
  type: "lightning",
  description:
    "Fast-paced 5-minute trading contest with high volatility tokens. Perfect for quick profits and adrenaline rush!",
  entryFee: 100,
  prizePool: 2500,
  currentPlayers: 18,
  maxPlayers: 25,
  timeUntilStart: "2:34",
  difficulty: "intermediate",
  duration: "5 minutes",
  allowedTokens: ["SOL", "RAY", "ORCA", "MNGO"],
  rules: [
    "Starting balance: 10,000 USDC",
    "Maximum 3 positions at once",
    "No leverage allowed",
    "Slippage tolerance: 2%",
  ],
  prizeDistribution: [
    { place: 1, percentage: 60, amount: 1500 },
    { place: 2, percentage: 25, amount: 625 },
    { place: 3, percentage: 15, amount: 375 },
  ],
  recentWinners: [
    { username: "CryptoNinja", winnings: 1250, avatar: "" },
    { username: "DiamondHands", winnings: 750, avatar: "" },
    { username: "MoonTrader", winnings: 500, avatar: "" },
  ],
}

export default function JoinContestPage() {
  const params = useParams()
  const router = useRouter()
  const contestId = params.id as string

  const [isJoining, setIsJoining] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [walletBalance] = useState(1250) // Mock wallet balance
  const [showSuccess, setShowSuccess] = useState(false)

  const handleJoinContest = async () => {
    if (!agreedToTerms) return

    setIsJoining(true)

    // Simulate joining process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setShowSuccess(true)

    // Redirect to contest lobby after success
    setTimeout(() => {
      router.push(`/contest/${contestId}`)
    }, 2000)
  }

  const canAfford = walletBalance >= mockContest.entryFee
  const hasSpace = mockContest.currentPlayers < mockContest.maxPlayers

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassCard className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-electric-teal mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-electric-teal mb-2">Successfully Joined!</h2>
            <p className="text-muted-foreground font-mono">Welcome to {mockContest.title}</p>
          </div>

          <div className="space-y-2 text-sm font-mono mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contest starts in:</span>
              <span className="text-vibrant-purple">{mockContest.timeUntilStart}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your position:</span>
              <span className="text-electric-teal">#{mockContest.currentPlayers + 1}</span>
            </div>
          </div>

          <div className="animate-pulse">
            <p className="text-xs text-muted-foreground">Redirecting to contest lobby...</p>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NeonButton variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </NeonButton>
            <h1 className="text-xl font-display font-bold neon-text-teal tracking-wider">JOIN CONTEST</h1>
          </div>
          <Badge variant="outline" className="text-vibrant-purple border-vibrant-purple font-mono">
            CONTEST #{contestId}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contest Overview */}
            <GlassCard>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-vibrant-purple font-mono mb-2">
                    <Zap className="w-4 h-4" />
                    <span>LIGHTNING ROUND</span>
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">{mockContest.title}</h2>
                  <p className="text-muted-foreground">{mockContest.description}</p>
                </div>
                <Badge variant="secondary" className="bg-vibrant-purple/20 text-vibrant-purple">
                  {mockContest.difficulty.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-electric-teal mb-1">${mockContest.entryFee}</div>
                  <div className="text-xs text-muted-foreground font-mono">Entry Fee</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-vibrant-purple mb-1">
                    ${mockContest.prizePool.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">Prize Pool</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-foreground mb-1">
                    {mockContest.currentPlayers}/{mockContest.maxPlayers}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-hot-pink mb-1">{mockContest.duration}</div>
                  <div className="text-xs text-muted-foreground font-mono">Duration</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-electric-teal/10 border border-electric-teal/30">
                <Clock className="w-5 h-5 text-electric-teal" />
                <div className="text-center">
                  <div className="text-sm text-muted-foreground font-mono">Contest starts in</div>
                  <div className="text-xl font-display font-bold text-electric-teal">{mockContest.timeUntilStart}</div>
                </div>
              </div>
            </GlassCard>

            {/* Contest Rules */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-vibrant-purple" />
                Contest Rules
              </h3>
              <div className="space-y-3">
                {mockContest.rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-electric-teal mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-mono">{rule}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="font-display font-bold mb-3">Allowed Trading Tokens</h4>
                <div className="flex flex-wrap gap-2">
                  {mockContest.allowedTokens.map((token) => (
                    <Badge key={token} variant="outline" className="text-electric-teal border-electric-teal">
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Wallet Check */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-hot-pink" />
                Wallet Status
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${canAfford ? "bg-electric-teal" : "bg-hot-pink"}`} />
                    <span className="font-mono">USDC Balance</span>
                  </div>
                  <span className={`font-display font-bold ${canAfford ? "text-electric-teal" : "text-hot-pink"}`}>
                    ${walletBalance.toLocaleString()}
                  </span>
                </div>

                {!canAfford && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-hot-pink/10 border border-hot-pink/30">
                    <AlertTriangle className="w-5 h-5 text-hot-pink mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-mono font-bold text-hot-pink mb-1">Insufficient Balance</div>
                      <div className="text-sm text-muted-foreground">
                        You need ${mockContest.entryFee - walletBalance} more USDC to join this contest.
                      </div>
                    </div>
                  </div>
                )}

                {!hasSpace && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-hot-pink/10 border border-hot-pink/30">
                    <Users className="w-5 h-5 text-hot-pink mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-mono font-bold text-hot-pink mb-1">Contest Full</div>
                      <div className="text-sm text-muted-foreground">This contest has reached maximum capacity.</div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Terms Agreement */}
            {canAfford && hasSpace && (
              <GlassCard>
                <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-electric-teal" />
                  Terms & Conditions
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-mono leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the contest terms and conditions
                      </label>
                      <p className="text-xs text-muted-foreground">
                        By joining, you acknowledge the risks of trading and agree to our platform rules.
                      </p>
                    </div>
                  </div>

                  <NeonButton
                    size="lg"
                    className="w-full"
                    onClick={handleJoinContest}
                    disabled={!agreedToTerms || isJoining}
                  >
                    {isJoining ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        Joining Contest...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        Join Contest (${mockContest.entryFee} USDC)
                      </>
                    )}
                  </NeonButton>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prize Distribution */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-electric-teal" />
                Prize Distribution
              </h3>
              <div className="space-y-3">
                {mockContest.prizeDistribution.map((prize) => (
                  <div key={prize.place} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          prize.place === 1
                            ? "bg-electric-teal/20 text-electric-teal"
                            : prize.place === 2
                              ? "bg-vibrant-purple/20 text-vibrant-purple"
                              : "bg-hot-pink/20 text-hot-pink"
                        }`}
                      >
                        {prize.place}
                      </div>
                      <span className="text-sm font-mono">
                        {prize.place === 1 ? "1st" : prize.place === 2 ? "2nd" : "3rd"} Place
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-display font-bold text-electric-teal">${prize.amount}</div>
                      <div className="text-xs text-muted-foreground">{prize.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Recent Winners */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-vibrant-purple" />
                Recent Winners
              </h3>
              <div className="space-y-3">
                {mockContest.recentWinners.map((winner, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={winner.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-electric-teal/20 text-electric-teal text-xs">
                        {winner.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-mono font-bold">{winner.username}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-display font-bold text-electric-teal">+${winner.winnings}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Contest Stats */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average ROI:</span>
                  <span className="text-electric-teal">+12.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="text-vibrant-purple">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Trades:</span>
                  <span>8.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best Performer:</span>
                  <span className="text-hot-pink">+47.8%</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
