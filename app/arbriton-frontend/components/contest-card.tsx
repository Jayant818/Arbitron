"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState, useCallback } from "react"
import { IContest } from "@/api-functions/contest.api"
import { useRouter } from "next/router"
import Link from "next/link"
import { MonoCurrency } from "@/components/ui/mono-number"

type ContestCardProps = IContest

export function ContestCard({
  id,
  title,
  entryFee,
  duration,
  maxPlayers,
  currentPlayers,
  startTime,
  status: statusCode,
  decimals,
}: ContestCardProps) {
  // Convert status code to string
  const status = statusCode === 0 ? "upcoming" : statusCode === 1 ? "active" : "ended"
  
  // Calculate prize pool (entry fee * current players)
  const prizePool = (entryFee * currentPlayers) / Math.pow(10, decimals)
  
  // Format entry fee for display
  const displayEntryFee = entryFee / Math.pow(10, decimals)
  
  // Calculate time remaining until contest starts (startTime is in seconds)
  const calculateTimeLeft = useCallback(() => {
    const now = Math.floor(Date.now() / 1000) // Current time in seconds
    const timeUntilStart = startTime - now
    return Math.max(0, timeUntilStart)
  }, [startTime])
  
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())
  const fillPercentage = (currentPlayers / maxPlayers) * 100
  
  // Check if contest can start (needs at least 2 players)
  const canStart = currentPlayers >= 2
  const isPastStartTime = timeLeft === 0

  useEffect(() => {
    if (status === "upcoming") {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft())
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status, calculateTimeLeft])

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400); // 86400 seconds in a day
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // If more than 1 day, show days and hours
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    
    // If more than 1 hour, show hours and minutes
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    // Otherwise show MM:SS format for better precision
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <Card className={`group relative overflow-hidden glass glass-hover `}>
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-mono tabular-nums">{Math.floor(duration/60)}</span> minute contest
            </p>
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
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm text-card-foreground">Prize Pool</span>
          </div>
          <MonoCurrency value={prizePool} currency="USDC" decimals={2} className="text-lg font-bold text-primary" />
        </div>

        {/* Entry Fee */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Entry Fee</span>
          <MonoCurrency value={displayEntryFee} currency="USDC" decimals={2} className="font-semibold text-white" />
        </div>

        {/* Slots Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Players</span>
            </div>
            <span className="font-medium text-white font-mono tabular-nums">
              {currentPlayers}/{maxPlayers}
            </span>
          </div>
          <Progress value={fillPercentage} className="h-2" />
        </div>

        {status === "upcoming" && (
          <>
            {/* <div className="flex items-center justify-between  border-primary/30 p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm text-card-foreground">
                  {isPastStartTime && !canStart ? "Waiting for players" : "Starts in"}
                </span>
              </div>
              <span className="font-mono text-lg font-bold text-primary animate-countdown-pulse">
                {isPastStartTime && !canStart ? "—" : formatTime(timeLeft)}
              </span>
            </div> */}
            
            {isPastStartTime && !canStart && (
              <div className="rounded-lg glass border-destructive/30 p-3">
                <p className="text-xs text-destructive text-center">
                  ⚠️ Need at least 2 players to start • Time expired
                </p>
              </div>
            )}
            
            {!isPastStartTime && !canStart && timeLeft < 300 && (
              <div className="rounded-lg glass border-yellow-500/30 p-3">
                <p className="text-xs text-yellow-500 text-center">
                  ⏰ Need at least 2 players to start this contest
                </p>
              </div>
            )}
          </>
        )}

      </CardContent>

      <CardFooter className="relative">
        <Link
          className="w-full bg-primary py-2  text-center border-1 rounded-2xl text-primary-foreground hover:bg-primary/90 transition-smooth font-semibold relative overflow-hidden group/btn"
          href={`/join/${id}`}
          disabled={status === "ended"}
        >
          <span className="relative z-10">
            {status === "active" ? "Watch Live" : status === "upcoming" ? "Join Contest" : "View Results"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover/btn:opacity-20 transition-opacity animate-aurora" />
        </Link>
      </CardFooter>
    </Card>
  )
}
