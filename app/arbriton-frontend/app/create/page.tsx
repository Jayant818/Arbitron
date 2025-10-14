"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Sparkles, Clock, Users, Coins, Trophy, Zap, Shield } from "lucide-react"
import { appendTransactionMessageInstructions, createTransactionMessage, getAddressEncoder, getBase58Decoder, getProgramDerivedAddress, pipe, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signAndSendTransactionMessageWithSigners } from "@solana/kit"
import {ARBITRON_PROGRAM_ADDRESS, CreateContestAsyncInput, getCreateContestInstructionAsync} from "../../../../dist/js-client/index"
import { useRouter } from "next/navigation"
import { useWalletAccountTransactionSendingSigner } from "@solana/react"
import { address } from "@solana/kit"
import { useSolana } from "@/components/solana-provider"
import { useCreateContestMutation } from "@/hooks/api-hooks/useContestQuery"

export const USDC_MINT_ADDRESS = address("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr") // USDC Devnet

function ContestForm() {
  const [contestName, setContestName] = useState("")
  const [duration, setDuration] = useState("15")
  const [startTimeOption, setStartTimeOption] = useState("now") 
  const [customStartTime, setCustomStartTime] = useState("") // Custom datetime-local input
  const [entryFee, setEntryFee] = useState("100")
  const [maxParticipants, setMaxParticipants] = useState([50])
  const [prizeDistribution, setPrizeDistribution] = useState("winner-takes-all")
  const [allowedTokens, setAllowedTokens] = useState("all")
  const [enablePredictions, setEnablePredictions] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const router = useRouter()
  const { selectedAccount, chain } = useSolana()
  const signer = useWalletAccountTransactionSendingSigner(selectedAccount!, chain)
  
  const { mutate: createContestInDb } = useCreateContestMutation({
    customConfig: {
      onSuccess: (data) => {
        console.log("Contest saved to DB:", data);
      },
      onError: (error) => {
        console.error("Failed to save contest to DB:", error);
      },
    }
  })

  const handleCreateContest = async () => {
    if (!signer) {
      alert("Please connect your wallet first")
      return
    }

    console.log("[v0] Creating contest:", {
      contestName,
      duration,
      startTimeOption,
      customStartTime,
      entryFee,
      maxParticipants: maxParticipants[0],
      prizeDistribution,
      allowedTokens,
      enablePredictions,
    })
    try {
      setIsCreating(true)
      
      // Convert duration from minutes to seconds
      const durationInSeconds = Number(duration) * 60
      
      // Calculate start time based on user selection
      const now = Math.floor(Date.now() / 1000)
      let startTimeUnix: number
      
      if (startTimeOption === "custom") {
        if (!customStartTime) {
          alert("Please select a custom start time")
          setIsCreating(false)
          return
        }
        // Convert datetime-local to Unix timestamp
        startTimeUnix = Math.floor(new Date(customStartTime).getTime() / 1000)
        
        // Validate that custom time is in the future
        if (startTimeUnix <= now) {
          alert("Start time must be in the future")
          setIsCreating(false)
          return
        }
      } else if (startTimeOption === "now") {
        startTimeUnix = now + 60 // Start in 1 minute
      } else {
        startTimeUnix = now + (Number(startTimeOption) * 60) // Start in X minutes
      }
  
      // 1️⃣ Generate Contest PDA (use signer.address)
      const contestSeeds = [
        new TextEncoder().encode("contest"),
        new TextEncoder().encode(contestName),
        getAddressEncoder().encode(signer.address),
      ]
  
      const [contestPda] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ADDRESS,
        seeds: contestSeeds,
      })
        
  
      // 2️⃣ Prepare instruction input (use signer)
      const createContestAsyncInput: CreateContestAsyncInput = {
        duration: durationInSeconds, // duration in seconds
        entryFees: BigInt(Number(entryFee) * 10 ** 6), // e.g. 100 USDC (6 decimals)
        maxParticipents: Number(maxParticipants[0]),
        name: contestName,
        startTime: BigInt(startTimeUnix),
        signer: signer,
        tokenMint: USDC_MINT_ADDRESS,
        contest: contestPda,
      }
  
      // 3️⃣ Get instruction
      const createContestIx = await getCreateContestInstructionAsync(
        createContestAsyncInput,
        {
          programAddress: ARBITRON_PROGRAM_ADDRESS,
        }
      )
  
      // 4️⃣ Build transaction
      // Get RPC from signer or use environment variable
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com"
      const rpcResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
        }),
      })
      const { result } = await rpcResponse.json()
      const blockhash = result.value
  
      const txMsg = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
        (tx) => appendTransactionMessageInstructions([createContestIx], tx)
      )
  
      // 5️⃣ Sign & Send transaction via wallet (this should prompt the wallet UI)
      const signatureBytes = await signAndSendTransactionMessageWithSigners(txMsg)
      const sig = getBase58Decoder().decode(signatureBytes)
      
      console.log("✅ Contest created successfully! Signature:", sig)

      console.log("💾 Saving contest to database...");

      const contestDataForDb = {
          id: contestPda.toString(), // Use the PDA as the ID
          name: contestName,
          host: selectedAccount!.address,
          entryFee: entryFee.toString(), // Convert BigInt to string for JSON
          maxParticipants: maxParticipants[0],
          startTime: new Date(startTimeUnix * 1000), // Convert Unix timestamp to Date object
          duration: Number(duration),
          decimals: 6, // Or get this dynamically if needed
      };

      // Adding record in db
      console.log("Setting record in db", contestDataForDb);

      await createContestInDb(contestDataForDb);
      console.log("Request Completed")
  
      alert("Contest created successfully!")
      router.push("/contests")
    } catch (error) {
      console.error("❌ Error creating contest:", error)
      alert("Error creating contest. Check console for details.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <svg className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="create-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 255, 255, 0.1)">
                <animate
                  attributeName="stop-color"
                  values="rgba(0, 255, 255, 0.1); rgba(255, 0, 255, 0.1); rgba(0, 255, 255, 0.1)"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="rgba(255, 0, 255, 0.1)">
                <animate
                  attributeName="stop-color"
                  values="rgba(255, 0, 255, 0.1); rgba(0, 255, 255, 0.1); rgba(255, 0, 255, 0.1)"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
          <circle cx="20%" cy="30%" r="300" fill="url(#create-gradient)" opacity="0.3">
            <animate attributeName="r" values="300;350;300" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="80%" cy="70%" r="250" fill="url(#create-gradient)" opacity="0.3">
            <animate attributeName="r" values="250;300;250" dur="7s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Create Your Contest</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold gradient-text md:text-5xl">Launch a Trading Battle</h1>
          <p className="text-lg text-muted-foreground">
            Set up your own short-duration trading contest and watch players compete
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-3xl"
        >
          <div className="glass-card rounded-2xl border border-white/10 p-8">
            <div className="space-y-8">
              {/* Contest Name */}
              <div className="space-y-2">
                <Label htmlFor="contest-name" className="text-sm font-medium">
                  Contest Name
                </Label>
                <Input
                  id="contest-name"
                  placeholder="e.g., Midnight Madness Trading Battle"
                  value={contestName}
                  onChange={(e) => setContestName(e.target.value)}
                  className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  <Clock className="mr-2 inline h-4 w-4" />
                  Contest Duration
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10 bg-background backdrop-blur-md">
                    <SelectItem value="5">5 Minutes - Quick Battle</SelectItem>
                    <SelectItem value="15">15 Minutes - Standard</SelectItem>
                    <SelectItem value="30">30 Minutes - Extended</SelectItem>
                    <SelectItem value="60">1 Hour - Marathon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-sm font-medium">
                  <Clock className="mr-2 inline h-4 w-4" />
                  Contest Start Time
                </Label>
                <Select value={startTimeOption} onValueChange={setStartTimeOption}>
                  <SelectTrigger className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10 bg-background backdrop-blur-md">
                    <SelectItem value="now">Start Immediately (1 min)</SelectItem>
                    <SelectItem value="5">Start in 5 Minutes</SelectItem>
                    <SelectItem value="15">Start in 15 Minutes</SelectItem>
                    <SelectItem value="30">Start in 30 Minutes</SelectItem>
                    <SelectItem value="60">Start in 1 Hour</SelectItem>
                    <SelectItem value="custom">Custom Date & Time</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom datetime input - shown only when "custom" is selected */}
                {startTimeOption === "custom" && (
                  <div className="mt-2">
                    <Input
                      type="datetime-local"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // Min 1 minute from now
                      className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm"
                    />
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {startTimeOption === "now" 
                    ? "Contest will start 1 minute after creation" 
                    : startTimeOption === "custom"
                    ? "Select your custom start date and time"
                    : `Contest will start ${startTimeOption} minutes after creation`}
                </p>
              </div>

              {/* Entry Fee */}
              <div className="space-y-2">
                <Label htmlFor="entry-fee" className="text-sm font-medium">
                  <Coins className="mr-2 inline h-4 w-4" />
                  Entry Fee (USDC)
                </Label>
                <Input
                  id="entry-fee"
                  type="number"
                  step="0.01"
                  placeholder="109"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm"
                />
                <p className="text-xs text-muted-foreground">Minimum: 10 USDC • Recommended: 100 - 1000 USDC</p>
              </div>

              {/* Max Participants */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  <Users className="mr-2 inline h-4 w-4" />
                  Maximum Participants: {maxParticipants[0]}
                </Label>
                <Slider
                  value={maxParticipants}
                  onValueChange={setMaxParticipants}
                  min={10}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 players</span>
                  <span>200 players</span>
                </div>
              </div>

              {/* Prize Distribution */}
              <div className="space-y-2">
                <Label htmlFor="prize-distribution" className="text-sm font-medium">
                  <Trophy className="mr-2 inline h-4 w-4" />
                  Prize Distribution
                </Label>
                <Select value={prizeDistribution} onValueChange={setPrizeDistribution}>
                  <SelectTrigger className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10 bg-background backdrop-blur-md">
                    <SelectItem value="winner-takes-all">Winner Takes All (100%)</SelectItem>
                    <SelectItem value="top-3">Top 3 (60% / 25% / 15%)</SelectItem>
                    <SelectItem value="top-5">Top 5 (50% / 25% / 15% / 7% / 3%)</SelectItem>
                    <SelectItem value="top-10">Top 10 Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allowed Tokens */}
              <div className="space-y-2">
                <Label htmlFor="allowed-tokens" className="text-sm font-medium">
                  <Shield className="mr-2 inline h-4 w-4" />
                  Allowed Tokens
                </Label>
                <Select value={allowedTokens} onValueChange={setAllowedTokens}>
                  <SelectTrigger className="glass-input h-12 border-white/10 bg-background/50 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/10 bg-background backdrop-blur-md">
                    <SelectItem value="all">All Tokens</SelectItem>
                    <SelectItem value="top-100">Top 100 by Market Cap</SelectItem>
                    <SelectItem value="memecoins">Memecoins Only</SelectItem>
                    <SelectItem value="defi">DeFi Tokens Only</SelectItem>
                    <SelectItem value="custom">Custom Whitelist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enable Predictions */}
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background/30 p-4 backdrop-blur-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <Label htmlFor="predictions" className="text-sm font-medium">
                      Enable Live Predictions
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Allow spectators to bet on who will win</p>
                </div>
                <Switch id="predictions" checked={enablePredictions} onCheckedChange={setEnablePredictions} />
              </div>

              {/* Prize Pool Preview */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Estimated Prize Pool</span>
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {(Number.parseFloat(entryFee || "0") * maxParticipants[0] * 0.95).toFixed(2)} USDC
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  5% platform fee • Based on {maxParticipants[0]} participants
                </p>
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateContest}
                disabled={!contestName || !entryFee || isCreating || !signer}
                className="group relative h-14 w-full overflow-hidden bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {isCreating ? "Creating Contest..." : !signer ? "Connect Wallet First" : "Create Contest"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By creating a contest, you agree to our Terms of Service and Contest Rules
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function CreateContestPage() {
  const { selectedAccount, isConnected } = useSolana()

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Wallet Not Connected</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to create a contest
          </p>
        </div>
      </div>
    )
  }

  return <ContestForm />;
}
