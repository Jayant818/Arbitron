
"use client"

import { useState, useEffect, useMemo, useContext } from "react"
import { useParams, useRouter } from "next/navigation"
import { NeonButton } from "@/components/ui/neon-button"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Trophy, Zap, Target, TrendingUp, Star, Clock, Play } from "lucide-react"
import axios from "axios"
import type { Contest } from "@/app/page"
import { RpcContext } from "@/context/RpcContext"
import { ChainContext } from "@/context/ChainContext"
import { useWalletAccountTransactionSendingSigner } from "@solana/react"
import { 
  address, 
  appendTransactionMessageInstructions, 
  compileTransaction, 
  createTransactionMessage, 
  getBase58Decoder, 
  pipe, 
  setTransactionMessageFeePayerSigner, 
  setTransactionMessageLifetimeUsingBlockhash, 
  signAndSendTransactionMessageWithSigners
} from "@solana/kit"
import { 
  getStartContestInstruction,
  StartContestInput,
} from "../../../../../dist/js-client/index"

const mockParticipants = [
  { id: "1", username: "CryptoNinja", avatar: "", rank: 1, winRate: 78, totalWins: 45 },
  { id: "2", username: "DiamondHands", avatar: "", rank: 2, winRate: 72, totalWins: 38 },
  { id: "3", username: "MoonTrader", avatar: "", rank: 3, winRate: 69, totalWins: 34 },
  { id: "4", username: "BullRun2024", avatar: "", rank: 4, winRate: 65, totalWins: 29 },
  { id: "5", username: "SolanaKing", avatar: "", rank: 5, winRate: 61, totalWins: 25 },
]

export async function fetchContestDetailsById(id: string) {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/${id}`)
    return res.data
  } catch (error) {
    console.error("Error fetching contest details:", error)
    throw error
  }
}

export default function ContestLobbyPage({selectedWalletAccount}:{selectedWalletAccount:SelectedWalletAccountState}) {
  const params = useParams()
  const router = useRouter()
  const contestId = params.id as string
  const { rpc } = useContext(RpcContext)
  const { chain } = useContext(ChainContext)
  
  const [isStarting, setIsStarting] = useState(false)
  const [contestData, setContestData] = useState<Contest | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))

  const signer = useWalletAccountTransactionSendingSigner(
    selectedWalletAccount.account,
    chain
  )

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchContestDetailsById(contestId)
        setContestData(data)
      } catch (error) {
        console.error("Error fetching contest:", error)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
    
    // Refresh contest data every 10 seconds
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [contestId])

  // Transform API contest data to UI format
  const contest = useMemo(() => {
    if (!contestData) return null;

    const entryFee = contestData.entryFee / Math.pow(10, contestData.decimals);
    const prizePool = entryFee * contestData.maxPlayers;

    // Derive type from duration
    let type: "lightning" | "endurance" | "precision";
    if (contestData.duration <= 600) {
      type = "lightning";
    } else if (contestData.duration <= 3600) {
      type = "precision";
    } else {
      type = "endurance";
    }

    // Convert status
    let status: "waiting" | "active" | "ending"
    if (contestData.status === 0) {
      status = "waiting";
    } else if (contestData.status === 1) {
      status = "active";
    } else {
      status = "ending";
    }

    // Calculate time remaining using currentTime for real-time updates
    const now = currentTime
    let timeLeft: number;
    if (status === "waiting") {
      timeLeft = Math.max(0, contestData.waitingTime - now);
    } else if (status === "active") {
      const contestEndTime = contestData.waitingTime + contestData.duration;
      timeLeft = Math.max(0, contestEndTime - now);
    } else {
      timeLeft = 0;
    }

    // Check if waiting time has ended and contest should start
    const canStart = status === "waiting" && timeLeft === 0;

    // Generate description based on type and duration
    const durationMinutes = Math.floor(contestData.duration / 60);
    const description =
      type === "lightning"
        ? `Fast-paced trading contest with ${durationMinutes}-minute rounds. Perfect for quick profits!`
        : type === "precision"
          ? `Moderate-paced contest lasting ${durationMinutes} minutes. Test your precision trading skills.`
          : `Endurance contest lasting ${Math.floor(durationMinutes / 60)} hours. For experienced traders only.`;

    // Calculate prize distribution
    const prizeDistribution = [
      { place: "1st", percentage: 50, amount: Math.floor(prizePool * 0.5) },
      { place: "2nd", percentage: 30, amount: Math.floor(prizePool * 0.3) },
      { place: "3rd", percentage: 20, amount: Math.floor(prizePool * 0.2) },
    ];

    return {
      id: contestData.id,
      title: contestData.title,
      type,
      entryFee,
      prizePool,
      currentPlayers: contestData.currentPlayers,
      maxPlayers: contestData.maxPlayers,
      status,
      description,
      prizeDistribution,
      timeLeft,
      canStart,
    }
  }, [contestData, currentTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs.toString().padStart(2, "0")}s`
  }

  const handleStartContest = async () => {
    if (!contestData || !selectedWalletAccount) return

    setIsStarting(true)
    try {
      // Build the start contest instruction  
      const input: StartContestInput = {
        host: signer,
        contest: address(contestId),
      }

      const ix = getStartContestInstruction(input)

      // Get latest blockhash
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()

      // Build and compile the transaction
      const txMsg = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) => appendTransactionMessageInstructions([ix], tx)
      )

      const signatureBytes = await signAndSendTransactionMessageWithSigners(txMsg);

      const signature = getBase58Decoder().decode(signatureBytes);

      console.log("✅ Contest started successfully! Signature:", signature)
      alert("Contest started successfully!")

      // Redirect to arena after 1.5 seconds
      setTimeout(() => {
        router.push(`/arena/${contestId}`)
      }, 1500)
    } catch (error) {
      console.error("Error starting contest:", error)
      alert("Error starting contest: " + error)
    } finally {
      setIsStarting(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azure-teal mx-auto mb-4" />
          <p className="text-muted-foreground font-mono">Loading contest...</p>
        </div>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-maximum-red mb-4">Contest Not Found</h1>
          <NeonButton onClick={() => router.push("/")}>Return Home</NeonButton>
        </div>
      </div>
    )
  }

  const progressPercentage = (contest.currentPlayers / contest.maxPlayers) * 100

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lightning":
        return <Zap className="w-4 h-4" />
      case "endurance":
        return <Clock className="w-4 h-4" />
      case "precision":
        return <Trophy className="w-4 h-4" />
      default:
        return <Trophy className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold neon-text-teal tracking-wider">CONTEST LOBBY</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-deep-purple border-deep-purple font-mono">
              {contest.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Contest Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contest Header */}
            <GlassCard className="animate-fade-in">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-deep-purple font-mono mb-2">
                    {getTypeIcon(contest.type)}
                    <span>CONTEST #{contest.id}</span>
                  </div>
                  <h1 className="text-3xl font-display font-bold mb-2">{contest.title}</h1>
                  <p className="text-muted-foreground font-mono">{contest.description}</p>
                </div>
              </div>

              {/* Contest Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center animate-pulse-slow">
                  <div className="text-2xl font-display font-bold text-azure-teal mb-1">{contest.entryFee}</div>
                  <div className="text-sm text-muted-foreground font-mono">Entry Fee (USDC)</div>
                </div>
                <div className="text-center animate-pulse-slow">
                  <div className="text-2xl font-display font-bold text-azure-teal mb-1">
                    {contest.prizePool.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">Expected Prize Pool (USDC)</div>
                </div>
                <div className="text-center animate-pulse-slow">
                  <div className="text-2xl font-display font-bold text-deep-purple mb-1">
                    {contest.currentPlayers}/{contest.maxPlayers}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">Players</div>
                </div>
                <div className="text-center animate-pulse-slow">
                  <div className="text-2xl font-display font-bold text-maximum-red mb-1">{formatTime(contest.timeLeft)}</div>
                  <div className="text-sm text-muted-foreground font-mono">Time Left</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm font-mono mb-2">
                  <span className="text-muted-foreground">Contest Filling</span>
                  <span className="text-azure-teal">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* Contest Status and Action */}
              <div className="space-y-4">
                {/* Welcome Message - User has joined by being on this page */}
                <div className="text-center p-4 rounded-lg bg-azure-teal/10 border border-azure-teal/30">
                  <Badge variant="outline" className="text-azure-teal border-azure-teal mb-2">
                    ✓ YOU&apos;RE IN THE LOBBY
                  </Badge>
                  <p className="text-sm text-muted-foreground font-mono">
                    You have successfully joined this contest
                  </p>
                </div>

                {/* Show different buttons based on contest status */}
                {contest.status === "waiting" && contest.timeLeft > 0 && (
                  <div className="text-center p-6 rounded-lg bg-deep-purple/10 border border-deep-purple/30">
                    <Clock className="w-12 h-12 text-deep-purple mx-auto mb-3" />
                    <h3 className="text-xl font-display font-bold mb-2">Waiting for Contest to Start</h3>
                    <p className="text-sm text-muted-foreground font-mono mb-4">
                      The competition will begin in {formatTime(contest.timeLeft)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stay in the lobby. The arena will open once the timer reaches zero.
                    </p>
                  </div>
                )}

                {contest.canStart && (
                  <div className="text-center">
                    <NeonButton
                      size="lg"
                      className="w-full animate-glow"
                      onClick={handleStartContest}
                      disabled={isStarting}
                    >
                      {isStarting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Starting Competition...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Competition
                        </>
                      )}
                    </NeonButton>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      Click to start the trading competition
                    </p>
                  </div>
                )}

                {contest.status === "active" && (
                  <NeonButton
                    size="lg"
                    className="w-full animate-glow"
                    onClick={() => router.push(`/arena/${contestId}`)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Enter Arena
                  </NeonButton>
                )}

                {contest.status === "ending" && (
                  <div className="text-center p-6 rounded-lg bg-maximum-red/10 border border-maximum-red/30">
                    <Trophy className="w-12 h-12 text-maximum-red mx-auto mb-3" />
                    <h3 className="text-xl font-display font-bold mb-2">Contest Ended</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      This competition has concluded. Check the results page.
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Prize Distribution */}
            <GlassCard className="animate-fade-in">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-azure-teal" />
                Prize Distribution
              </h3>
              <div className="space-y-3">
                {contest.prizeDistribution.map((prize, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/30">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm
                        ${index === 0 ? "bg-azure-teal text-quantum-void" : ""}
                        ${index === 1 ? "bg-deep-purple text-ghost-white" : ""}
                        ${index === 2 ? "bg-maximum-red text-ghost-white" : ""}
                      `}
                      >
                        {index + 1}
                      </div>
                      <span className="font-mono">{prize.place} Place</span>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold text-azure-teal">{prize.amount} USDC</div>
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
            <GlassCard className="animate-slide-up">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-deep-purple" />
                Participants ({contest.currentPlayers})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-background/30 transition-colors animate-scale-hover"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-azure-teal/20 text-azure-teal text-xs">
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
                      <Star className="w-3 h-3 text-azure-teal" />
                      <span className="text-xs font-mono">{participant.rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Live Stats */}
            <GlassCard className="animate-slide-up">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-azure-teal" />
                Live Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center animate-pulse-slow">
                  <span className="text-sm font-mono text-muted-foreground">Average Entry</span>
                  <span className="font-display font-bold text-azure-teal">156 USDC</span>
                </div>
                <div className="flex justify-between items-center animate-pulse-slow">
                  <span className="text-sm font-mono text-muted-foreground">Top Trader</span>
                  <span className="font-mono text-sm">CryptoNinja</span>
                </div>
                <div className="flex justify-between items-center animate-pulse-slow">
                  <span className="text-sm font-mono text-muted-foreground">Avg Win Rate</span>
                  <span className="font-display font-bold text-deep-purple">69%</span>
                </div>
                <div className="flex justify-between items-center animate-pulse-slow">
                  <span className="text-sm font-mono text-muted-foreground">Contest Type</span>
                  <Badge variant="outline" className="text-maximum-red border-maximum-red">
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
