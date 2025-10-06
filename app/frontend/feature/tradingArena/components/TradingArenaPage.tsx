
"use client"

import { useState, useEffect, useContext } from "react"
import { useParams } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TradingChart } from "@/components/trading-chart"
import { SwapInterface } from "@/components/swap-interface"
import { localStorage } from "@/lib/storage"
import { Leaderboard } from "@/components/leaderboard"
import { PortfolioStats } from "@/components/portfolio-stats"
import { TrendingDown, TrendingUp, Target, Zap, Activity } from "lucide-react"
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext"
import { ChainContext } from "@/context/ChainContext"

// Mock trading data
const mockTokens = [
  {
    "address": "So11111111111111111111111111111111111111112",
    "chainId": 101,
    "decimals": 9,
    "name": "Wrapped SOL",
    "symbol": "SOL",
    "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    "tags": [
      "old-registry"
    ],
    "extensions": {
      "coingeckoId": "wrapped-solana"
    }
  },
  {
    "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "chainId": 101,
    "decimals": 6,
    "name": "USD Coin",
    "symbol": "USDC",
    "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    "tags": [
      "old-registry",
      "solana-fm"
    ],
    "extensions": {
      "coingeckoId": "usd-coin"
    }
  },
  {
    "address": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "chainId": 101,
    "decimals": 6,
    "name": "USDT",
    "symbol": "USDT",
    "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    "tags": [
      "old-registry",
      "solana-fm"
    ],
    "extensions": {
      "coingeckoId": "tether"
    }
  },
  {
    "address": "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    "chainId": 101,
    "decimals": 6,
    "name": "PayPal USD",
    "symbol": "PYUSD",
    "logoURI": "https://424565.fs1.hubspotusercontent-na1.net/hubfs/424565/PYUSDLOGO.png",
    "tags": [
      "community",
      "token-2022"
    ],
    "extensions": {
      "coingeckoId": "paypal-usd"
    }
  },
  {
    "address": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    "chainId": 101,
    "decimals": 6,
    "name": "dogwifhat",
    "symbol": "$WIF",
    "logoURI": "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link",
    "tags": [
      "community",
      "solana-fm"
    ],
    "extensions": {
      "coingeckoId": "dogwifcoin"
    }
  },
  {
    "address": "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    "chainId": 101,
    "decimals": 9,
    "name": "Popcat",
    "symbol": "POPCAT",
    "logoURI": "https://bafkreidvkvuzyslw5jh5z242lgzwzhbi2kxxnpkic5wsvyno5ikvpr7reu.ipfs.nftstorage.link",
    "tags": [
      "community"
    ],
    "extensions": {
      "coingeckoId": "popcat"
    }
  },
]

const USD_DEV = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';



const mockLeaderboard = [
  { rank: 1, username: "CryptoNinja", pnl: 1247.83, pnlPercent: 12.48, avatar: "", isUser: false },
  { rank: 2, username: "DiamondHands", pnl: 892.45, pnlPercent: 8.92, avatar: "", isUser: false },
  { rank: 3, username: "You", pnl: 634.21, pnlPercent: 6.34, avatar: "", isUser: true },
  { rank: 4, username: "MoonTrader", pnl: 423.67, pnlPercent: 4.24, avatar: "", isUser: false },
  { rank: 5, username: "BullRun2024", pnl: 298.34, pnlPercent: 2.98, avatar: "", isUser: false },
]

const ALL_TOKEN_MAINNET = "Token_mint_jup_mainnet";
const ALL_TOKEN_DEVNET = "Token_mint_jup_devnet";
const CACHE_TIME = 60 * 60 * 24; // 1 day

async function getAllToken(chain: string) {
  let storageKey = '';
  let tokens = [];

  if (chain === 'solana:devnet') {
    // storageKey = ALL_TOKEN_DEVNET;
    // // Use hardcoded for Devnet
    // tokens = DEVNET_TOKENS;
    // // Cache it anyway for consistency
    // localStorage.setItem(storageKey, JSON.stringify({ tokens, timestamp: Date.now() }));
    // return tokens;
  } else {
    // Mainnet or Testnet: fetch real list
    storageKey = ALL_TOKEN_MAINNET;
    const data = localStorage.getItem(storageKey);
    if (data) {
      const { tokens: cachedTokens, timestamp } = JSON.parse(data);
      if (CACHE_TIME > Date.now() - timestamp) {
        return cachedTokens;
      }
    }

    const res = await fetch('https://token.jup.ag/strict');
    tokens = await res.json();

    localStorage.setItem(storageKey, JSON.stringify({ tokens, timestamp: Date.now() }));
    return tokens;
  }
}

export interface MintTokenInterface {
  address: string,
    chainId: number,
    decimals: number,
    name: string,
    symbol: string,
    logoURI: string,
    tags: string[],
    extensions: {
      coingeckoId: string
    }
}

export default function TradingArenaPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [timeLeft, setTimeLeft] = useState(287); // 4m 47s
  const [userBalance, setUserBalance] = useState(10634.21);
  const [userPnL, setUserPnL] = useState(634.21);
  const [tokens, setTokens] = useState<MintTokenInterface[] | null>(null);
  const [selectedToken, setSelectedToken] = useState<MintTokenInterface>(mockTokens[0]);
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const { chain } = useContext(ChainContext);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function getTokens() {
      const fetchedTokens = await getAllToken(chain);
      // Dedup and logoURI cleanup logic
      const uniqueTokens = fetchedTokens
        .filter((token: MintTokenInterface, index: number, self: MintTokenInterface[]) => 
          // Remove duplicates by address
          index === self.findIndex((t: MintTokenInterface) => t.address === token.address)
        )
        .map((token: MintTokenInterface) => ({
          ...token,
          // Ensure logoURI exists, fallback to placeholder
          logoURI: token.logoURI || '/placeholder.svg'
        }));
      setTokens(uniqueTokens);
    }
  
    getTokens();
  }, [chain]); // Re-fetch if chain changes

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const pnlPercent = (userPnL / 10000) * 100
  const progressPercent = ((300 - timeLeft) / 300) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-display font-bold neon-text-teal tracking-wider">TRADING ARENA</h1>
              <Badge variant="outline" className="text-maximum-red border-maximum-red font-mono animate-pulse">
                LIVE
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              {/* Contest Timer */}
              <div className="text-center animate-pulse-slow">
                <div className="text-2xl font-display font-bold text-maximum-red">{formatTime(timeLeft)}</div>
                <div className="text-xs text-muted-foreground font-mono">TIME LEFT</div>
              </div>

              {/* User Stats */}
              <div className="text-center animate-pulse-slow">
                <div className="text-lg font-display font-bold text-azure-teal">${userBalance.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground font-mono">BALANCE</div>
              </div>

              <div className="text-center animate-pulse-slow">
                <div
                  className={`text-lg font-display font-bold ${userPnL >= 0 ? "text-azure-teal" : "text-maximum-red"}`}
                >
                  {userPnL >= 0 ? "+" : ""}${userPnL.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground font-mono">P&L</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progressPercent} className="h-1" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Trading Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Portfolio Stats */}
            <PortfolioStats balance={userBalance} pnl={userPnL} pnlPercent={pnlPercent} rank={3} totalTrades={12} />

            {/* Trading Chart */}
            <GlassCard className="p-0 overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-display font-bold">Price Chart</h3>
                    <div className="flex items-center gap-2">
                      {mockTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => setSelectedToken(token)}
                          className={`px-3 py-1 rounded-md text-sm font-mono transition-colors animate-scale-hover ${
                            selectedToken.symbol === token.symbol
                              ? "bg-azure-teal text-quantum-void"
                              : "bg-background/50 hover:bg-background/80"
                          }`}
                        >
                          {token.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <span className="text-xl font-display font-bold">${selectedToken.price}</span>
                    <span
                      className={`text-sm font-mono ${selectedToken.change >= 0 ? "text-electric-teal" : "text-hot-pink"}`}
                    >
                      {selectedToken.change >= 0 ? "+" : ""}
                      {selectedToken.change}%
                    </span>
                  </div> */}
                </div>
              </div>
              {/* <TradingChart token={selectedToken} /> */}
            </GlassCard>

            {/* Swap Interface */}
            {
              tokens && 
              <SwapInterface tokens={tokens} userPublicKey={selectedWalletAccount?.account?.address} />
            }
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Leaderboard participants={mockLeaderboard} />

            {/* Contest Info */}
            <GlassCard className="animate-slide-up">
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-deep-purple" />
                Contest Info
              </h3>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between animate-pulse-slow flex-wrap">
                  <span className="text-muted-foreground">Contest ID:</span>
                  <span className="text-azure-teal w-full">#{contestId}</span>
                </div>
                <div className="flex justify-between animate-pulse-slow">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="text-maximum-red border-maximum-red">
                    LIGHTNING
                  </Badge>
                </div>
                <div className="flex justify-between animate-pulse-slow">
                  <span className="text-muted-foreground">Prize Pool:</span>
                  <span className="text-azure-teal">2,500 USDC</span>
                </div>
                <div className="flex justify-between animate-pulse-slow">
                  <span className="text-muted-foreground">Players:</span>
                  <span>25/25</span>
                </div>
                <div className="flex justify-between animate-pulse-slow">
                  <span className="text-muted-foreground">Your Rank:</span>
                  <span className="text-deep-purple">#3</span>
                </div>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard className="animate-slide-up">
              <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-azure-teal" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <NeonButton size="sm" className="w-full animate-glow">
                  <Activity className="w-4 h-4" />
                  Market Buy SOL
                </NeonButton>
                <NeonButton variant="destructive" size="sm" className="w-full animate-glow">
                  <TrendingDown className="w-4 h-4" />
                  Market Sell SOL
                </NeonButton>
                <NeonButton variant="outline" size="sm" className="w-full animate-glow">
                  Close All Positions
                </NeonButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
