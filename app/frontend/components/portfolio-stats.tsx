import { GlassCard } from "@/components/ui/glass-card"
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react"

interface PortfolioStatsProps {
  balance: number
  pnl: number
  pnlPercent: number
  rank: number
  totalTrades: number
}

export function PortfolioStats({ balance, pnl, pnlPercent, rank, totalTrades }: PortfolioStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <GlassCard className="text-center">
        <div className="text-2xl font-display font-bold text-electric-teal mb-1">${balance.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground font-mono">Portfolio Value</div>
      </GlassCard>

      <GlassCard className="text-center">
        <div
          className={`text-2xl font-display font-bold mb-1 flex items-center justify-center gap-1 ${
            pnl >= 0 ? "text-electric-teal" : "text-hot-pink"
          }`}
        >
          {pnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          P&L ({pnl >= 0 ? "+" : ""}
          {pnlPercent.toFixed(2)}%)
        </div>
      </GlassCard>

      <GlassCard className="text-center">
        <div className="text-2xl font-display font-bold text-vibrant-purple mb-1 flex items-center justify-center gap-1">
          <Target className="w-5 h-5" />#{rank}
        </div>
        <div className="text-sm text-muted-foreground font-mono">Current Rank</div>
      </GlassCard>

      <GlassCard className="text-center">
        <div className="text-2xl font-display font-bold text-foreground mb-1 flex items-center justify-center gap-1">
          <Activity className="w-5 h-5" />
          {totalTrades}
        </div>
        <div className="text-sm text-muted-foreground font-mono">Total Trades</div>
      </GlassCard>
    </div>
  )
}
