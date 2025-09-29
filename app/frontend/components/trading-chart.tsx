"use client"

import { useState, useEffect } from "react"

interface TradingChartProps {
  token: {
    symbol: string
    name: string
    price: number
    change: number
  }
}

export function TradingChart({ token }: TradingChartProps) {
  const [chartData, setChartData] = useState<number[]>([])

  useEffect(() => {
    // Generate mock chart data
    const generateData = () => {
      const data = []
      let price = token.price
      for (let i = 0; i < 100; i++) {
        price += (Math.random() - 0.5) * 2
        data.push(Math.max(0, price))
      }
      return data
    }

    setChartData(generateData())
  }, [token])

  const maxPrice = Math.max(...chartData)
  const minPrice = Math.min(...chartData)
  const priceRange = maxPrice - minPrice

  return (
    <div className="h-64 p-4 relative">
      <svg className="w-full h-full" viewBox="0 0 400 200">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(0, 245, 212, 0.1)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Price line */}
        <polyline
          fill="none"
          stroke="rgba(0, 245, 212, 0.8)"
          strokeWidth="2"
          points={chartData
            .map((price, index) => {
              const x = (index / (chartData.length - 1)) * 400
              const y = 200 - ((price - minPrice) / priceRange) * 180
              return `${x},${y}`
            })
            .join(" ")}
        />

        {/* Glow effect */}
        <polyline
          fill="none"
          stroke="rgba(0, 245, 212, 0.3)"
          strokeWidth="4"
          points={chartData
            .map((price, index) => {
              const x = (index / (chartData.length - 1)) * 400
              const y = 200 - ((price - minPrice) / priceRange) * 180
              return `${x},${y}`
            })
            .join(" ")}
        />
      </svg>

      {/* Price labels */}
      <div className="absolute top-2 left-2 text-xs font-mono text-electric-teal">${maxPrice.toFixed(2)}</div>
      <div className="absolute bottom-2 left-2 text-xs font-mono text-muted-foreground">${minPrice.toFixed(2)}</div>
    </div>
  )
}
