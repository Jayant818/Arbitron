"use client"

import { Navbar } from "@/components/navbar"
import { PortfolioChart } from "@/components/portfolio-chart"
import { Leaderboard } from "@/components/leaderboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"

const tokens = [
  { symbol: "SOL", change: 5.2, value: 103.45 },
  { symbol: "BONK", change: -2.1, value: 0.000011 },
  { symbol: "JUP", change: 8.7, value: 0.92 },
  { symbol: "WIF", change: 12.3, value: 2.63 },
  { symbol: "RAY", change: -1.5, value: 3.16 },
]

export default function ContestArenaPage() {
  const [timeLeft, setTimeLeft] = useState(900) 
  const [tokenData, setTokenData] = useState(tokens)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Simulate real-time token updates
    const interval = setInterval(() => {
      setTokenData((prev) =>
        prev.map((token) => ({
          ...token,
          change: token.change + (Math.random() - 0.5) * 2,
          value: token.value * (1 + (Math.random() - 0.5) * 0.02),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const progress = ((900 - timeLeft) / 900) * 100

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">Quick Strike Contest</h1>
              <Badge className="bg-success text-success-foreground animate-pulse">Live</Badge>
            </div>
            <p className="text-muted-foreground">15-minute trading competition</p>
          </div>

          {/* Timer */}
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Time Remaining</div>
                  <div className="text-2xl font-bold font-mono text-primary">{formatTime(timeLeft)}</div>
                </div>
              </div>
              <Progress value={progress} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>

          {/* Center: Portfolio Chart */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioChart />

            {/* Token Performance Cards */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {tokenData.map((token, i) => (
                <Card
                  key={token.symbol}
                  className={`border-border bg-card hover-glow transition-smooth animate-slide-up ${
                    token.change >= 0 ? "border-l-4 border-l-success" : "border-l-4 border-l-destructive"
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-foreground">{token.symbol}</CardTitle>
                      {token.change >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold text-foreground">
                      ${token.value < 0.001 ? token.value.toExponential(2) : token.value.toFixed(4)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono ${
                        token.change >= 0
                          ? "border-success/50 bg-success/10 text-success"
                          : "border-destructive/50 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {token.change >= 0 ? "+" : ""}
                      {token.change.toFixed(2)}%
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
