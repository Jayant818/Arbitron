"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { useState } from "react"

interface TokenCardProps {
  symbol: string
  name: string
  price: number
  change24h: number
  category: "Stable" | "Meme" | "Alt" | "Native"
  selected: boolean
  disabled?: boolean
  quantity?: number
  onToggle: () => void
}

export function TokenCard({ symbol, name, price, change24h, category, selected, disabled = false, quantity, onToggle }: TokenCardProps) {
  const [isFlipping, setIsFlipping] = useState(false)

  const handleClick = () => {
    if (disabled && !selected) return; // Don't allow selecting if disabled (but allow deselecting)
    setIsFlipping(true)
    setTimeout(() => setIsFlipping(false), 600)
    onToggle()
  }

  const categoryColors = {
    Stable: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    Meme: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    Alt: "bg-green-500/10 text-green-400 border-green-500/30",
    Native: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  }

  return (
    <Card
      onClick={handleClick}
      className={`group relative overflow-hidden border transition-all duration-300  ${
        disabled && !selected
          ? "cursor-not-allowed opacity-50 border-border bg-card"
          : selected
          ? "cursor-pointer border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "cursor-pointer border-border bg-card hover:border-primary/50"
      } ${isFlipping ? "animate-flip" : ""}`}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary animate-scale-in">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Quantity badge */}
      {quantity && quantity > 1 && (
        <div className="absolute top-2 left-2 z-10 flex h-6 min-w-6 px-2 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-sm animate-scale-in">
          x{quantity}
        </div>
      )}

      {/* Hover glow effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 transition-opacity ${
          selected ? "opacity-100" : "group-hover:opacity-50"
        }`}
      />

      <div className="relative p-4 space-y-3">
        {/* Token header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-foreground">{symbol}</div>
            <div className="text-xs text-muted-foreground">{name}</div>
          </div>
          <Badge variant="outline" className={`${categoryColors[category]} border`}>
            {category}
          </Badge>
        </div>

        {/* Price info */}
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            ${price ? price.toFixed(4) : '0.0000'}
          </div>
          <div className={`text-sm font-medium ${change24h >= 0 ? "text-success" : "text-destructive"}`}>
            {change24h >= 0 ? "+" : ""}
            {change24h !== undefined && change24h !== null ? change24h.toFixed(2) : '0.00'}%
          </div>
        </div>
      </div>
    </Card>
  )
}
