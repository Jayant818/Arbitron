"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { NeonButton } from "@/components/ui/neon-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Trophy, Zap, ArrowLeft, Wallet, Target, TrendingUp, Shield, Star } from "lucide-react"

// Mock contest data
const mockContestData = {
  "001": {
    id: "001",
    title: "Lightning Round Alpha",
    type: "lightning",
    entryFee: 100,
    prizePool: 2500,
    currentPlayers: 24,
    maxPlayers: 25,
    timeRemaining: "2m 34s",
    status: "waiting",
    difficulty: "beginner",
    description: "Fast-paced trading contest with 5-minute rounds. Perfect for beginners to test their skills.",
    rules: [
      "Contest duration: 5 minutes",
      "Starting balance: 10,000 USDC virtual",
      "Top 3 traders win prizes",
      "No leverage restrictions",
    ],
    prizeDistribution: [
      { place: "1st", percentage: 50, amount: 1250 },
      { place: "2nd", percentage: 30, amount: 750 },
      { place: "3rd", percentage: 20, amount: 500 },
    ],
  },
}

const mockParticipants = [
  { id: "1", username: "CryptoNinja", avatar: "", rank: 1, winRate: 78, totalWins: 45 },
  { id: "2", username: "DiamondHands", avatar: "", rank: 2, winRate: 72, totalWins: 38 },
  { id: "3", username: "MoonTrader", avatar: "", rank: 3, winRate: 69, totalWins: 34 },
  { id: "4", username: "BullRun2024", avatar: "", rank: 4, winRate: 65, totalWins: 29 },
  { id: "5", username: "SolanaKing", avatar: "", rank: 5, winRate: 61, totalWins: 25 },
]

export default function ContestLobbyPage() {
  const params = useParams()
  const router = useRouter()
  const contestId = params.id as string
  const [timeLeft, setTimeLeft] = useState(154) // 2m 34s in seconds
  const [isJoined, setIsJoined] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const contest = mockContestData[contestId as keyof typeof mockContestData]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs.toString().padStart(2, "0")}s`
  }

  const handleJoinContest = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsJoined(true)
    setIsLoading(false)
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-hot-pink mb-4">Contest Not Found</h1>
          <NeonButton onClick={() => router.push("/")}>Return Home</NeonButton>
        </div>
      </div>
    )
  }

  const progressPercentage = (contest.currentPlayers / contest.maxPlayers) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NeonButton variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="w-4 h-4" />
              Back to Arena
            </NeonButton>
            <h1 className="text-xl font-display font-bold neon-text-teal tracking-wider">CONTEST LOBBY</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-vibrant-purple border-vibrant-purple font-mono">
              {contest.status.toUpperCase()}
            </Badge>
            <NeonButton variant="outline" size="sm">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </NeonButton>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Contest Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contest Header */}
            <GlassCard>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-vibrant-purple font-mono mb-2">
                    <Zap className="w-4 h-4" />
                    <span>CONTEST #{contest.id}</span>
                  </div>
                  <h1 className="text-3xl font-display font-bold mb-2">{contest.title}</h1>
                  <p className="text-muted-foreground font-mono">{contest.description}</p>
                </div>
                <Badge
                  className={`
                    ${contest.difficulty === "beginner" ? "bg-electric-teal/20 text-electric-teal" : ""}
                    ${contest.difficulty === "intermediate" ? "bg-vibrant-purple/20 text-vibrant-purple" : ""}
                    ${contest.difficulty === "expert" ? "bg-hot-pink/20 text-hot-pink" : ""}
                  `}
                >
                  {contest.difficulty.toUpperCase()}
                </Badge>
              </div>

              {/* Contest Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-electric-teal mb-1">{contest.entryFee}</div>
                  <div className="text-sm text-muted-foreground font-mono">Entry Fee (USDC)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-electric-teal mb-1">
                    {contest.prizePool.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">Prize Pool (USDC)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-vibrant-purple mb-1">
                    {contest.currentPlayers}/{contest.maxPlayers}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-hot-pink mb-1">{formatTime(timeLeft)}</div>
                  <div className="text-sm text-muted-foreground font-mono">Time Left</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm font-mono mb-2">
                  <span className="text-muted-foreground">Contest Filling</span>
                  <span className="text-electric-teal">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* Join Button */}
              {!isJoined ? (
                <NeonButton
                  size="lg"
                  className="w-full"
                  onClick={handleJoinContest}
                  disabled={isLoading || contest.currentPlayers >= contest.maxPlayers}
                >
                  {isLoading
                    ? "Joining Contest..."
                    : contest.currentPlayers >= contest.maxPlayers
                      ? "Contest Full"
                      : `Join for ${contest.entryFee} USDC`}
                </NeonButton>
              ) : (
                <div className="text-center">
                  <Badge variant="outline" className="text-electric-teal border-electric-teal mb-4">
                    ✓ JOINED
                  </Badge>
                  <NeonButton variant="secondary" size="lg" className="w-full">
                    <Target className="w-4 h-4" />
                    Prepare for Battle
                  </NeonButton>
                </div>
              )}
            </GlassCard>

            {/* Contest Rules */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-vibrant-purple" />
                Contest Rules
              </h3>
              <ul className="space-y-2 font-mono text-sm">
                {contest.rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-electric-teal mt-1">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            {/* Prize Distribution */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-electric-teal" />
                Prize Distribution
              </h3>
              <div className="space-y-3">
                {contest.prizeDistribution.map((prize, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm
                        ${index === 0 ? "bg-electric-teal text-quantum-void" : ""}
                        ${index === 1 ? "bg-vibrant-purple text-ghost-white" : ""}
                        ${index === 2 ? "bg-hot-pink text-ghost-white" : ""}
                      `}
                      >
                        {index + 1}
                      </div>
                      <span className="font-mono">{prize.place} Place</span>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold text-electric-teal">{prize.amount} USDC</div>
                      <div className="text-sm text-muted-foreground font-mono">{prize.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-vibrant-purple" />
                Participants ({contest.currentPlayers})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockParticipants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/30 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-electric-teal/20 text-electric-teal text-xs">
                        {participant.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">{participant.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {participant.winRate}% win rate • {participant.totalWins} wins
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-electric-teal" />
                      <span className="text-xs font-mono">{participant.rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Live Stats */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-electric-teal" />
                Live Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-muted-foreground">Average Entry</span>
                  <span className="font-display font-bold text-electric-teal">156 USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-muted-foreground">Top Trader</span>
                  <span className="font-mono text-sm">CryptoNinja</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-muted-foreground">Avg Win Rate</span>
                  <span className="font-display font-bold text-vibrant-purple">69%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-muted-foreground">Contest Type</span>
                  <Badge variant="outline" className="text-hot-pink border-hot-pink">
                    LIGHTNING
                  </Badge>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
