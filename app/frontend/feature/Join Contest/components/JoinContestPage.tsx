"use client"

import { useState, useContext, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import {
  Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Trophy,
  Users,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Shield,
  Star,
} from "lucide-react"
import axios from "axios"
import type { Contest } from "@/app/page"
import { RpcContext } from "@/context/RpcContext"
import { address, appendTransactionMessageInstructions, createTransactionMessage, getAddressEncoder, getBase58Decoder, getBase64EncodedWireTransaction, getProgramDerivedAddress, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signAndSendTransactionMessageWithSigners, signTransactionMessageWithSigners } from "@solana/kit"
import { TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda } from "@solana-program/token"
import {
  getConfigDecoder,
  getJoinContestInstructionAsync,
  JoinContestAsyncInput,
} from "../../../../../dist/js-client/index"
import { useWalletAccountTransactionSendingSigner } from "@solana/react"
import { ChainContext } from "@/context/ChainContext"
import { SelectedWalletAccountState } from "@/context/SelectedWalletAccountContext"

type NonNullableWalletAccount = Exclude<SelectedWalletAccountState, undefined>;

async function fetchContestDetailsById(id: string) {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/${id}`)
    return res.data
  } catch (error) {
    console.error("Error fetching contest details:", error)
    throw error
  }
}

const TOKEN_MINT = process.env.NEXT_PUBLIC_SUPPORTED_MINT; 
const PLATFORM_FEE_WALLET = process.env.NEXT_PUBLIC_PLATFORM_FEE_WALLET;
const ARBITRON_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_PROGRAM_ID;

export default function JoinContestPage({selectedWalletAccount, contestId}:{selectedWalletAccount:NonNullableWalletAccount, contestId: string}) {
  const router = useRouter();
  const { rpc } = useContext(RpcContext);
  const { chain} = useContext(ChainContext);

  const [isJoining, setIsJoining] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [contestData, setContestData] = useState<Contest | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchContestDetailsById(contestId);
        setContestData(data);

        console.log("Contest ID:", contestId);
        console.log("Fetched contest data:", data);
      } catch (error) {
        console.error("Error fetching contest:", error);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [contestId]);

  useEffect(() => {
    if (selectedWalletAccount && TOKEN_MINT) {
      const account = selectedWalletAccount.account.address;

      async function fetchBalance() {
        const [pdaAddress] = await findAssociatedTokenPda({
          mint: address(TOKEN_MINT!),
          owner: address(account),
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });
        console.log("Derived PDA Address:", pdaAddress);

        const { value } = await rpc.getTokenAccountBalance(pdaAddress).send();
        console.log("Fetched token balance:", value);
        setWalletBalance(Number(value.amount) / Math.pow(10, value.decimals));
        
         const configSeeds = [new TextEncoder().encode("config")];
            const [configPdaAddress, configBump] = await getProgramDerivedAddress({
              programAddress: address(ARBITRON_PROGRAM_ADDRESS!),
              seeds: configSeeds,
            });
        const configPda = configPdaAddress;

        const configAccountInfo = await rpc
        .getAccountInfo(configPda, {
          encoding: "jsonParsed",
        })
          .send();
        
        const data = configAccountInfo.value?.data;
        if (Array.isArray(data) && typeof data[0] === "string") {
          const configData = getConfigDecoder().decode(Buffer.from(data[0], "base64"));
          console.log("Config Data:", configData);
        }
        
            // getConfigDecoder().decode(Buffer.from(configAccountInfo.value?.data[0]!, "base64"));
          
        // console.log("Config Account Info:", configAccountInfo.value?.data);
      }

      fetchBalance();
    }
  }, [selectedWalletAccount,rpc]);

  // Transform API contest data to UI format
  const mockContest = useMemo(() => {
    if (!contestData) return null

    const entryFee = contestData.entryFee / Math.pow(10, contestData.decimals)
    const prizePool = entryFee * contestData.maxPlayers

    // Derive type from duration
    let type: "lightning" | "endurance" | "precision"
    if (contestData.duration <= 600) {
      type = "lightning"
    } else if (contestData.duration <= 3600) {
      type = "precision"
    } else {
      type = "endurance"
    }

    // Calculate time until start
    const now = Math.floor(Date.now() / 1000)
    const timeUntilStartSeconds = Math.max(0, contestData.waitingTime - now)
    const timeUntilStartMinutes = Math.floor(timeUntilStartSeconds / 60)
    const timeUntilStartSecs = timeUntilStartSeconds % 60
    const timeUntilStart = `${timeUntilStartMinutes}:${timeUntilStartSecs.toString().padStart(2, "0")}`

    // Calculate duration string
    const durationMinutes = Math.floor(contestData.duration / 60)
    const duration = durationMinutes < 60 ? `${durationMinutes} minutes` : `${Math.floor(durationMinutes / 60)} hours`

    // Generate description
    const description =
      type === "lightning"
        ? `Fast-paced ${durationMinutes}-minute trading contest with high volatility tokens. Perfect for quick profits and adrenaline rush!`
        : type === "precision"
        ? `Moderate-paced ${durationMinutes}-minute contest. Test your precision and timing with every trade!`
        : `Endurance contest lasting ${duration}. For experienced traders with staying power.`

    // Prize distribution
    const prizeDistribution = [
      { place: 1, percentage: 60, amount: Math.floor(prizePool * 0.6) },
      { place: 2, percentage: 25, amount: Math.floor(prizePool * 0.25) },
      { place: 3, percentage: 15, amount: Math.floor(prizePool * 0.15) },
    ]

    // Mock recent winners
    const recentWinners = [
      { username: "CryptoNinja", winnings: 1250, avatar: "" },
      { username: "DiamondHands", winnings: 750, avatar: "" },
      { username: "MoonTrader", winnings: 500, avatar: "" },
    ]

    return {
      id: contestData.id,
      title: contestData.title,
      type,
      description,
      entryFee,
      prizePool,
      currentPlayers: contestData.currentPlayers,
      maxPlayers: contestData.maxPlayers,
      timeUntilStart,
      duration,
      prizeDistribution,
      recentWinners,
    }
  }, [contestData])


  const signer = useWalletAccountTransactionSendingSigner(selectedWalletAccount.account,chain);

  const handleJoinContest = async () => {
    if (!agreedToTerms || !contestData) return

    setIsJoining(true)
    try {
      console.log("🚀 Starting join contest transaction...");
      console.log("📍 Contest ID:", contestId);
      console.log("👤 User Address:", selectedWalletAccount.account.address);
      console.log("🔑 Signer Address:", signer.address);
      console.log("🏦 Platform Fee Wallet:", PLATFORM_FEE_WALLET);
      
      // CRITICAL: Use the wallet account address, NOT signer.address
      // The signer.address is somehow returning the platform fee wallet!
      const userAddress = address(selectedWalletAccount.account.address);

      const [pdaAddress] = await findAssociatedTokenPda({
        mint: address(TOKEN_MINT!),
        owner: userAddress,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });
      console.log("💰 User Token ATA:", pdaAddress);

      const participentInfoSeeds = [
        new TextEncoder().encode("participent"),
        getAddressEncoder().encode(address(contestId)),
        getAddressEncoder().encode(userAddress)
      ];

      const [participentInfoPda] = await getProgramDerivedAddress({
        seeds: participentInfoSeeds,
        programAddress: address(ARBITRON_PROGRAM_ADDRESS!),
      })
      console.log("📋 Participant Info PDA:", participentInfoPda);

      const participentUsdtAtaSeeds = [
        new TextEncoder().encode("participent_usdt_ata"),
        getAddressEncoder().encode(userAddress),
        getAddressEncoder().encode(address(TOKEN_MINT!)),
        getAddressEncoder().encode(address(contestId))
      ];

      const [participentUsdtAtaPda] = await getProgramDerivedAddress({  
        seeds: participentUsdtAtaSeeds,
        programAddress: address(ARBITRON_PROGRAM_ADDRESS!),
      })
      console.log("💵 Participant USDT ATA:", participentUsdtAtaPda);

      const configSeeds = [
        new TextEncoder().encode("config")
      ];

      const [configPda] = await getProgramDerivedAddress({
        seeds: configSeeds,
        programAddress: address(ARBITRON_PROGRAM_ADDRESS!),
      });
      console.log("⚙️ Config PDA:", configPda);

      const playerGlobalProfileSeeds = [
        new TextEncoder().encode("player"),
        getAddressEncoder().encode(userAddress)
      ];

      const [playerGlobalProfilePda] = await getProgramDerivedAddress({
        seeds: playerGlobalProfileSeeds,
        programAddress: address(ARBITRON_PROGRAM_ADDRESS!),
      });
      console.log("🎮 Player Global Profile PDA:", playerGlobalProfilePda);

      const tradingPdaSeeds = [
        new TextEncoder().encode("trading_pda"),
        getAddressEncoder().encode(address(contestId)),
        getAddressEncoder().encode(userAddress)
      ];

      const [tradingPda] = await getProgramDerivedAddress({
        seeds: tradingPdaSeeds,
        programAddress: address(ARBITRON_PROGRAM_ADDRESS!),
      });

      const platformFeeOwner = address(PLATFORM_FEE_WALLET!);  // This is the wallet pubkey from env/config

      const [platformFeeAta] = await findAssociatedTokenPda({
        mint: address(TOKEN_MINT!),
        owner: platformFeeOwner,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });
      console.log("💰 Platform Fee ATA:", platformFeeAta);

      console.log("📊 Trading PDA:", tradingPda);

      const input: JoinContestAsyncInput = {
        contest: address(contestId),
        host: address(contestData.host),
        tokenMint: address(TOKEN_MINT!),
        userAta: pdaAddress,
        participent: signer,
        platformFeeWallet: platformFeeAta, // ✅ Use the TOKEN ACCOUNT, not the wallet address!
        participentInfo: address(participentInfoPda),
        participentUsdtAta: address(participentUsdtAtaPda),
        config: address(configPda),
        playerGlobalProfile: address(playerGlobalProfilePda),
        tradingPda: address(tradingPda),
      };

      console.log("📦 Transaction Input:", {
        contest: contestId,
        host: contestData?.host,
        tokenMint: TOKEN_MINT,
        userAta: pdaAddress,
        participentAddress: userAddress,
        platformFeeWallet: PLATFORM_FEE_WALLET,
        participentInfo: participentInfoPda,
        participentUsdtAta: participentUsdtAtaPda,
        config: configPda,
        playerGlobalProfile: playerGlobalProfilePda,
        tradingPda: tradingPda,
      });

      const ix = await getJoinContestInstructionAsync(input,{
              programAddress: address(ARBITRON_PROGRAM_ADDRESS!),
            });
      
      console.log("✅ Instruction created successfully");

      const { value: blockhash } = await rpc.getLatestBlockhash().send();
      console.log("🔗 Latest blockhash:", blockhash.blockhash);

      const txMsg = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) => appendTransactionMessageInstructions([ix], tx)
      );
      
      console.log("📝 Transaction message created, signing and sending...");

      const signatureBytes = await signAndSendTransactionMessageWithSigners(txMsg);

      console.log("📤 Transaction sent, awaiting confirmation...", signatureBytes);

      const sig = getBase58Decoder().decode(signatureBytes);

      console.log("✅ Contest joined successfully! Signature:", sig);
	  
	  alert("Contest joined successfully!");
      setShowSuccess(true);
      // router.push(`/contest/${contestId}`);
    } catch (error) {
      console.error("❌ Error joining contest:", error);
      
      // Better error handling
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error stack:", error.stack);
      }
      
      alert("Error joining contest: " + errorMessage);
      setIsJoining(false);
      return;
    }

  }

  const canAfford = mockContest ? walletBalance >= mockContest.entryFee : false
  const hasSpace = mockContest ? mockContest.currentPlayers < mockContest.maxPlayers : false

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azure-teal mx-auto mb-4" />
          <p className="text-muted-foreground font-mono">Loading contest...</p>
        </div>
      </div>
    )
  }

  if (!mockContest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassCard className="text-center">
          <h1 className="text-2xl font-display font-bold text-maximum-red mb-4">Contest Not Found</h1>
          <p className="text-muted-foreground mb-6">This contest doesn&apos;t exist or has been removed.</p>
          <NeonButton onClick={() => router.push("/")}>Return Home</NeonButton>
        </GlassCard>
      </div>
    )
  }



  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassCard className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-azure-teal mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-azure-teal mb-2">Successfully Joined!</h2>
            <p className="text-muted-foreground font-mono">Welcome to {mockContest.title}</p>
          </div>

          <div className="space-y-2 text-sm font-mono mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contest starts in:</span>
              <span className="text-deep-purple">{mockContest.timeUntilStart}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your position:</span>
              <span className="text-azure-teal">#{mockContest.currentPlayers + 1}</span>
            </div>
          </div>

          <div className="animate-pulse">
            <p className="text-xs text-muted-foreground">Redirecting to contest lobby...</p>
          </div>
        </GlassCard>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lightning":
        return <Zap className="w-4 h-4" />
      case "endurance":
        return <Clock className="w-4 h-4" />
      case "precision":
        return <Trophy className="w-4 h-4" />
      default:
        return <Trophy className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold neon-text-teal tracking-wider">JOIN CONTEST</h1>
          </div>
          <Badge variant="outline" className="text-deep-purple border-deep-purple font-mono">
            CONTEST #{contestId}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contest Overview */}
            <GlassCard>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-deep-purple font-mono mb-2">
                    {getTypeIcon(mockContest.type)}
                    <span>{mockContest.type.toUpperCase()} ROUND</span>
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">{mockContest.title}</h2>
                  <p className="text-muted-foreground">{mockContest.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-azure-teal mb-1">${mockContest.entryFee}</div>
                  <div className="text-xs text-muted-foreground font-mono">Entry Fee</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-deep-purple mb-1">
                    ${mockContest.prizePool.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">Expected Prize Pool</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-foreground mb-1">
                    {mockContest.currentPlayers}/{mockContest.maxPlayers}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-maximum-red mb-1">{mockContest.duration}</div>
                  <div className="text-xs text-muted-foreground font-mono">Duration</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-azure-teal/10 border border-azure-teal/30">
                <Clock className="w-5 h-5 text-azure-teal" />
                <div className="text-center">
                  <div className="text-sm text-muted-foreground font-mono">Contest starts in</div>
                  <div className="text-xl font-display font-bold text-azure-teal">{mockContest.timeUntilStart}</div>
                </div>
              </div>
            </GlassCard>

            {/* Wallet Check */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-maximum-red" />
                Wallet Status
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${canAfford ? "bg-azure-teal" : "bg-maximum-red"}`} />
                    <span className="font-mono">USDC Balance</span>
                  </div>
                  <span className={`font-display font-bold ${canAfford ? "text-azure-teal" : "text-maximum-red"}`}>
                    ${walletBalance.toLocaleString()}
                  </span>
                </div>

                {!canAfford && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-maximum-red/10 border border-maximum-red/30">
                    <AlertTriangle className="w-5 h-5 text-maximum-red mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-mono font-bold text-maximum-red mb-1">Insufficient Balance</div>
                      <div className="text-sm text-muted-foreground">
                        You need ${mockContest.entryFee - walletBalance} more USDC to join this contest.
                      </div>
                    </div>
                  </div>
                )}

                {!hasSpace && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-maximum-red/10 border border-maximum-red/30">
                    <Users className="w-5 h-5 text-maximum-red mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-mono font-bold text-maximum-red mb-1">Contest Full</div>
                      <div className="text-sm text-muted-foreground">This contest has reached maximum capacity.</div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Terms Agreement */}
            {canAfford && hasSpace && (
              <GlassCard>
                <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-azure-teal" />
                  Terms & Conditions
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      className="border-[1px] border-white"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-mono leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the contest terms and conditions
                      </label>
                      <p className="text-xs text-muted-foreground">
                        By joining, you acknowledge the risks of trading and agree to our platform rules.
                      </p>
                    </div>
                  </div>

                  <NeonButton
                    size="lg"
                    className="w-full"
                    onClick={handleJoinContest}
                    disabled={!agreedToTerms || isJoining}
                  >
                    {isJoining ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        Joining Contest...
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        Join Contest (${mockContest.entryFee} USDC)
                      </>
                    )}
                  </NeonButton>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Prize Distribution */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-azure-teal" />
                Prize Distribution
              </h3>
              <div className="space-y-3">
                {mockContest.prizeDistribution.map((prize) => (
                  <div key={prize.place} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          prize.place === 1
                            ? "bg-azure-teal/20 text-azure-teal"
                            : prize.place === 2
                              ? "bg-deep-purple/20 text-deep-purple"
                              : "bg-maximum-red/20 text-maximum-red"
                        }`}
                      >
                        {prize.place}
                      </div>
                      <span className="text-sm font-mono">
                        {prize.place === 1 ? "1st" : prize.place === 2 ? "2nd" : "3rd"} Place
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-display font-bold text-azure-teal">${prize.amount}</div>
                      <div className="text-xs text-muted-foreground">{prize.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Recent Winners */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-deep-purple" />
                Recent Winners
              </h3>
              <div className="space-y-3">
                {mockContest.recentWinners.map((winner, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={winner.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-azure-teal/20 text-azure-teal text-xs">
                        {winner.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-mono font-bold">{winner.username}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-display font-bold text-azure-teal">+${winner.winnings}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Contest Stats */}
            <GlassCard>
              <h3 className="text-lg font-display font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average ROI:</span>
                  <span className="text-azure-teal">+12.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="text-deep-purple">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Trades:</span>
                  <span>8.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best Performer:</span>
                  <span className="text-maximum-red">+47.8%</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
