"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

interface ContestCardProps {
  id: string
  title: string
  entryFee: number
  prizePool: number
  duration: number
  slotsTotal: number
  slotsFilled: number
  startsIn: number
  status: "upcoming" | "active" | "ended"
}

export function ContestCard({
  title,
  entryFee,
  prizePool,
  duration,
  slotsTotal,
  slotsFilled,
  startsIn,
  status,
}: ContestCardProps) {
  const [timeLeft, setTimeLeft] = useState(startsIn)
  const fillPercentage = (slotsFilled / slotsTotal) * 100

  useEffect(() => {
    if (status === "upcoming" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status, timeLeft])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const borderGlowClass =
    status === "active"
      ? "border-glow-cyan animate-glow-cyan"
      : status === "upcoming"
        ? "border-glow-purple"
        : "border-glow-gray"

  return (
    <Card className={`group relative overflow-hidden glass glass-hover ${borderGlowClass}`}>
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{duration} minute contest</p>
          </div>
          <Badge
            variant={status === "active" ? "default" : "secondary"}
            className={
              status === "active"
                ? "bg-primary text-primary-foreground animate-pulse-ring font-semibold"
                : "glass font-semibold"
            }
          >
            {status === "active" ? "LIVE" : status === "upcoming" ? "Upcoming" : "Ended"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="flex items-center justify-between rounded-lg glass p-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm text-card-foreground">Prize Pool</span>
          </div>
          <span className="text-lg font-bold text-primary">{prizePool} SOL</span>
        </div>

        {/* Entry Fee */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Entry Fee</span>
          <span className="font-semibold text-white">{entryFee} SOL</span>
        </div>

        {/* Slots Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Players</span>
            </div>
            <span className="font-medium text-white">
              {slotsFilled}/{slotsTotal}
            </span>
          </div>
          <Progress value={fillPercentage} className="h-2" />
        </div>

        {status === "upcoming" && (
          <div className="flex items-center justify-between rounded-lg glass border-primary/30 p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm text-card-foreground">Starts in</span>
            </div>
            <span className="font-mono text-lg font-bold text-primary animate-countdown-pulse">
              {formatTime(timeLeft)}
            </span>
          </div>
        )}

        {status === "active" && (
          <div className="flex items-center gap-2 rounded-lg glass border-primary/30 p-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Contest in progress</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative">
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth font-semibold relative overflow-hidden group/btn"
          disabled={status === "ended"}
        >
          <span className="relative z-10">
            {status === "active" ? "Watch Live" : status === "upcoming" ? "Join Contest" : "View Results"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover/btn:opacity-20 transition-opacity animate-aurora" />
        </Button>
      </CardFooter>
    </Card>
  )
}
