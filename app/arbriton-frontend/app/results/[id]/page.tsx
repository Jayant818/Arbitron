"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Award, TrendingUp, Share2, Home } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const finalStandings = [
  { id: "1", name: "CryptoKing", avatar: "CK", pnl: 18.5, prize: 2.5, rank: 1 },
  { id: "2", name: "SolanaWhale", avatar: "SW", pnl: 15.2, prize: 1.5, rank: 2 },
  { id: "3", name: "DiamondHands", avatar: "DH", pnl: 12.8, prize: 1.0, rank: 3 },
  { id: "4", name: "MoonShot", avatar: "MS", pnl: 9.3, prize: 0, rank: 4 },
  { id: "5", name: "BullRun", avatar: "BR", pnl: 7.1, prize: 0, rank: 5 },
]

export default function ResultsPage() {
  const [showConfetti, setShowConfetti] = useState(false)
  const userRank = 1 // Simulating user won

  useEffect(() => {
    if (userRank <= 3) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    }
  }, [userRank])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      {/* Confetti effect for winners */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10%",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ["#ffd90f", "#10b981", "#3b82f6", "#cc2229"][Math.floor(Math.random() * 4)],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Winner Announcement */}
        {userRank <= 3 && (
          <div className="mb-12 text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 border-4 border-primary mb-6 animate-pulse-ring">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-4">
              {userRank === 1 ? "Victory!" : userRank === 2 ? "Second Place!" : "Third Place!"}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">You finished in the top 3!</p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="text-lg px-6 py-2 bg-primary text-primary-foreground">
                +{finalStandings[userRank - 1].prize} SOL
              </Badge>
              <Badge variant="outline" className="text-lg px-6 py-2 border-success text-success">
                +{finalStandings[userRank - 1].pnl}% P&L
              </Badge>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Final Standings */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Trophy className="h-5 w-5 text-primary" />
                  Final Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {finalStandings.map((player, i) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-smooth animate-slide-up ${
                        player.rank <= 3
                          ? "bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30"
                          : "bg-secondary/30"
                      }`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {/* Rank Badge */}
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                          player.rank === 1
                            ? "bg-primary text-primary-foreground"
                            : player.rank === 2
                              ? "bg-muted text-foreground"
                              : player.rank === 3
                                ? "bg-destructive/20 text-destructive"
                                : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {player.rank === 1 ? (
                          <Trophy className="h-6 w-6" />
                        ) : player.rank === 2 ? (
                          <Award className="h-6 w-6" />
                        ) : (
                          `#${player.rank}`
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12 border-2 border-primary/30">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {player.avatar}
                        </AvatarFallback>
                      </Avatar>

                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="font-semibold text-foreground text-lg">{player.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="border-success/50 bg-success/10 text-success font-mono">
                            +{player.pnl}%
                          </Badge>
                          {player.prize > 0 && (
                            <Badge className="bg-primary text-primary-foreground">{player.prize} SOL</Badge>
                          )}
                        </div>
                      </div>

                      {/* Trophy Icon for Top 3 */}
                      {player.rank <= 3 && <TrendingUp className="h-6 w-6 text-primary" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* NFT Badge Card */}
            {userRank <= 3 && (
              <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Award className="h-5 w-5 text-primary" />
                    Achievement Unlocked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    {/* NFT Preview */}
                    <div className="relative w-32 h-32 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Trophy className="h-16 w-16 text-primary-foreground" />
                      <div className="absolute inset-0 rounded-xl border-2 border-primary animate-pulse-ring" />
                    </div>

                    {/* NFT Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {userRank === 1 ? "Champion Badge" : userRank === 2 ? "Silver Medal" : "Bronze Medal"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Exclusive NFT badge for finishing in the top 3
                      </p>
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Claim NFT</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Prize Pool Breakdown */}
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Trophy className="h-5 w-5 text-primary" />
                  Prize Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-4 border-b border-border">
                  <div className="text-4xl font-bold text-primary mb-2">5.0 SOL</div>
                  <div className="text-sm text-muted-foreground">Total Prize Pool</div>
                </div>

                <div className="space-y-3">
                  {[
                    { place: "1st Place", prize: "2.5 SOL", percent: 50 },
                    { place: "2nd Place", prize: "1.5 SOL", percent: 30 },
                    { place: "3rd Place", prize: "1.0 SOL", percent: 20 },
                  ].map((item, i) => (
                    <div
                      key={item.place}
                      className={`p-3 rounded-lg ${i === userRank - 1 ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{item.place}</span>
                        <span className="font-bold text-primary">{item.prize}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{item.percent}% of pool</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 group relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Results
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>

              <Link href="/contests" className="block">
                <Button variant="outline" className="w-full border-border hover:bg-secondary bg-transparent">
                  Join Another Contest
                </Button>
              </Link>

              <Link href="/" className="block">
                <Button variant="ghost" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
