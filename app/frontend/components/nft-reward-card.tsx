"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Sparkles } from "lucide-react"

interface NFTRewardCardProps {
  rank: number
  showFlip: boolean
}

export function NFTRewardCard({ rank, showFlip }: NFTRewardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [glowColor, setGlowColor] = useState("#00F5D4")

  useEffect(() => {
    if (showFlip) {
      const timer = setTimeout(() => {
        setIsFlipped(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showFlip])

  useEffect(() => {
    // Cycle through glow colors
    const colors = ["#00F5D4", "#9B5DE5", "#F15BB5"] // Electric Teal, Vibrant Purple, Hot Pink
    let colorIndex = 0

    const interval = setInterval(() => {
      setGlowColor(colors[colorIndex])
      colorIndex = (colorIndex + 1) % colors.length
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getRankTitle = (rank: number) => {
    switch (rank) {
      case 1:
        return "Champion's Trophy"
      case 2:
        return "Silver Medal"
      case 3:
        return "Bronze Achievement"
      default:
        return "Participation Badge"
    }
  }

  const getRankRarity = (rank: number) => {
    switch (rank) {
      case 1:
        return "LEGENDARY"
      case 2:
        return "EPIC"
      case 3:
        return "RARE"
      default:
        return "COMMON"
    }
  }

  return (
    <GlassCard className="relative overflow-hidden">
      <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-electric-teal" />
        NFT Reward
      </h3>

      <div className="relative">
        {/* Card Container */}
        <div
          className={`relative w-full aspect-square rounded-lg transition-transform duration-1000 transform-gpu ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* Card Back */}
          <div
            className="absolute inset-0 rounded-lg border-2 flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              borderColor: glowColor,
              boxShadow: `0 0 20px ${glowColor}40`,
              background: `linear-gradient(135deg, ${glowColor}10, transparent)`,
            }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">?</div>
              <div className="text-sm font-mono text-muted-foreground">Mystery NFT</div>
            </div>
          </div>

          {/* Card Front */}
          <div
            className="absolute inset-0 rounded-lg border-2 p-4 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderColor: glowColor,
              boxShadow: `0 0 20px ${glowColor}40`,
              background: `linear-gradient(135deg, ${glowColor}10, transparent)`,
            }}
          >
            <Trophy className="w-16 h-16 mb-4" style={{ color: glowColor }} />
            <h4 className="text-lg font-display font-bold mb-2">{getRankTitle(rank)}</h4>
            <Badge
              className="mb-4"
              style={{
                backgroundColor: `${glowColor}20`,
                color: glowColor,
                borderColor: glowColor,
              }}
            >
              {getRankRarity(rank)}
            </Badge>
            <div className="text-xs font-mono text-muted-foreground mb-4">
              Contest #{String(Math.floor(Math.random() * 1000)).padStart(3, "0")}
              <br />
              Lightning Round Alpha
            </div>
            <div className="flex items-center gap-1 text-xs font-mono">
              <Star className="w-3 h-3" style={{ color: glowColor }} />
              <span>Rank #{rank}</span>
            </div>
          </div>
        </div>

        {/* Claim Button */}
        {isFlipped && (
          <div className="mt-6 animate-fade-in">
            <NeonButton size="sm" className="w-full">
              <Trophy className="w-4 h-4" />
              Claim NFT
            </NeonButton>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
