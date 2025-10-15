"use client"

import { Navbar } from "@/components/navbar"
import { PortfolioChart } from "@/components/portfolio-chart"
import { Leaderboard } from "@/components/leaderboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, TrendingUp, TrendingDown, Users, Trophy, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { useGetContestByIdQuery } from "@/hooks/api-hooks/useContestQuery"

const tokens = [
  { symbol: "SOL", change: 5.2, value: 103.45 },
  { symbol: "BONK", change: -2.1, value: 0.000011 },
  { symbol: "JUP", change: 8.7, value: 0.92 },
  { symbol: "WIF", change: 12.3, value: 2.63 },
  { symbol: "RAY", change: -1.5, value: 3.16 },
]

interface ContestArenaPageProps {
  contestId: string;
}

export default function ContestArenaPage({ contestId }: ContestArenaPageProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [tokenData, setTokenData] = useState(tokens);

  // Fetch contest details
  const { data: contestDetails, isLoading: isContestLoading } = useGetContestByIdQuery({
    id: contestId,
    customConfig: {
      enabled: !!contestId,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Calculate time left based on contest start time and duration
  useEffect(() => {
    if (!contestDetails) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const startTime = new Date(contestDetails.startTime).getTime();
      const endTime = startTime + (contestDetails.duration * 1000); // duration is in seconds
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [contestDetails]);

  useEffect(() => {
    // Simulate real-time token updates
    const interval = setInterval(() => {
      setTokenData((prev) =>
        prev.map((token) => ({
          ...token,
          change: token.change + (Math.random() - 0.5) * 2,
          value: token.value * (1 + (Math.random() - 0.5) * 0.02),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    } else if (m > 0) {
      return `${m}m ${s}s`;
    } else {
      return `${s}s`;
    }
  };

  // Calculate progress
  const progress = contestDetails && timeLeft !== null
    ? ((contestDetails.duration - timeLeft) / contestDetails.duration) * 100
    : 0;

  // Get contest status
  const getContestStatus = () => {
    if (!contestDetails) return "loading";
    if (contestDetails.status === 1) return "live";
    if (contestDetails.status === 2) return "completed";
    return "upcoming";
  };

  const contestStatus = getContestStatus();

  if (isContestLoading || !contestDetails) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground">Loading contest details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const entryFee = contestDetails.entryFee / Math.pow(10, contestDetails.decimals);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Contest Info Banner */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Trophy className="h-4 w-4" />
                <span>Prize Pool</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                TBD
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="h-4 w-4" />
                <span>Entry Fee</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${entryFee.toFixed(2)} USDT
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="h-4 w-4" />
                <span>Participants</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {contestDetails.currentPlayers || 0}/{contestDetails.maxPlayers}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                <span>Duration</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Math.floor(contestDetails.duration / 60)}m
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{contestDetails.title}</h1>
              <Badge className={`${
                contestStatus === "live" 
                  ? "bg-success text-success-foreground animate-pulse" 
                  : contestStatus === "completed"
                  ? "bg-muted text-muted-foreground"
                  : "bg-amber-500 text-white"
              }`}>
                {contestStatus === "live" ? "Live" : contestStatus === "completed" ? "Completed" : "Upcoming"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Started {new Date(contestDetails.startTime).toLocaleString()}
            </p>
          </div>

          {/* Timer */}
          {timeLeft !== null && timeLeft > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <div>
                    <div className="text-xs text-muted-foreground">Time Remaining</div>
                    <div className="text-2xl font-bold font-mono text-primary">{formatTime(timeLeft)}</div>
                  </div>
                </div>
                <Progress value={progress} className="h-1 mt-2" />
              </CardContent>
            </Card>
          )}

          {timeLeft === 0 && (
            <Card className="border-muted/50 bg-muted/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-muted-foreground">Contest Ended</div>
                  <div className="text-sm text-muted-foreground">Check results below</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>

          {/* Center: Portfolio Chart */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioChart />

            {/* Token Performance Cards */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {tokenData.map((token, i) => (
                <Card
                  key={token.symbol}
                  className={`border-border bg-card hover-glow transition-smooth animate-slide-up ${
                    token.change >= 0 ? "border-l-4 border-l-success" : "border-l-4 border-l-destructive"
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-foreground">{token.symbol}</CardTitle>
                      {token.change >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold text-foreground">
                      ${token.value < 0.001 ? token.value.toExponential(2) : token.value.toFixed(4)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono ${
                        token.change >= 0
                          ? "border-success/50 bg-success/10 text-success"
                          : "border-destructive/50 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {token.change >= 0 ? "+" : ""}
                      {token.change.toFixed(2)}%
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
