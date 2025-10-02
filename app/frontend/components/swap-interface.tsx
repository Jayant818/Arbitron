"use client"

import { useState, useEffect, useCallback, useContext } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { ArrowUpDown, Zap, ChevronDown } from "lucide-react"
import { MintTokenInterface } from "@/app/arena/[id]/page"
import Image from "next/image"
import { ChainContext } from "@/context/ChainContext"
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext"
import { VersionedTransaction } from "@solana/web3.js"
import { RpcContext } from "@/context/RpcContext"
import { useSignAndSendTransaction } from "@solana/react"
import bs58 from "bs58"
import { address, type Signature } from "@solana/kit"

interface SwapInterfaceProps {
  tokens: Array<MintTokenInterface>
  userPublicKey?: string
}


export function SwapInterface({ tokens, userPublicKey }: SwapInterfaceProps) {
  const { chain } = useContext(ChainContext);
  const { rpc } = useContext(RpcContext);
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const [fromToken, setFromToken] = useState(tokens[1]); // USDC
  const [toToken, setToToken] = useState(tokens[0]); // SOL
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fromOpen, setFromOpen] = useState(false);
  const [fromSearch, setFromSearch] = useState("");
  const [toOpen, setToOpen] = useState(false);
  const [toSearch, setToSearch] = useState("");
  const [quoteResponse, setQuoteResponse] = useState<unknown>(null);

  const USD_DEV = address("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

  // Always call the hook to follow rules of hooks, but it may return null/undefined when no account
  const signAndSend = useSignAndSendTransaction(
    selectedWalletAccount?.account || (null as never),
    chain
  );

  const fromFilteredTokens = fromSearch ? tokens.filter(t => t.symbol.toLowerCase().includes(fromSearch.toLowerCase()) || t.name.toLowerCase().includes(fromSearch.toLowerCase())) : tokens.slice(0, 5)
  const toFilteredTokens = toSearch ? tokens.filter(t => t.symbol.toLowerCase().includes(toSearch.toLowerCase()) || t.name.toLowerCase().includes(toSearch.toLowerCase())) : tokens.slice(0, 5)
  const fetchQuote = useCallback(async (inputAmount: string) => {
    if (!inputAmount || isNaN(Number(inputAmount)) || Number(inputAmount) <= 0) {
      setToAmount("");
      return;
    }
    try {
      const amountInSmallest = Math.floor(Number(inputAmount) * Math.pow(10, fromToken.decimals));
      let data;
  
      if (chain === 'solana:devnet') {
        // Mock quote for Devnet
        const mockOutAmount = Math.floor(amountInSmallest * 0.99); // Simulate 1% slippage/fee; adjust rate as needed
        data = {
          inputAmount: amountInSmallest.toString(),
          outAmount: mockOutAmount.toString(),
          otherAmountThreshold: Math.floor(mockOutAmount * 0.995).toString(), // 0.5% slippage threshold
          swapMode: 'ExactIn',
          priceImpactPct: '0.01',
          routePlan: [], // Empty for mock; in real swap, you'd handle direct CPI
          // Add more fields if your code relies on them
        };
      } else {
        // Real API for Mainnet/Testnet
        const inputMint = chain === 'solana:mainnet' ? fromToken.address : USD_DEV; // Use correct input mint
        const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${toToken.address}&amount=${amountInSmallest}&slippageBps=50&restrictIntermediateTokens=true`;
        const response = await fetch(url);
        data = await response.json();
      }
  
      if (data.outAmount) {
        const outAmountHuman = Number(data.outAmount) / Math.pow(10, toToken.decimals);
        setToAmount(outAmountHuman.toFixed(6));
        setQuoteResponse(data);
      } else {
        setToAmount("");
        setQuoteResponse(null);
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      setToAmount("");
      setQuoteResponse(null);
    }
  }, [fromToken, toToken, chain, USD_DEV]); // Add chain and USD_DEV dependency

  useEffect(() => {
    if (fromAmount) {
      fetchQuote(fromAmount);
    }
  }, [fromAmount, fetchQuote]);

  const handleSwap = async () => {
    const currentUserPublicKey = userPublicKey || selectedWalletAccount?.account?.address

    console.log("Swap validation:", {
      quoteResponse: !!quoteResponse,
      fromAmount,
      toAmount,
      userPublicKey: currentUserPublicKey,
      selectedWalletAccount: !!selectedWalletAccount,
      wallet: !!selectedWalletAccount?.wallet,
      // In this app, wallet.features is an array of identifiers
      walletFeatures: selectedWalletAccount?.wallet ? (selectedWalletAccount.wallet.features as unknown as string[]) : []
    })

    if (!quoteResponse || !fromAmount || !toAmount || !currentUserPublicKey || !selectedWalletAccount || !selectedWalletAccount.wallet) {
      console.error("Missing quote, amounts, user public key, selected wallet account, or wallet", {
        quoteResponse: !!quoteResponse,
        fromAmount,
        toAmount,
        userPublicKey: currentUserPublicKey,
        selectedWalletAccount: !!selectedWalletAccount,
        wallet: !!selectedWalletAccount?.wallet
      })
      return
    }

    if (!signAndSend || !selectedWalletAccount?.account) {
      console.error("No signer available. Connect a wallet/account that can sign.")
      return
    }

    setIsLoading(true)
    try {
      const swapResponse = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: currentUserPublicKey,
          dynamicComputeUnitLimit: true,
          dynamicSlippage: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000,
              priorityLevel: "veryHigh"
            }
          }
        })
      })
      const data = await swapResponse.json()
      console.log("Swap transaction built:", data)

      // Deserialize and reserialize to raw bytes (Wallets expect raw bytes)
      const transactionBase64 = data.swapTransaction as string
      const transactionBuffer = Uint8Array.from(atob(transactionBase64), c => c.charCodeAt(0))
      const transaction = VersionedTransaction.deserialize(transactionBuffer)
      const txBytes = transaction.serialize() // Uint8Array

      // Sign and send via Wallet Standard hook
      const { signature } = await signAndSend({ transaction: txBytes })
      const signatureBase58 = bs58.encode(signature)

      console.log("Transaction sent, signature:", signatureBase58)

      // Confirm transaction
      const confirmation = await rpc.getSignatureStatuses([signatureBase58 as Signature]).send()

      if (confirmation.value[0]?.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value[0].err)}\nhttps://solscan.io/tx/${signatureBase58}/`)
      } else {
        console.log(`Transaction successful: https://solscan.io/tx/${signatureBase58}/`)
      }
    } catch (error) {
      console.error("Error in swap:", error)
    } finally {
      setIsLoading(false)
      setFromAmount("")
      setToAmount("")
      setQuoteResponse(null)
    }
  }

  const handleAmountChange = (value: string) => {
    setFromAmount(value)
    fetchQuote(value)
  }

  const swapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount("")
    setToAmount("")
  }

  // Recalculate quote when tokens change
  useEffect(() => {
    if (fromAmount) {
      fetchQuote(fromAmount)
    }
  }, [fromToken, toToken, fromAmount, fetchQuote])

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-electric-teal" />
          Swap Tokens
        </h3>
        <div className="text-sm font-mono text-muted-foreground">Slippage: 0.5%</div>
      </div>

      <div className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-mono text-muted-foreground">From</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-electric-teal font-mono text-lg"
              />
            </div>
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-32 bg-background/50 border-border/50 justify-between">
                  <div className="flex items-center gap-2">
                    <Image src={fromToken.logoURI || "/placeholder.svg"} alt={fromToken.symbol} width={22} height={22} />
                    {fromToken.symbol}
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search token..." value={fromSearch} onValueChange={setFromSearch} />
                  <CommandEmpty>No token found.</CommandEmpty>
                  <CommandGroup>
                    {fromFilteredTokens.map((token) => (
                      <CommandItem
                        key={token.address}
                        value={token.symbol}
                        onSelect={() => {
                          setFromToken(token)
                          setFromOpen(false)
                          setFromSearch("")
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Image src={token.logoURI || "/placeholder.svg"} alt={token.symbol} width={22} height={22} />
                          <span>{token.symbol}</span>
                          <span className="text-muted-foreground">{token.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-xs font-mono text-muted-foreground">Balance: 5,000.00 {fromToken.symbol}</div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapTokens}
            className="p-2 rounded-full bg-background/50 hover:bg-electric-teal/20 transition-colors border border-border/50 hover:border-electric-teal"
          >
            <ArrowUpDown className="w-4 h-4 text-electric-teal" />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-mono text-muted-foreground">To</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.00"
                value={toAmount}
                disabled={true}
                readOnly
                className="bg-background/30 border-border/50 font-mono text-lg"
              />
            </div>
            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-32 bg-background/50 border-border/50 justify-between">
                  <div className="flex items-center gap-2">
                    <Image src={toToken.logoURI || "/placeholder.svg"} alt={toToken.symbol} width={22} height={22} />
                    {toToken.symbol}
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search token..." value={toSearch} onValueChange={setToSearch} />
                  <CommandEmpty>No token found.</CommandEmpty>
                  <CommandGroup>
                    {toFilteredTokens.map((token) => (
                      <CommandItem
                        key={token.address}
                        value={token.symbol}
                        onSelect={() => {
                          setToToken(token)
                          setToOpen(false)
                          setToSearch("")
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Image src={token.logoURI || "/placeholder.svg"} alt={toToken.symbol} width={22} height={22} />
                          <span>{token.symbol}</span>
                          <span className="text-muted-foreground">{token.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-xs font-mono text-muted-foreground">Balance: 12.34 {toToken.symbol}</div>
        </div>

        {/* Swap Details */}
        {fromAmount && toAmount && (
          <div className="p-3 rounded-lg bg-background/30 space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate:</span>
              <span>
                1 {fromToken.symbol} = {(Number(toAmount) / Number(fromAmount)).toFixed(6)} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee:</span>
              <span className="text-electric-teal">0.25%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Received:</span>
              <span>
                {(Number(toAmount) * 0.995).toFixed(6)} {toToken.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Execute Swap */}
        <NeonButton size="lg" className="w-full" onClick={handleSwap} disabled={!fromAmount || !toAmount || isLoading}>
          {isLoading ? "Swapping..." : `Swap ${fromToken.symbol} for ${toToken.symbol}`}
        </NeonButton>
      </div>
    </GlassCard>
  )
}
