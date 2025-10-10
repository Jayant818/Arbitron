"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

const data = [
  { time: "0:00", value: 100 },
  { time: "0:03", value: 102 },
  { time: "0:06", value: 98 },
  { time: "0:09", value: 105 },
  { time: "0:12", value: 108 },
  { time: "0:15", value: 112 },
]

export function PortfolioChart() {
  const currentValue = data[data.length - 1].value
  const startValue = data[0].value
  const change = ((currentValue - startValue) / startValue) * 100
  const isPositive = change >= 0

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">Your Portfolio</CardTitle>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-success" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
            <span className={`text-2xl font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
              {isPositive ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
            <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#13132b",
                border: "1px solid #2d2d4a",
                borderRadius: "8px",
                color: "#e5e5e5",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#10b981" : "#cc2229"}
              strokeWidth={3}
              dot={{ fill: isPositive ? "#10b981" : "#cc2229", r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
