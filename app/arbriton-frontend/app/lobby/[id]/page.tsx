"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Clock, Trophy, TrendingUp, Brain, Target } from "lucide-react"
import { useEffect, useState } from "react"

const players = [
  { id: "1", name: "CryptoKing", avatar: "CK", rank: 1, xp: 2450 },
  { id: "2", name: "MoonShot", avatar: "MS", rank: 5, xp: 1820 },
  { id: "3", name: "DiamondHands", avatar: "DH", rank: 3, xp: 2100 },
  { id: "4", name: "BullRun", avatar: "BR", rank: 8, xp: 1450 },
  { id: "5", name: "SolanaWhale", avatar: "SW", rank: 2, xp: 2380 },
  { id: "6", name: "DeFiMaster", avatar: "DM", rank: 12, xp: 980 },
]

const quizQuestions = [
  {
    question: "Which token has the highest 24h volume?",
    options: ["SOL", "BONK", "JUP", "RAY"],
    correct: 0,
  },
  {
    question: "What's the current market trend?",
    options: ["Bullish", "Bearish", "Sideways", "Volatile"],
    correct: 3,
  },
]

export default function LobbyPage() {
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes
  const [currentQuiz, setCurrentQuiz] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    if (index === quizQuestions[currentQuiz].correct) {
      setScore((prev) => prev + 10)
    }
    setTimeout(() => {
      if (currentQuiz < quizQuestions.length - 1) {
        setCurrentQuiz((prev) => prev + 1)
        setSelectedAnswer(null)
      }
    }, 1500)
  }

  const progress = ((180 - timeLeft) / 180) * 100

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8 text-center">
          <Badge className="mb-4 bg-primary text-primary-foreground animate-pulse-ring">
            Waiting for Contest Start
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-2">Quick Strike Contest</h1>
          <p className="text-lg text-muted-foreground">Get ready to compete!</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden relative">
              {/* Morphing SVG background */}
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#00FFFF", stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: "#FF00FF", stopOpacity: 0.5 }} />
                  </linearGradient>
                </defs>
                <circle
                  cx="50%"
                  cy="50%"
                  r="80"
                  fill="none"
                  stroke="url(#timerGrad)"
                  strokeWidth="2"
                  className="animate-morph-circle"
                />
              </svg>

              <CardContent className="relative pt-8 pb-8">
                <div className="flex items-center justify-center gap-8">
                  <Clock className="h-10 w-10 text-primary animate-pulse" />
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Contest starts in</div>
                    <div className="text-4xl font-bold font-mono text-primary">{formatTime(timeLeft)}</div>
                  </div>
                  <div className="relative h-20 w-20">
                    <svg className="transform -rotate-90" width="80" height="80">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-secondary"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                        className="text-primary transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mini Quiz/Tasks */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Brain className="h-5 w-5 text-primary" />
                  Warm-Up Challenge
                  <Badge variant="secondary" className="ml-auto">
                    +{score} pts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQuiz < quizQuestions.length ? (
                  <>
                    <div className="text-lg font-medium text-foreground">{quizQuestions[currentQuiz].question}</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {quizQuestions[currentQuiz].options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className={`h-auto p-4 justify-start transition-smooth ${
                            selectedAnswer === null
                              ? "hover:border-primary/50 hover:bg-secondary"
                              : selectedAnswer === index
                                ? index === quizQuestions[currentQuiz].correct
                                  ? "border-success bg-success/10 text-success"
                                  : "border-destructive bg-destructive/10 text-destructive"
                                : index === quizQuestions[currentQuiz].correct
                                  ? "border-success bg-success/10 text-success"
                                  : ""
                          }`}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={selectedAnswer !== null}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-lg font-semibold text-foreground">All challenges complete!</div>
                    <div className="text-sm text-muted-foreground mt-2">You earned {score} bonus points</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spectator Analytics */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Popular Picks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { token: "SOL", picks: 85, color: "bg-chart-3" },
                    { token: "BONK", picks: 72, color: "bg-chart-5" },
                    { token: "JUP", picks: 68, color: "bg-chart-2" },
                    { token: "WIF", picks: 54, color: "bg-chart-1" },
                  ].map((item) => (
                    <div key={item.token} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{item.token}</span>
                        <span className="text-muted-foreground">{item.picks}% of players</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${item.picks}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Players Sidebar */}
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  Players
                  <Badge variant="secondary" className="ml-auto">
                    {players.length}/50
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player, i) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary transition-smooth animate-slide-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <Avatar className="h-10 w-10 border-2 border-primary/30">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {player.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{player.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Rank #{player.rank} • {player.xp} XP
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contest Info */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Trophy className="h-5 w-5 text-primary" />
                  Prize Pool
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">5.0 SOL</div>
                  <div className="text-sm text-muted-foreground">Total Prize Pool</div>
                </div>
                <div className="space-y-2 pt-4 border-t border-border">
                  {[
                    { place: "1st", prize: "2.5 SOL", percent: 50 },
                    { place: "2nd", prize: "1.5 SOL", percent: 30 },
                    { place: "3rd", prize: "1.0 SOL", percent: 20 },
                  ].map((item) => (
                    <div key={item.place} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.place} Place</span>
                      <span className="font-semibold text-foreground">{item.prize}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
