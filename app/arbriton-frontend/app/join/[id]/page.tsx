"use client"

import { Navbar } from "@/components/navbar"
import { TokenCard } from "@/components/token-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, AlertCircle, TrendingUp, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const tokens = [
  { id: "1", symbol: "SOL", name: "Solana", price: 98.45, change24h: 5.2, category: "Alt" as const },
  { id: "2", symbol: "USDC", name: "USD Coin", price: 1.0, change24h: 0.01, category: "Stable" as const },
  { id: "3", symbol: "BONK", name: "Bonk", price: 0.000012, change24h: -3.5, category: "Meme" as const },
  { id: "4", symbol: "JUP", name: "Jupiter", price: 0.85, change24h: 8.3, category: "Alt" as const },
  { id: "5", symbol: "WIF", name: "dogwifhat", price: 2.34, change24h: 12.7, category: "Meme" as const },
  { id: "6", symbol: "USDT", name: "Tether", price: 1.0, change24h: 0.0, category: "Stable" as const },
  { id: "7", symbol: "RAY", name: "Raydium", price: 3.21, change24h: -2.1, category: "Alt" as const },
  { id: "8", symbol: "ORCA", name: "Orca", price: 4.56, change24h: 6.8, category: "Alt" as const },
]

export default function JoinContestPage() {
  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [tokenSearch, setTokenSearch] = useState("")
  const entryFee = 0.1
  const maxTokens = 5

  const toggleToken = (tokenId: string) => {
    setSelectedTokens((prev) =>
      prev.includes(tokenId)
        ? prev.filter((id) => id !== tokenId)
        : prev.length < maxTokens
          ? [...prev, tokenId]
          : prev,
    )
  }

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      token.name.toLowerCase().includes(tokenSearch.toLowerCase()),
  )

  const budgetUsed = (selectedTokens.length / maxTokens) * 100
  const categoryCounts = selectedTokens.reduce(
    (acc, tokenId) => {
      const token = tokens.find((t) => t.id === tokenId)
      if (token) acc[token.category]++
      return acc
    },
    { Stable: 0, Meme: 0, Alt: 0 },
  )

  const canJoin = selectedTokens.length === maxTokens

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/contests"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contests
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Draft Your Portfolio</h1>
          <p className="text-lg text-muted-foreground">Select {maxTokens} tokens to compete with</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Token Selection Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search tokens by name or symbol..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className="pl-10 glass border-border text-white placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token, i) => (
                  <div key={token.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <TokenCard
                      {...token}
                      selected={selectedTokens.includes(token.id)}
                      onToggle={() => toggleToken(token.id)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No tokens found matching "{tokenSearch}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Summary Sidebar */}
          <div className="space-y-6">
            {/* Budget Card */}
            <Card className="border-border bg-card sticky top-20">
              <CardHeader>
                <CardTitle className="text-foreground">Portfolio Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Token Selection Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tokens Selected</span>
                    <span className="font-bold text-foreground">
                      {selectedTokens.length}/{maxTokens}
                    </span>
                  </div>
                  <Progress value={budgetUsed} className="h-3" />
                </div>

                {/* Category Breakdown */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Category Distribution</div>
                  {[
                    { name: "Stable", count: categoryCounts.Stable, color: "bg-blue-500" },
                    { name: "Meme", count: categoryCounts.Meme, color: "bg-purple-500" },
                    { name: "Alt", count: categoryCounts.Alt, color: "bg-green-500" },
                  ].map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${cat.color}`} />
                        <span className="text-sm text-muted-foreground">{cat.name}</span>
                      </div>
                      <Badge variant="secondary">{cat.count}</Badge>
                    </div>
                  ))}
                </div>

                {/* Entry Fee */}
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Entry Fee</span>
                    <span className="text-lg font-bold text-primary">{entryFee} SOL</span>
                  </div>
                </div>

                {/* Rules Info */}
                <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground leading-relaxed">
                    Select exactly {maxTokens} tokens. Your portfolio performance will be tracked in real-time during
                    the contest.
                  </div>
                </div>

                {/* Join Button */}
                <Button
                  disabled={!canJoin}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {canJoin ? "Join Contest" : `Select ${maxTokens - selectedTokens.length} More`}
                  </span>
                  {canJoin && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
