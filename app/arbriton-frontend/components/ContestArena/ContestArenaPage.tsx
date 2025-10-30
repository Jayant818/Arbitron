"use client"

import { PortfolioChart } from "@/components/portfolio-chart"
import { Leaderboard } from "@/components/leaderboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, TrendingDown, Users, Trophy, DollarSign, CheckCircle, Award, XCircle } from "lucide-react"
import { useEffect, useState, useMemo, useRef } from "react"
import { useGetParticipantsByContestIdQuery } from "@/hooks/api-hooks/useUserQuery"
import { useSolana } from "@/components/solana-provider"
import { SignalingManager } from "@/lib/SinglingManager"
import { useRouter } from "next/navigation"
import { address, createSolanaRpc, createSolanaRpcSubscriptions, generateKeyPairSigner, getAddressFromPublicKey, pipe, getProgramDerivedAddress, getAddressEncoder, fetchEncodedAccount } from "@solana/kit"
import { fetchContest } from "../../../../dist/js-client/accounts/contest"
import { ContestState } from "../../../../dist/js-client/types/contestState"
import { fetchConfig } from "../../../../dist/js-client/accounts/config"
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token"
import { USDC_MINT_ADDRESS } from "@/lib/constants"
import { createTransactionMessage, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signAndSendTransactionMessageWithSigners, appendTransactionMessageInstructions, getBase58Decoder } from "@solana/kit"
import { ARBITRON_PROGRAM_ADDRESS } from "../../../../dist/js-client/programs"
import { useWalletAccountTransactionSendingSigner } from "@solana/react"
import { 
  getClaimPrizeInstructionAsync,
  ClaimPrizeAsyncInput
} from "../../../../dist/js-client/index";
import confetti from "canvas-confetti"
import styles from './ContestArenaPage.module.css';

interface ContestArenaPageProps {
  contestId: string;
}

// Helper function to extract value from Option type
function getOptionValue<T>(option: any): T | null {
  if (!option || option.__option === "None") {
    return null;
  }
  return option.__option === "Some" ? option.value : option;
}

interface ContestData {
  name: string;
  duration: bigint;
  startTime: bigint;
  host: string;
  entryFees: bigint;
  maxParticipents: number;
  participentsCount: number;
  status: ContestState;
  prizePoolVaultUsdc: string;
  winner: string | null;
  winnerPnl: bigint | null;
  isPrizeClaimed: boolean;
}

export default function ContestArenaPage({ contestId }: ContestArenaPageProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const previousTimeRef = useRef<number | null>(null);
  const hasShownEndDialogRef = useRef(false); // Track if we've shown the end dialog
  const [contestDetails, setContestDetails] = useState<ContestData | null>(null);
  const [isContestLoading, setIsContestLoading] = useState(true);
  const [isClaimingPrize, setIsClaimingPrize] = useState(false);
  const { selectedAccount, rpc, chain } = useSolana();
  const signer = selectedAccount ? useWalletAccountTransactionSendingSigner(selectedAccount, chain) : null;
  const [livePrices, setLivePrices] = useState<Record<string, string>>({}); // mint -> scaledPrice
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [pnlHistory, setPnlHistory] = useState<any[]>([]);
  const router = useRouter();

  // Fetch contest details from on-chain using RPC
  useEffect(() => {
    let isInitialFetch = true;
    
    const fetchContestDetails = async () => {
      try {
        // Only show loading spinner on initial fetch
        if (isInitialFetch) {
          setIsContestLoading(true);
        }
        const contest = await fetchContest(rpc, address(contestId));
        console.log("Fetched contest from on-chain:", contest);
        
        setContestDetails({
          name: contest.data.name,
          duration: contest.data.duration,
          startTime: contest.data.startTime,
          host: contest.data.host,
          entryFees: contest.data.entryFees,
          maxParticipents: Number(contest.data.maxParticipents),
          participentsCount: Number(contest.data.participentsCount),
          status: contest.data.status,
          prizePoolVaultUsdc: contest.data.prizePoolVaultUsdc,
          winner: getOptionValue<string>(contest.data.winner),
          winnerPnl: getOptionValue<bigint>(contest.data.winnerPnl),
          isPrizeClaimed: contest.data.isPrizeClaimed,
        });
      } catch (error) {
        console.error("Error fetching contest from on-chain:", error);
      } finally {
        if (isInitialFetch) {
          setIsContestLoading(false);
          isInitialFetch = false;
        }
      }
    };

    fetchContestDetails();
    
    // Refetch every 10 seconds to check for status updates
    const interval = setInterval(fetchContestDetails, 10000);
    
    return () => clearInterval(interval);
  }, [contestId, rpc]);


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

    // Cleanup on component unmount
    return () => {
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
      const user: any = participantMap.get(data.participantId);
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
      // startTime is in Unix seconds (i64), convert to milliseconds
      const startTime = Number(contestDetails.startTime) * 1000;
      const duration = Number(contestDetails.duration);
      const endTime = startTime + (duration * 1000); // duration is in seconds
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      // Store previous time for comparison
      const prevTime = previousTimeRef.current;
      previousTimeRef.current = remaining;
      
      // Show popup when contest ends (timer transitions from >0 to 0)
      // Only show once using the ref flag
      if (remaining === 0 && prevTime !== null && prevTime >= 0 && !hasShownEndDialogRef.current) {
        setShowEndDialog(true);
        hasShownEndDialogRef.current = true;
      }
      
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [contestDetails]);

  // Check for winner announcement
  useEffect(() => {
    if (contestDetails?.winner && contestDetails.status === ContestState.Completed && !showWinnerDialog) {
      setTimeout(() => {
        setShowResult(true);
      }, 3000);
      setShowWinnerDialog(true);
    }
  }, [contestDetails?.winner, contestDetails?.status, showWinnerDialog]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const progress = contestDetails && timeLeft !== null
    ? ((Number(contestDetails.duration) - timeLeft) / Number(contestDetails.duration)) * 100
    : 0;

  const getContestStatus = () => {
    if (!contestDetails) return "loading";
    if (contestDetails.status === ContestState.Ongoing) return "live";
    if (contestDetails.status === ContestState.Completed) return "completed";
    return "upcoming";
  };

  const contestStatus = getContestStatus();

  const isWinner = contestDetails?.winner && selectedAccount?.address === contestDetails.winner;
  const canClaimPrize = isWinner && !contestDetails.isPrizeClaimed;

  // Confetti animation
  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleClaimPrize = async () => {
    if (!canClaimPrize || !selectedAccount || !signer) return;
    
    setIsClaimingPrize(true);
    try {
      console.log("Starting prize claim for contest:", contestId);
      
      // Fetch config account to get platform fee wallet
            const [configPda] = await getProgramDerivedAddress({
              programAddress: ARBITRON_PROGRAM_ADDRESS,
              seeds: [new TextEncoder().encode("config")],
            });
      
      console.log("Fetching config account at PDA:", configPda);
            
            const config = await fetchConfig(rpc as unknown as Parameters<typeof fetchConfig>[0], configPda);
            console.log("Fetched config:", config);
      console.log("Building claim prize instruction...");
      // Get contest vault PDA
      const [contestVaultPda] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ADDRESS,
        seeds: [
          new TextEncoder().encode("contest_vault"),
          getAddressEncoder().encode(address(contestId)),
        ],
      });
      console.log("Building claim prize instruction...2");
      
      // Get winner's USDC token account using findAssociatedTokenPda
      const [winnerUsdcAccount] = await findAssociatedTokenPda({
        mint: USDC_MINT_ADDRESS,
        owner: address(selectedAccount.address),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      console.log("Winner USDC Account:", winnerUsdcAccount);
      
      console.log("Building claim prize instruction with accounts:", {
        winner: selectedAccount.address,
        config: configPda,
        contest: contestId,
        contestVault: contestVaultPda,
        winnerUsdcAccount: winnerUsdcAccount,
        platformFeeWallet: config.data.platformFeeWallet,
        tokenMint: USDC_MINT_ADDRESS,
      });
      
      // Build the claim prize instruction
      const claimPrizeIx = await getClaimPrizeInstructionAsync({
        winner: signer,
        contest: address(contestId),
        contestVault: contestVaultPda,
        winnerUsdcAccount: winnerUsdcAccount,
        platformFeeWallet: config.data.platformFeeWallet,
        tokenMint: USDC_MINT_ADDRESS,
      });
      
      // Get recent blockhash
      const { value: blockhash } = await rpc.getLatestBlockhash().send();
      
      // Create transaction message
      const tx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
        (tx) => appendTransactionMessageInstructions([claimPrizeIx], tx)
      );
      
      // Sign and send transaction
      const signatureBytes = await signAndSendTransactionMessageWithSigners(tx);
      const signature = getBase58Decoder().decode(signatureBytes);
      
      console.log("✅ Prize claimed successfully! Signature:", signature);
      
      // Trigger confetti celebration!
      triggerConfetti();
      
      // Refresh contest details to show updated state
            const updatedContest = await fetchContest(rpc as unknown as any, address(contestId));
            setContestDetails({
              name: updatedContest.data.name,
              duration: updatedContest.data.duration,
              startTime: updatedContest.data.startTime,
              host: updatedContest.data.host,
              entryFees: updatedContest.data.entryFees,
              maxParticipents: Number(updatedContest.data.maxParticipents),
              participentsCount: Number(updatedContest.data.participentsCount),
              status: updatedContest.data.status,
              prizePoolVaultUsdc: updatedContest.data.prizePoolVaultUsdc,
              winner: getOptionValue<string>(updatedContest.data.winner),
              winnerPnl: getOptionValue<bigint>(updatedContest.data.winnerPnl),
              isPrizeClaimed: updatedContest.data.isPrizeClaimed,
            });
      
    } catch (error: any) {
      console.error("Error claiming prize:", error);
      alert(`Failed to claim prize: ${error.message || "Unknown error"}`);
    } finally {
      setIsClaimingPrize(false);
    }
  };

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

  const entryFee = Number(contestDetails.entryFees) / 1_000_000; // USDC has 6 decimals

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
                {contestDetails.participentsCount || 0}/{contestDetails.maxParticipents}
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
                {Math.floor(Number(contestDetails.duration) / 60)}m
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Winner Banner */}
        {contestDetails.winner && contestStatus === "completed" && (
          <div className={`mb-4 rounded-lg border p-4 animate-slide-down ${
            isWinner 
              ? "border-green-500/50 bg-green-500/10" 
              : "border-amber-500/50 bg-amber-500/10"
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {isWinner ? (
                  <>
                    <Award className="h-6 w-6 text-green-500" />
                    <div>
                      <span className="font-semibold text-green-500 text-lg">
                        🎉 Congratulations! You Won! 🎉
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Winner P&L: {contestDetails.winnerPnl ? `${(Number(contestDetails.winnerPnl) / 100).toFixed(2)}%` : "N/A"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-amber-500" />
                    <div>
                      <span className="font-semibold text-amber-500 text-lg">
                        Contest Completed
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Winner: {contestDetails.winner.slice(0, 4)}...{contestDetails.winner.slice(-4)} | 
                        P&L: {contestDetails.winnerPnl ? `${(Number(contestDetails.winnerPnl) / 100).toFixed(2)}%` : "N/A"}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {canClaimPrize && (
                <Button
                  onClick={handleClaimPrize}
                  disabled={isClaimingPrize}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {isClaimingPrize ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Claim Prize
                    </>
                  )}
                </Button>
              )}
              {contestDetails.isPrizeClaimed && isWinner && (
                <Badge className="bg-green-500 text-white">
                  Prize Claimed ✓
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{contestDetails.name}</h1>
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
              Started {new Date(Number(contestDetails.startTime) * 1000).toLocaleString()}
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

      {/* Contest Ended Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
      <DialogContent className="sm:max-w-md border-border bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold tracking-wider">
            CONTEST ENDED
          </DialogTitle>
        </DialogHeader>

        {!showResult ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-6">
              Results are being processed using ZK proof.
            </p>
            <div className={styles.puzzleLoader}>
              <div className={styles.puzzlePiece}></div>
              <div className={styles.puzzlePiece}></div>
              <div className={styles.puzzlePiece}></div>
              <div className={styles.puzzlePiece}></div>
            </div>
          </div>
        ) : isWinner ? (
          <div className="py-6 text-center">
            <Trophy className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-500 mb-2">
              You Won!
            </h3>
            <p className="text-muted-foreground mb-6">
              Click the button below to claim your prize.
            </p>
            <Button
              onClick={handleClaimPrize}
              disabled={isClaimingPrize}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              {isClaimingPrize ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Claiming Prize...
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Claim Your Prize
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="py-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-500 mb-2">
              You Lose
            </h3>
            <p className="text-muted-foreground">
              Better luck next time!
            </p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={() => router.push('/contests')}
            variant="outline"
            className="w-full sm:w-auto"
          >
            View Other Contests
          </Button>
          <Button
            onClick={() => setShowEndDialog(false)}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Stay Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    </div>
  )
}