"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Clock, Users, Coins, Trophy, Zap, Shield } from "lucide-react"

export default function CreateContestPage() {
  const [contestName, setContestName] = useState("")
  const [duration, setDuration] = useState("15")
  const [entryFee, setEntryFee] = useState("100")
  const [maxParticipants, setMaxParticipants] = useState([50])
  const [prizeDistribution, setPrizeDistribution] = useState("winner-takes-all")
  const [allowedTokens, setAllowedTokens] = useState("all")
  const [enablePredictions, setEnablePredictions] = useState(false)

  const handleCreateContest = () => {
    console.log("[v0] Creating contest:", {
      contestName,
      duration,
      entryFee,
      maxParticipants: maxParticipants[0],
      prizeDistribution,
      allowedTokens,
      enablePredictions,
    })
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <svg className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="create-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 255, 255, 0.1)">
                <animate
                  attributeName="stop-color"
                  values="rgba(0, 255, 255, 0.1); rgba(255, 0, 255, 0.1); rgba(0, 255, 255, 0.1)"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="rgba(255, 0, 255, 0.1)">
                <animate
                  attributeName="stop-color"
                  values="rgba(255, 0, 255, 0.1); rgba(0, 255, 255, 0.1); rgba(255, 0, 255, 0.1)"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
          <circle cx="20%" cy="30%" r="300" fill="url(#create-gradient)" opacity="0.3">
            <animate attributeName="r" values="300;350;300" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="80%" cy="70%" r="250" fill="url(#create-gradient)" opacity="0.3">
            <animate attributeName="r" values="250;300;250" dur="7s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Create Your Contest</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold gradient-text md:text-5xl">Launch a Trading Battle</h1>
          <p className="text-lg text-muted-foreground">
            Set up your own short-duration trading contest and watch players compete
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-3xl"
        >
          <div className="glass-card rounded-2xl border border-white/10 p-8">
            <div className="space-y-8">
              {/* Contest Name */}
              <div className="space-y-2">
                <Label htmlFor="contest-name" className="text-sm font-medium">
                  Contest Name
                </Label>
                <Input
                  id="contest-name"
                  placeholder="e.g., Midnight Madness Trading Battle"
                  value={contestName}
                  onChange={(e) => setContestName(e.target.value)}
                  className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  <Clock className="mr-2 inline h-4 w-4" />
                  Contest Duration
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="5">5 Minutes - Quick Battle</SelectItem>
                    <SelectItem value="15">15 Minutes - Standard</SelectItem>
                    <SelectItem value="30">30 Minutes - Extended</SelectItem>
                    <SelectItem value="60">1 Hour - Marathon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Entry Fee */}
              <div className="space-y-2">
                <Label htmlFor="entry-fee" className="text-sm font-medium">
                  <Coins className="mr-2 inline h-4 w-4" />
                  Entry Fee (USDC)
                </Label>
                <Input
                  id="entry-fee"
                  type="number"
                  step="0.01"
                  placeholder="109"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm"
                />
                <p className="text-xs text-muted-foreground">Minimum: 10 USDC • Recommended: 100 - 1000 USDC</p>
              </div>

              {/* Max Participants */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  <Users className="mr-2 inline h-4 w-4" />
                  Maximum Participants: {maxParticipants[0]}
                </Label>
                <Slider
                  value={maxParticipants}
                  onValueChange={setMaxParticipants}
                  min={10}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 players</span>
                  <span>200 players</span>
                </div>
              </div>

              {/* Prize Distribution */}
              <div className="space-y-2">
                <Label htmlFor="prize-distribution" className="text-sm font-medium">
                  <Trophy className="mr-2 inline h-4 w-4" />
                  Prize Distribution
                </Label>
                <Select value={prizeDistribution} onValueChange={setPrizeDistribution}>
                  <SelectTrigger className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="winner-takes-all">Winner Takes All (100%)</SelectItem>
                    <SelectItem value="top-3">Top 3 (60% / 25% / 15%)</SelectItem>
                    <SelectItem value="top-5">Top 5 (50% / 25% / 15% / 7% / 3%)</SelectItem>
                    <SelectItem value="top-10">Top 10 Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allowed Tokens */}
              <div className="space-y-2">
                <Label htmlFor="allowed-tokens" className="text-sm font-medium">
                  <Shield className="mr-2 inline h-4 w-4" />
                  Allowed Tokens
                </Label>
                <Select value={allowedTokens} onValueChange={setAllowedTokens}>
                  <SelectTrigger className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10">
                    <SelectItem value="all">All Tokens</SelectItem>
                    <SelectItem value="top-100">Top 100 by Market Cap</SelectItem>
                    <SelectItem value="memecoins">Memecoins Only</SelectItem>
                    <SelectItem value="defi">DeFi Tokens Only</SelectItem>
                    <SelectItem value="custom">Custom Whitelist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enable Predictions */}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background/30 p-4 backdrop-blur-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <Label htmlFor="predictions" className="text-sm font-medium">
                      Enable Live Predictions
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Allow spectators to bet on who will win</p>
                </div>
                <Switch id="predictions" checked={enablePredictions} onCheckedChange={setEnablePredictions} />
              </div>

              {/* Prize Pool Preview */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Estimated Prize Pool</span>
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {(Number.parseFloat(entryFee || "0") * maxParticipants[0] * 0.95).toFixed(2)} USDC
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  5% platform fee • Based on {maxParticipants[0]} participants
                </p>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateContest}
                disabled={!contestName || !entryFee}
                className="group relative h-14 w-full overflow-hidden bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Create Contest
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By creating a contest, you agree to our Terms of Service and Contest Rules
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
