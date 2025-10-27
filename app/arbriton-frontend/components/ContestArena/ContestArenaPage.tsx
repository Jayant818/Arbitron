"use client"

import { Navbar } from "@/components/navbar"
import { PortfolioChart } from "@/components/portfolio-chart"
import { Leaderboard } from "@/components/leaderboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, TrendingUp, TrendingDown, Users, Trophy, DollarSign } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { useGetContestByIdQuery } from "@/hooks/api-hooks/useContestQuery"
import { useGetParticipantsByContestIdQuery } from "@/hooks/api-hooks/useUserQuery"
import { useSolana } from "@/components/solana-provider"
import { SignalingManager } from "@/lib/SinglingManager"
import { time } from "console"

interface ContestArenaPageProps {
  contestId: string;
}

export default function ContestArenaPage({ contestId }: ContestArenaPageProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const { selectedAccount } = useSolana();
  const [livePrices, setLivePrices] = useState<Record<string, string>>({}); // mint -> scaledPrice
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [pnlHistory, setPnlHistory] = useState<any[]>([]);

  // Fetch contest details
  const { data: contestDetails, isLoading: isContestLoading } = useGetContestByIdQuery({
    id: contestId,
    customConfig: {
      enabled: !!contestId,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Fetch participants and their selected tokens
  const { data: participants, isLoading: isParticipantsLoading } = useGetParticipantsByContestIdQuery({
    contestId,
    customConfig: {
      refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    },
  });

  // Memoize participant and token data to prevent unnecessary recalculations
  const currentUserParticipant = useMemo(() => 
    participants?.find((p: any) => p.user.publicKey === selectedAccount?.address),
    [participants, selectedAccount?.address]
  );

  const selectedTokens = useMemo(() => 
    currentUserParticipant?.SelectedTokens || [], 
    [currentUserParticipant]
  );

  // WebSocket subscription using SignalingManager
  useEffect(() => {
    if (!selectedTokens || selectedTokens.length === 0) return;

    const signalingManager = SignalingManager.getInstance();
    const callbackId = `contest-arena-${contestId}`;

    // Define the handler for price updates
    const handlePriceUpdate = (payload: { mint: string; price: string }) => {
      setLivePrices(prevPrices => {
        const newPrices = {
          ...prevPrices,
          [payload.mint]: payload.price,
        };
        return newPrices;
      });
    };

    // Register the callback
    signalingManager.registerCallback("priceUpdate", handlePriceUpdate, callbackId);

    // Send subscription message
    const mints = selectedTokens.map((token: any) => token.mint);
    signalingManager.sendMessage({
      type: "SUBSCRIBE_PRICES",
      payload: { mints },
    });
    console.log("Sent SUBSCRIBE_PRICES for:", mints);

    // Cleanup on component unmount
    return () => {
      console.log("Unregistering price update callback");
      signalingManager.unregisterCallback("priceUpdate", callbackId);
    };
  }, [selectedTokens, contestId]);

  // WebSocket subscription for aggregate data
  useEffect(() => {
    const signalingManager = SignalingManager.getInstance();
    const callbackId = `contest-arena-aggregate-${contestId}`;

    const handleAggregateUpdate = (payload: { contestId: string; data: any[] }) => {
      if (payload.contestId === contestId) {
        setLeaderboardData(payload.data);

        const newHistoryEntry: any = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        payload.data.forEach(p => {
          newHistoryEntry[p.participantId] = parseFloat(p.averagePnl);
        });

        setPnlHistory(prevHistory => [...prevHistory, newHistoryEntry]);
      }
    };

    signalingManager.registerCallback("aggregateUpdate", handleAggregateUpdate, callbackId);

    signalingManager.sendMessage({
      type: "SUBSCRIBE_AGGREGATE",
      payload: { contestId },
    });

    return () => {
      signalingManager.unregisterCallback("aggregateUpdate", callbackId);
    };
  }, [contestId]);

  useEffect(() => {
    if (participants && participants.length > 0 && pnlHistory.length === 0) {
      const initialHistoryEntry: any = {
        time: "00:00:00",
      };
      participants.forEach((p: any) => {
        initialHistoryEntry[p.id] = 0;
      });
      setPnlHistory([initialHistoryEntry]);
    }
  }, [participants, pnlHistory]);

  const processedLeaderboardData = useMemo(() => {
    if (!participants || !leaderboardData) return [];

    const participantMap = new Map(participants.map((p: any) => [p.id, p.user]));

    return leaderboardData.map((data, index) => {
      const user = participantMap.get(data.participantId);
      return {
        id: data.participantId,
        name: user?.username || `${user?.publicKey.slice(0, 4)}...${user?.publicKey.slice(-4)}`,
        avatar: user?.publicKey.slice(0, 2).toUpperCase() || "??",
        pnl: parseFloat(data.averagePnl),
        rank: index + 1,
        previousRank: index + 1, // No previous rank data from aggregator yet
      };
    }).sort((a, b) => b.pnl - a.pnl)
    .map((player, index) => ({ ...player, rank: index + 1, previousRank: player.rank }));

  }, [participants, leaderboardData]);

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

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [contestDetails]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const progress = contestDetails && timeLeft !== null
    ? ((contestDetails.duration - timeLeft) / contestDetails.duration) * 100
    : 0;

  const getContestStatus = () => {
    if (!contestDetails) return "loading";
    if (contestDetails.status === 1) return "live";
    if (contestDetails.status === 2) return "completed";
    return "upcoming";
  };

  const contestStatus = getContestStatus();

  if (isContestLoading || !contestDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading contest details...</p>
        </div>
      </div>
    );
  }

  const entryFee = Number(contestDetails.entryFee) / Math.pow(10, contestDetails.decimals);

  // Helper to format price from scaled integer
  const formatPrice = (scaledPrice: string | number | bigint) => {
    return (Number(scaledPrice) / 1_000_000).toFixed(4);
  };

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
                ${entryFee.toFixed(2)} USDC
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
          {timeLeft !== null  && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className={`h-6 w-6 ${timeLeft === 0 ? "text-red-500" : "text-primary"}`} />
                  <div>
                    <div className="text-md text-muted-foreground">Time Remaining</div>
                    <div className={`text-2xl font-bold font-mono ${timeLeft === 0 ? "text-red-500" : "text-primary"}`}>{formatTime(timeLeft)}</div>
                  </div>
                </div>
                {
                  timeLeft !== 0 && 
                <Progress value={progress} className="h-1 mt-2" />
                }
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Leaderboard players={processedLeaderboardData} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <PortfolioChart history={pnlHistory} participants={participants} />

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Your Portfolio</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedTokens.length} tokens selected
                </p>
              </CardHeader>
              <CardContent>
                {isParticipantsLoading ? (
                  <div className="text-center py-8">
                     <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                     <p className="text-sm text-muted-foreground mt-2">Loading your portfolio...</p>
                  </div>
                ) : selectedTokens.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {selectedTokens.map((token: any, i: number) => {
                      const isPowerToken = token.isPowerToken === true || token.isPowerToken === "true";
                      const entryPrice = token.entryPrice ? formatPrice(token.entryPrice) : "N/A";
                      const livePrice = livePrices[token.mint] ? formatPrice(livePrices[token.mint]) : null;
                      
                      const pnl = (livePrice && entryPrice !== "N/A") 
                        ? ((Number(livePrice) - Number(entryPrice)) / Number(entryPrice)) * 100
                        : null;

                      return (
                        <Card
                          key={token.id}
                          className={`border-border bg-card hover-glow transition-smooth animate-slide-up ${
                            isPowerToken ? "border-2 border-amber-500" : ""
                          }`}
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                                {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                                {isPowerToken && <Badge className="bg-amber-500 text-white text-xs">⚡</Badge>}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">x{token.quantity}</p>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Entry: </span>
                              <span className="font-mono text-foreground">${entryPrice}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Live: </span>
                              {livePrice ? (
                                <span className="font-mono text-foreground">${livePrice}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground animate-pulse">Connecting...</span>
                              )}
                            </div>
                            {pnl !== null && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">P&L: </span>
                                <span className={`font-semibold ${
                                  pnl >= 0 ? "text-success" : "text-destructive"
                                }`}>
                                  {pnl >= 0 ? <TrendingUp className="h-4 w-4 inline"/> : <TrendingDown className="h-4 w-4 inline"/>} {pnl.toFixed(2)}%
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {currentUserParticipant ? "No tokens in portfolio" : "You are not a participant"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Participants Section */}
            <Card className="border-border bg-card mt-6">
              <CardHeader>
                <CardTitle className="text-foreground">All Participants</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {participants?.length || 0} participant{participants?.length !== 1 ? 's' : ''} in this contest
                </p>
              </CardHeader>
              <CardContent>
                {isParticipantsLoading ? (
                  <div className="text-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading participants...</p>
                  </div>
                ) : participants && participants.length > 0 ? (
                  <div className="space-y-4">
                    {participants.map((participant: any, index: number) => (
                      <div
                        key={participant.id}
                        className={`p-4 rounded-lg border ${
                          participant.user.publicKey === selectedAccount?.address
                            ? "border-primary bg-primary/5"
                            : "border-border bg-secondary/30"
                        } animate-slide-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">
                                {participant.user.publicKey.slice(0, 4)}...
                                {participant.user.publicKey.slice(-4)}
                              </h4>
                              {participant.user.publicKey === selectedAccount?.address && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(participant.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {participant.SelectedTokens?.length || 0} tokens
                          </Badge>
                        </div>

                        {participant.SelectedTokens && participant.SelectedTokens.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                            {participant.SelectedTokens.map((token: any) => {
                              const isPowerToken = token.isPowerToken === true || token.isPowerToken === "true";
                              return (
                                <div
                                  key={token.id}
                                  className={`p-2 rounded border text-xs ${
                                    isPowerToken
                                      ? "border-amber-500/50 bg-amber-500/10"
                                      : "border-border bg-background"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-foreground">
                                      {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-muted-foreground">×{token.quantity}</span>
                                      {isPowerToken && <span className="text-amber-400">⚡</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No participants yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}