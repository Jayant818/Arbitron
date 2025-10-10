"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Award, Target, Zap, Crown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const nfts = [
  { id: "1", name: "Champion Badge", rarity: "Legendary", icon: Trophy, color: "from-primary to-accent" },
  { id: "2", name: "Silver Medal", rarity: "Epic", icon: Award, color: "from-muted to-foreground" },
  { id: "3", name: "Speed Trader", rarity: "Rare", icon: Zap, color: "from-chart-3 to-chart-2" },
  { id: "4", name: "Perfect Pick", rarity: "Epic", icon: Target, color: "from-chart-2 to-chart-1" },
]

const badges = [
  { id: "1", name: "First Win", description: "Win your first contest", unlocked: true },
  { id: "2", name: "Top 10", description: "Finish in top 10", unlocked: true },
  { id: "3", name: "Streak Master", description: "Win 3 contests in a row", unlocked: false },
  { id: "4", name: "Portfolio Pro", description: "Achieve 50%+ returns", unlocked: true },
]

const recentContests = [
  { id: "1", name: "Quick Strike", rank: 1, pnl: 18.5, prize: 2.5, date: "2 hours ago" },
  { id: "2", name: "Meme Madness", rank: 4, pnl: 9.2, prize: 0, date: "1 day ago" },
  { id: "3", name: "Altcoin Arena", rank: 2, pnl: 15.8, prize: 1.5, date: "2 days ago" },
]

export default function ProfilePage() {
  const userStats = {
    name: "CryptoKing",
    avatar: "CK",
    rank: 1,
    xp: 2450,
    nextLevelXp: 3000,
    contestsPlayed: 24,
    winRate: 45.8,
    totalEarnings: 12.5,
  }

  const xpProgress = (userStats.xp / userStats.nextLevelXp) * 100

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Profile Header */}
        <Card className="border-border bg-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
                  {userStats.avatar}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{userStats.name}</h1>
                  <Badge className="bg-primary text-primary-foreground">
                    <Crown className="h-3 w-3 mr-1" />
                    Rank #{userStats.rank}
                  </Badge>
                </div>

                {/* XP Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Level Progress</span>
                    <span className="font-medium text-foreground">
                      {userStats.xp} / {userStats.nextLevelXp} XP
                    </span>
                  </div>
                  <Progress value={xpProgress} className="h-3" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold text-foreground">{userStats.contestsPlayed}</div>
                    <div className="text-xs text-muted-foreground">Contests</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold text-success">{userStats.winRate}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold text-primary">{userStats.totalEarnings} SOL</div>
                    <div className="text-xs text-muted-foreground">Earned</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="nfts" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* NFTs Tab */}
          <TabsContent value="nfts">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {nfts.map((nft, i) => (
                <Card
                  key={nft.id}
                  className="group border-border bg-card hover-glow transition-smooth overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div
                      className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${nft.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                    >
                      <nft.icon className="h-16 w-16 text-white" />
                      <div className="absolute inset-0 rounded-xl border-2 border-white/20" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{nft.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {nft.rarity}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <div className="grid gap-4 sm:grid-cols-2">
              {badges.map((badge, i) => (
                <Card
                  key={badge.id}
                  className={`border-border transition-smooth animate-slide-up ${
                    badge.unlocked ? "bg-card hover-glow" : "bg-secondary/30 opacity-60"
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full ${
                          badge.unlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Award className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        {badge.unlocked && (
                          <Badge className="mt-2 bg-success text-success-foreground text-xs">Unlocked</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Contests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentContests.map((contest, i) => (
                    <div
                      key={contest.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary transition-smooth animate-slide-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                            contest.rank <= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          #{contest.rank}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{contest.name}</div>
                          <div className="text-sm text-muted-foreground">{contest.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-success/50 bg-success/10 text-success mb-1">
                          +{contest.pnl}%
                        </Badge>
                        {contest.prize > 0 && (
                          <div className="text-sm font-semibold text-primary">{contest.prize} SOL</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
