"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, Zap } from "lucide-react"

interface SwapInterfaceProps {
  tokens: Array<{
    symbol: string
    name: string
    price: number
    change: number
    logo: string
  }>
}

export function SwapInterface({ tokens }: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState(tokens[1]) // USDC
  const [toToken, setToToken] = useState(tokens[0]) // SOL
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSwap = async () => {
    setIsLoading(true)
    // Simulate swap
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setFromAmount("")
    setToAmount("")
  }

  const handleAmountChange = (value: string) => {
    setFromAmount(value)
    if (value && !isNaN(Number(value))) {
      const estimated = (Number(value) / toToken.price).toFixed(6)
      setToAmount(estimated)
    } else {
      setToAmount("")
    }
  }

  const swapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount("")
    setToAmount("")
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-electric-teal" />
          Swap Tokens
        </h3>
        <div className="text-sm font-mono text-muted-foreground">Slippage: 0.5%</div>
      </div>

      <div className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-mono text-muted-foreground">From</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-electric-teal font-mono text-lg"
              />
            </div>
            <Select
              value={fromToken.symbol}
              onValueChange={(value) => {
                const token = tokens.find((t) => t.symbol === value)
                if (token) setFromToken(token)
              }}
            >
              <SelectTrigger className="w-32 bg-background/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    <div className="flex items-center gap-2">
                      <img src={token.logo || "/placeholder.svg"} alt={token.symbol} className="w-4 h-4" />
                      {token.symbol}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs font-mono text-muted-foreground">Balance: 5,000.00 {fromToken.symbol}</div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapTokens}
            className="p-2 rounded-full bg-background/50 hover:bg-electric-teal/20 transition-colors border border-border/50 hover:border-electric-teal"
          >
            <ArrowUpDown className="w-4 h-4 text-electric-teal" />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-mono text-muted-foreground">To</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.00"
                value={toAmount}
                readOnly
                className="bg-background/30 border-border/50 font-mono text-lg"
              />
            </div>
            <Select
              value={toToken.symbol}
              onValueChange={(value) => {
                const token = tokens.find((t) => t.symbol === value)
                if (token) setToToken(token)
              }}
            >
              <SelectTrigger className="w-32 bg-background/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol}>
                    <div className="flex items-center gap-2">
                      <img src={token.logo || "/placeholder.svg"} alt={token.symbol} className="w-4 h-4" />
                      {token.symbol}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs font-mono text-muted-foreground">Balance: 12.34 {toToken.symbol}</div>
        </div>

        {/* Swap Details */}
        {fromAmount && toAmount && (
          <div className="p-3 rounded-lg bg-background/30 space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate:</span>
              <span>
                1 {fromToken.symbol} = {(Number(toAmount) / Number(fromAmount)).toFixed(6)} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee:</span>
              <span className="text-electric-teal">0.25%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Received:</span>
              <span>
                {(Number(toAmount) * 0.995).toFixed(6)} {toToken.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Execute Swap */}
        <NeonButton size="lg" className="w-full" onClick={handleSwap} disabled={!fromAmount || !toAmount || isLoading}>
          {isLoading ? "Swapping..." : `Swap ${fromToken.symbol} for ${toToken.symbol}`}
        </NeonButton>
      </div>
    </GlassCard>
  )
}
