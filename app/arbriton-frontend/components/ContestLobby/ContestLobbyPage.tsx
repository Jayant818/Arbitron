import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Clock, Trophy, TrendingUp, Brain, Target, Play, Lightbulb } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetAllParticipantsForContest, useGetContestByIdQuery, useUpdateContestStatusMutation } from "@/hooks/api-hooks/useContestQuery"
import { useSolana } from "@/components/solana-provider"
import { useWalletAccountTransactionSendingSigner } from "@solana/react"
import {  address, appendTransactionMessageInstructions, createTransactionMessage,getBase58Decoder, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signAndSendTransactionMessageWithSigners } from "@solana/kit"
import {
  getStartContestInstruction,
  StartContestInput,
} from "../../../../dist/js-client/index"
import {
    type UiWalletAccount
  } from "@wallet-standard/react";

const quizQuestions = [
  {
    question: "Which token has the highest 24h volume?",
    options: ["SOL", "BONK", "JUP", "RAY"],
    correct: 0,
  },
  {
    question: "What's the current market trend?",
    options: ["Bullish", "Bearish", "Sideways", "Volatile"],
    correct: 3,
  },
]

// Array of Solana facts
const solanaFacts = [
  "Solana was founded in 2017 by Anatoly Yakovenko, a former Qualcomm engineer.",
  "Solana uses **Proof of History (PoH)** to order transactions efficiently.",
  "Solana blockchain can process **65,000+ transactions per second** under test conditions.",
  "The average **block time** on Solana is ~400 milliseconds.",
  "**Transaction fees** on Solana are usually less than **$0.001**.",
  "Solana's native token is **SOL**.",
  "Solana launched its **mainnet beta** in **March 2020**.",
  "Solana supports **smart contracts written in Rust, C, and C++**.",
  "Solana has **8 core innovations**, including Proof of History, Sealevel, and Gulf Stream.",
  "Solana's runtime system, **Sealevel**, allows parallel transaction processing.",
  "Solana uses **Tower BFT**, a modified version of Practical Byzantine Fault Tolerance.",
  "Validators on Solana vote on blocks using a **gossip protocol**.",
  "**Turbine** is Solana's block propagation protocol — it splits data into small packets.",
  "The **Gulf Stream** system pushes transactions to validators **before** blocks are finalized.",
  "Solana's **Cloudbreak** data structure handles parallel reads/writes efficiently.",
  "The **Archivers** in Solana store historical data off-chain.",
  "Solana's runtime can execute **tens of thousands of smart contracts simultaneously**.",
  "Solana blocks are verified by **leaders**, selected through a proof-of-stake rotation.",
  "Validators need **high-end hardware** to handle the chain's throughput.",
  "**State compression** lets Solana store massive NFT or account data with minimal cost.",
  "Solana's developer framework is called **Anchor**.",
  "Anchor provides macros that simplify writing secure Solana programs.",
  "**Phantom** is the most popular Solana wallet.",
  "**Metaplex** powers most NFT collections on Solana.",
  "Solana's block explorer is available at **explorer.solana.com**.",
  "**Solana Pay** enables instant crypto payments with no intermediaries.",
  "**Helius** and **QuickNode** provide powerful Solana APIs for developers.",
  "The Solana ecosystem has over **2,000 active projects**.",
  "**Solana Mobile Stack (SMS)** brings dApps to Android.",
  "**Saga**, Solana's smartphone, launched in 2023 with built-in crypto tools.",
  "The Solana mascot is a **dog named Bonk**, from the meme token BONK.",
  "**Breakpoint** is Solana's official annual developer conference.",
  "The **Solana Foundation** is a non-profit supporting ecosystem growth.",
  "Solana's testnet is called **Devnet**, and anyone can deploy there.",
  "Solana once had an outage that lasted over **17 hours**, which led to major upgrades.",
  "Some Solana validators run on **Raspberry Pi clusters** for fun.",
  "Solana supports **cross-chain bridges** to Ethereum and Bitcoin.",
  "Solana NFTs can be traded gas-free on marketplaces like **Tensor** and **Magic Eden**.",
  "The Solana logo's gradient colors are inspired by **auroras**.",
  "The Solana community often calls itself the  - Solana fam. 💜"
];

export default function ContestLobbyPage({ accountAddress }: { accountAddress:  UiWalletAccount }) {
    const { id: contestId } = useParams();
    const router = useRouter();
    const { selectedAccount,chain,rpc } = useSolana();
    const [currentQuiz, setCurrentQuiz] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [score, setScore] = useState(0)
    const [isStarting, setIsStarting] = useState(false);
    const [randomFact, setRandomFact] = useState("");
     
  
    const { data: contestDetails, isLoading: isContestLoading } = useGetContestByIdQuery({
      id: contestId as string,
      customConfig: {
        enabled: !!contestId,
        refetchInterval:1000,
      }
    })

    const { data: participantsData, isLoading: isParticipantsLoading } = useGetAllParticipantsForContest({
        contestId: contestId as string,
        customConfig: {
            enabled: !!contestId
        }
    })
  

  console.log("Participants Data", participantsData, participantsData?.length);

    console.log("Contest Details", contestDetails);
  
    // Set a random fact on component mount
    useEffect(() => {
      const randomIndex = Math.floor(Math.random() * solanaFacts.length);
      setRandomFact(solanaFacts[randomIndex]);
    }, []);

    // Contest state enum
    const ContestState = {
      UPCOMING: 0,
      ONGOING: 1,
      COMPLETED: 2,
    };

    const { mutate: updateStatus } = useUpdateContestStatusMutation({
        customConfig: {
            onSuccess: () => {
                console.log("Contest status updated to ONGOING");
                alert("Contest started successfully!");
            },
            onError: (error) => {
                console.error("Failed to update contest status", error);
                alert("Contest started successfully, but failed to update status in DB.");
            }
        }
    });
  
  
    // Calculate time remaining until contest starts
    const calculateTimeLeft = () => {
      if (!contestDetails) return 0;
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = contestDetails.startTime - now;
      return Math.max(0, timeLeft);
    };
  
    const signer = useWalletAccountTransactionSendingSigner(accountAddress, chain);
  
    const [timeLeft, setTimeLeft] = useState(0);
  
    // Update time left when contest details load
    useEffect(() => {
      if (contestDetails) {
        if (contestDetails.status === ContestState.ONGOING) {
          router.push(`/contest/${contestId}`);
        }
        setTimeLeft(calculateTimeLeft());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contestDetails]);
  
    // Timer countdown
    useEffect(() => {
      if (timeLeft <= 0) return;
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          // Stop at 0
          if (newTime <= 0) {
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }, [timeLeft]);
  
    const handleStartContest = async () => {
      if (!contestDetails || !selectedAccount) return
  
      setIsStarting(true)
      try {
        // Build the start contest instruction  
        const input: StartContestInput = {
          host: signer,
          contest: address(contestId as string),
        }
  
        const ix = getStartContestInstruction(input)
  
        // Get latest blockhash
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()
  
        // Build and compile the transaction
        const txMsg = pipe(
          createTransactionMessage({ version: 0 }),
          (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
          (tx) => setTransactionMessageFeePayerSigner(signer, tx),
          (tx) => appendTransactionMessageInstructions([ix], tx)
        )
  
        const signatureBytes = await signAndSendTransactionMessageWithSigners(txMsg);
  
        const signature = getBase58Decoder().decode(signatureBytes);
  
        console.log("✅ Contest started successfully! Signature:", signature)
        
        updateStatus({ contestId: contestId as string, status: "ONGOING" });
  
        // Redirect to contest after 1.5 seconds
        // setTimeout(() => {
        //   router.push(`/contest/${contestId}`)
        // }, 1500)
      } catch (error) {
        console.error("Error starting contest:", error)
        alert("Error starting contest: " + error)
      } finally {
        setIsStarting(false)
      }
    }
  
  
    const formatTime = (seconds: number) => {
      // Handle invalid numbers
      if (!Number.isFinite(seconds) || seconds < 0) {
        return "00:00";
      }
      
      const days = Math.floor(seconds / 86400); // 86400 seconds in a day
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      // If more than 1 day, show days and hours
      if (days > 0) {
        return `${days}d ${hours}h`;
      }
      
      // If more than 1 hour, show hours and minutes
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      
      // Otherwise show minutes and seconds
      return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
  
    const handleAnswerSelect = (index: number) => {
      if (selectedAnswer !== null) return
      setSelectedAnswer(index)
      if (index === quizQuestions[currentQuiz].correct) {
        setScore((prev) => prev + 10)
      }
      setTimeout(() => {
        if (currentQuiz < quizQuestions.length - 1) {
          setCurrentQuiz((prev) => prev + 1)
          setSelectedAnswer(null)
        }
      }, 1500)
    }
  
    // Calculate progress based on time remaining (100% at start, 0% when time is up)
    // We need the initial waiting time to calculate progress correctly
    const [initialTimeLeft, setInitialTimeLeft] = React.useState<number | null>(null);
    
    React.useEffect(() => {
      if (contestDetails && initialTimeLeft === null) {
        const initial = calculateTimeLeft();
        if (initial > 0) {
          setInitialTimeLeft(initial);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contestDetails, initialTimeLeft]);
    
    const progress = initialTimeLeft && initialTimeLeft > 0 && Number.isFinite(timeLeft)
      ? Math.min(100, Math.max(0, ((initialTimeLeft - timeLeft) / initialTimeLeft) * 100))
      : timeLeft === 0 ? 100 : 0;
  
    // Show start button if time has passed
    const canStartContest = timeLeft === 0 && contestDetails?.status === ContestState.UPCOMING;
  
    // Calculate prize pool and entry fee
    const entryFee = contestDetails 
      ? (contestDetails.entryFee / Math.pow(10, contestDetails.decimals)).toFixed(2)
      : "0.00";
    
    const prizePool = contestDetails 
      ? ((contestDetails.entryFee * contestDetails.currentPlayers) / Math.pow(10, contestDetails.decimals)).toFixed(2)
      : "0.00";
  
    return (
      <div className="min-h-screen bg-background">
  
        <div className="container mx-auto px-4 pt-24 pb-16">
          {/* Header */}
          <div className="mb-8 text-center">
            <Badge className="mb-4 bg-primary text-primary-foreground animate-pulse-ring">
              {canStartContest ? "Ready to Start!" : "Waiting for Contest Start"}
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {isContestLoading ? "Loading..." : contestDetails?.title || "Contest Lobby"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {canStartContest ? "Contest is ready - Anyone can start!" : "Get ready to compete!"}
            </p>
          </div>
  
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden relative">
                {/* Morphing SVG background */}
                {/* <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#00FFFF", stopOpacity: 0.5 }} />
                      <stop offset="100%" style={{ stopColor: "#FF00FF", stopOpacity: 0.5 }} />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="50%"
                    cy="50%"
                    r="80"
                    fill="none"
                    stroke="url(#timerGrad)"
                    strokeWidth="2"
                    className="animate-morph-circle"
                  />
                </svg> */}
  
                <CardContent className="relative pt-8 pb-8">
                  {canStartContest ? (
                    <div className="flex flex-col items-center justify-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-2">Time&apos;s Up!</div>
                                            <p className="text-muted-foreground">You can start the contest now</p>
                                            {contestDetails.currentPlayers < 2 && <p className='text-red-500'>Need More players to join the contest</p>}
                      </div>
                      <Button
                        size="lg"
                        onClick={handleStartContest}
                        disabled={isStarting || contestDetails.currentPlayers < 2}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isStarting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                            <span>Starting Contest...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            <span>Start Contest</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-8">
                      <Clock className="h-10 w-10 text-primary animate-pulse" />
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Contest starts in</div>
                        <div className={`text-4xl font-bold font-mono ${timeLeft === 0 ? 'text-red-500' : 'text-primary'}`}>
                          {formatTime(timeLeft)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
  
              {/* Mini Quiz/Tasks */}
              {/* <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Brain className="h-5 w-5 text-primary" />
                    Warm-Up Challenge
                    <Badge variant="secondary" className="ml-auto">
                      +{score} pts
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentQuiz < quizQuestions.length ? (
                    <>
                      <div className="text-lg font-medium text-foreground">{quizQuestions[currentQuiz].question}</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {quizQuestions[currentQuiz].options.map((option, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className={`h-auto p-4 justify-start transition-smooth ${
                              selectedAnswer === null
                                ? "hover:border-primary/50 hover:bg-secondary"
                                : selectedAnswer === index
                                  ? index === quizQuestions[currentQuiz].correct
                                    ? "border-success bg-success/10 text-success"
                                    : "border-destructive bg-destructive/10 text-destructive"
                                  : index === quizQuestions[currentQuiz].correct
                                    ? "border-success bg-success/10 text-success"
                                    : ""
                            }`}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={selectedAnswer !== null}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                      <div className="text-lg font-semibold text-foreground">All challenges complete!</div>
                      <div className="text-sm text-muted-foreground mt-2">You earned {score} bonus points</div>
                    </div>
                  )}
                </CardContent>
              </Card> */}
  
              {/* Solana Fun Fact */}
              <Card className="border-border bg-gradient-to-br from-primary/5 via-accent/5 to-background">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2 text-foreground">
                    <Lightbulb className="h-5 w-5 text-primary animate-pulse" />
                    Did You Know?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center min-h-[100px] px-4">
                    <p className="text-center text-base text-foreground leading-relaxed font-medium">
                      {randomFact}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
  
            {/* Players Sidebar */}
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="h-5 w-5 text-primary" />
                    Players
                    <Badge variant="secondary" className="ml-auto">
                      {isContestLoading ? "..." : `${contestDetails?.currentPlayers || 0}/${contestDetails?.maxPlayers || 0}`}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isParticipantsLoading || isContestLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading players...
                    </div>
                  ) : participantsData && participantsData.participants.length > 0 ? (
                    <div className="space-y-3">
                      {participantsData.participants.map((participant: any, i: number) => {
                        // Shorten public key for display (first 4 and last 4 chars)
                        const publicKey = participant.user.publicKey;
                        const shortKey = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
                        // Create initials from public key
                        const initials = `${publicKey.slice(0, 2).toUpperCase()}`;
                        
                        return (
                          <div
                            key={participant.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary transition-smooth animate-slide-up"
                            style={{ animationDelay: `${i * 100}ms` }}
                          >
                            <Avatar className="h-10 w-10 border-2 border-primary/30">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {participant.user.username || shortKey}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Joined {new Date(participant.joinedAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No players have joined yet
                    </div>
                  )}
                </CardContent>
              </Card>
  
              {/* Contest Info */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Trophy className="h-5 w-5 text-primary" />
                    Prize Pool
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isContestLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-2">{prizePool} USDC</div>
                        <div className="text-sm text-muted-foreground">Total Prize Pool</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Entry Fee</span>
                          <span className="font-semibold text-foreground">{entryFee} USDC</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-semibold text-foreground">{contestDetails?.duration ? `${Math.floor(contestDetails.duration / 60)} minutes` : "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Max Players</span>
                          <span className="font-semibold text-foreground">{contestDetails?.maxPlayers || "N/A"}</span>
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-2">Prize Distribution</div>
                        {[
                          { place: "1st", percent: 50 },
                          { place: "2nd", percent: 30 },
                          { place: "3rd", percent: 20 },
                        ].map((item) => (
                          <div key={item.place} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.place} Place</span>
                            <span className="font-semibold text-foreground">
                              {((parseFloat(prizePool) * item.percent) / 100).toFixed(2)} USDC ({item.percent}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }