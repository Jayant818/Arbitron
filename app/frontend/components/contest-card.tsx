import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trophy, Zap } from "lucide-react"
import { useContext } from "react"
import { useRouter } from "next/navigation"
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext"
import { useToast } from "@/hooks/use-toast"

interface ContestCardProps {
  contest: {
    id: string
    title: string
    type: "lightning" | "endurance" | "precision"
    entryFee: number
    prizePool: number
    currentPlayers: number
    maxPlayers: number
    timeRemaining: string
    status: "waiting" | "active" | "ending"
    difficulty: "beginner" | "intermediate" | "expert"
    isHost?: boolean
  }
}

export function ContestCard({ contest }: ContestCardProps) {
  const router = useRouter()
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)
  const { toast } = useToast()

  const handleEnterContest = () => {
    if (!selectedWalletAccount) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to enter the contest.",
        variant: "destructive",
      })
      return
    }
    const href = contest.status === "active" ? `/arena/${contest.id}` : `/join/${contest.id}`
    router.push(href)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "text-electric-teal"
      case "active":
        return "text-vibrant-purple"
      case "ending":
        return "text-hot-pink"
      default:
        return "text-muted-foreground"
    }
  }

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
    <GlassCard hover className="relative overflow-hidden">
      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex gap-2">
        {contest.isHost && (
          <Badge variant="outline" className="bg-vibrant-purple/20 text-vibrant-purple border-vibrant-purple">
            HOST
          </Badge>
        )}
        <Badge variant="outline" className={`${getStatusColor(contest.status)} border-current`}>
          {contest.status.toUpperCase()}
        </Badge>
      </div>

      {/* Contest header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-vibrant-purple font-mono mb-2">
          {getTypeIcon(contest.type)}
          <span>CONTEST #{contest.id}</span>
        </div>
        <h3 className="text-xl font-display font-bold text-balance">{contest.title}</h3>
      </div>

      {/* Contest stats */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center text-sm font-mono">
          <span className="text-muted-foreground">Entry Fee:</span>
          <span className="text-electric-teal font-bold">{contest.entryFee} USDC</span>
        </div>
        <div className="flex justify-between items-center text-sm font-mono">
          <span className="text-muted-foreground">Prize Pool:</span>
          <span className="text-electric-teal font-bold">{contest.prizePool.toLocaleString()} USDC</span>
        </div>
        <div className="flex justify-between items-center text-sm font-mono">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            Players:
          </span>
          <span className={contest.currentPlayers === contest.maxPlayers ? "text-hot-pink" : "text-foreground"}>
            {contest.currentPlayers}/{contest.maxPlayers}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm font-mono">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Time:
          </span>
          <span className="text-vibrant-purple">{contest.timeRemaining}</span>
        </div>
      </div>

      {/* Difficulty badge */}
      <div className="mb-4">
        <Badge
          variant="secondary"
          className={`
            ${contest.difficulty === "beginner" ? "bg-electric-teal/20 text-electric-teal" : ""}
            ${contest.difficulty === "intermediate" ? "bg-vibrant-purple/20 text-vibrant-purple" : ""}
            ${contest.difficulty === "expert" ? "bg-hot-pink/20 text-hot-pink" : ""}
          `}
        >
          {contest.difficulty.toUpperCase()}
        </Badge>
      </div>

      {/* Action button */}
      <NeonButton
        size="sm"
        className="w-full"
        disabled={contest.currentPlayers === contest.maxPlayers}
        variant={contest.status === "active" ? "secondary" : "primary"}
        onClick={handleEnterContest}
      >
        {contest.currentPlayers === contest.maxPlayers
          ? "Contest Full"
          : contest.status === "active"
            ? "Enter Arena"
            : "Join Contest"}
      </NeonButton>
    </GlassCard>
  )
}
