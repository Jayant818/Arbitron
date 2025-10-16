"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, DotProps } from "recharts"

const CustomDot = (props: DotProps & { participants: any[], history: any[] }) => {
    const { cx, cy, stroke, payload, value, dataKey, index, participants, history } = props;
    const isLastPoint = index === history.length - 1;

    if (isLastPoint) {
        const participant = participants.find((p: any) => p.id === dataKey);
        const initials = participant?.user.publicKey.slice(0, 2).toUpperCase() || "??";

        return (
            <g>
                <circle cx={cx} cy={cy} r={12} fill={stroke} strokeWidth={2} stroke="#fff" />
                <text x={cx} y={cy} dy=".3em" textAnchor="middle" fill="#fff" fontSize="10px" fontWeight="bold">
                    {initials}
                </text>
            </g>
        );
    }

    return null;
};

export function PortfolioChart({ history, participants }: { history: any[], participants: any[] }) {
  if (!history || history.length === 0 || !participants || participants.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Portfolio Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
            <div className="text-center space-y-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground">Waiting for data...</p>
            </div>
        </CardContent>
      </Card>
    );
  }

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Portfolio Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={history} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
                {participants.map((p: any, index: number) => (
                    <linearGradient key={`gradient-${p.id}`} id={`color-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0}/>
                    </linearGradient>
                ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
            <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} unit="%" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(19, 19, 43, 0.8)",
                border: "1px solid #2d2d4a",
                borderRadius: "8px",
                color: "#e5e5e5",
                backdropFilter: "blur(4px)",
              }}
            />
            <Legend />
            {participants.map((p: any, index: number) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                name={p.user.username || `${p.user.publicKey.slice(0, 4)}...${p.user.publicKey.slice(-4)}`}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={<CustomDot participants={participants} history={history} />}
                activeDot={{ r: 8, strokeWidth: 2 }}
                legendType="none"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
