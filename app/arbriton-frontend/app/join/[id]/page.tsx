"use client";

import { TokenCard } from "@/components/token-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle, TrendingUp, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSolana } from "@/components/solana-provider";
import {
  useGetAllTokenQuery,
  useGetTokensByCategoryQuery,
} from "@/hooks/api-hooks/useTokensQuery";
import {
  Token,
  TokenCategory,
} from "@/api-functions/allTokens.api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const TOKENS = [
  {
    id: "So11111111111111111111111111111111111111112",
    name: "Wrapped SOL",
    symbol: "SOL",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    decimals: 9
  },
  {
    id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USD Coin",
    symbol: "USDC",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    decimals: 6
  },
  {
    id: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    name: "USDT",
    symbol: "USDT",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    decimals: 6
  },
  {
    id: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    name: "Ether (Portal)",
    symbol: "ETH",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png",
    decimals: 8
  },
  {
    id: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
    name: "Wrapped BTC (Portal)",
    symbol: "WBTC",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh/logo.png",
    decimals: 8
  },
  {
    id: "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
    name: "Coinbase Wrapped BTC",
    symbol: "cbBTC",
    icon: "https://ipfs.io/ipfs/QmZ7L8yd5j36oXXydUiYFiFsRHbi3EdgC4RuFwvM7dcqge",
    decimals: 8
  },
  {
    id: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
    name: "OFFICIAL TRUMP",
    symbol: "TRUMP",
    icon: "https://arweave.net/VQrPjACwnQRmxdKBTqNwPiyo65x7LAT773t8Kd7YBzw",
    decimals: 6,
    circSupply: 99993305748.27322,
    totalSupply: 99993305748.27322,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    usdPrice: 0.013705568705862288,
    liquidity: 234872.96540734822,
  },
  {
    id: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    name: "Jito Staked SOL",
    symbol: "JitoSOL",
    icon: "https://bafkreifqf5lrxmnxv5i2bi6cgxauwe5hmzwhgchbl7kdyo5nh5sd4jheai.ipfs.nftstorage.link/",
    decimals: 9,
    circSupply: 11566453.300882707,
    totalSupply: 11566453.300882707,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    usdPrice: 162.19204360467188,
    liquidity: 18663918.826178033,
  },
  {
    id: "DgHLr7VR9HW2gLhBMR1XbnZMYdPqgi2CnSPKQ1CPr3xN",
    name: "COQ Inu",
    symbol: "COQ",
    icon: "https://shdw-drive.genesysgo.net/GQm6e7CuGhAL8Fsq27WqirNYqJwcv6kC5HLc1vF9kZAg/Coq_Inu_logo.png",
    decimals: 5,
    circSupply: 690000000000000,
    totalSupply: 690000000000000,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    usdPrice: 0.00000004114674915876331,
    liquidity: 288281.6321623946,
  },
  {
    id: "So11111111111111111111111111111111111111112",
    name: "Wrapped SOL",
    symbol: "SOL",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    decimals: 9,
    circSupply: 578456206.45,
    totalSupply: 578456206.45,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    usdPrice: 161.87,
    liquidity: 25000000,
  },
  {
    id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USD Coin",
    symbol: "USDC",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    decimals: 6,
    circSupply: 12653890000,
    totalSupply: 12653890000,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    usdPrice: 1,
    liquidity: 65000000,
  },
  {
    id: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    name: "Tether",
    symbol: "USDT",
    icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    decimals: 6,
    circSupply: 9874650000,
    totalSupply: 9874650000,
    tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    usdPrice: 1,
    liquidity: 43200000,
  }
];


export default function Page() {
  const { isConnected, selectedAccount } = useSolana();

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Wallet Not Connected</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to Join a contest
          </p>
        </div>
      </div>
    );
  }

  return <JoinContestPage />;
}

function JoinContestPage() {
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [tokenSearch, setTokenSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const entryFee = 0.1;
  const maxTokens = 5;

  // Queries - fetch all categories (React Query will cache them)
  const { data: allTokens, isLoading: loadingAll } = useGetAllTokenQuery();

  const {
    data: organicScoreTokens,
    isLoading: loadingOrganicScore,
  } = useGetTokensByCategoryQuery(TokenCategory.TOP_ORGANIC_SCORE);

  const {
    data: toptradedTokens,
    isLoading: loadingTopTraded,
  } = useGetTokensByCategoryQuery(TokenCategory.TOP_TRADED);

  const {
    data: toptrendingTokens,
    isLoading: loadingTopTrending,
  } = useGetTokensByCategoryQuery(TokenCategory.TOP_TRENDING);

  // Select the appropriate tokens based on active tab
  const tokens: Token[] =
    activeTab === "all"
      ? allTokens || []
      : activeTab === TokenCategory.TOP_ORGANIC_SCORE
      ? organicScoreTokens || []
      : activeTab === TokenCategory.TOP_TRADED
      ? toptradedTokens || []
      : activeTab === TokenCategory.TOP_TRENDING
      ? toptrendingTokens || []
      : [];

  const isLoading = 
    (activeTab === "all" && loadingAll) ||
    (activeTab === TokenCategory.TOP_ORGANIC_SCORE && loadingOrganicScore) ||
    (activeTab === TokenCategory.TOP_TRADED && loadingTopTraded) ||
    (activeTab === TokenCategory.TOP_TRENDING && loadingTopTrending);

  // Handlers
  const toggleToken = (tokenId: string) => {
    setSelectedTokens((prev) =>
      prev.includes(tokenId)
        ? prev.filter((id) => id !== tokenId)
        : prev.length < maxTokens
        ? [...prev, tokenId]
        : prev
    );
  };

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      token.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  const budgetUsed = (selectedTokens.length / maxTokens) * 100;
  const canJoin = selectedTokens.length === maxTokens;

  // Helper function to categorize tokens
  function getCategory(token: Token): "Stable" | "Meme" | "Alt" {
    const symbol = token.symbol.toLowerCase();
    const name = token.name.toLowerCase();
    
    // Stablecoins
    if (
      symbol.includes("usdt") || 
      symbol.includes("usdc") || 
      symbol.includes("dai") ||
      symbol.includes("busd") ||
      symbol.includes("usd")
    ) {
      return "Stable";
    }
    
    // Memecoins - common meme tokens
    if (
      symbol.includes("doge") || 
      symbol.includes("shib") || 
      symbol.includes("pepe") ||
      symbol.includes("bonk") ||
      symbol.includes("floki") ||
      symbol.includes("elon") ||
      name.includes("inu") ||
      name.includes("moon") ||
      name.includes("safe")
    ) {
      return "Meme";
    }
    
    // Everything else is Alt
    return "Alt";
  }
  

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/contests"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contests
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Draft Your Portfolio
          </h1>
          <p className="text-lg text-muted-foreground">
            Select {maxTokens} tokens to compete with
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Token Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search tokens by name or symbol..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className="pl-10 glass border-border text-white placeholder:text-muted-foreground"
              />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Tokens</TabsTrigger>
                <TabsTrigger value={TokenCategory.TOP_ORGANIC_SCORE}>
                  Organic Score
                </TabsTrigger>
                <TabsTrigger value={TokenCategory.TOP_TRADED}>
                  Top Traded
                </TabsTrigger>
                <TabsTrigger value={TokenCategory.TOP_TRENDING}>
                  Trending
                </TabsTrigger>
              </TabsList>

              {/* All Tokens Tab */}
              <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token, i) => (
                        <div
                          key={token.id}
                          className="animate-slide-up"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <TokenCard
                            symbol={token.symbol}
                            name={token.name}
                            price={token.usdPrice}
                            change24h={token.stats24h?.priceChange ?? 0}
                            category={getCategory(token)}
                            selected={selectedTokens.includes(token.id)}
                            onToggle={() => toggleToken(token.id)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No tokens found matching &quot;{tokenSearch}&quot;
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Organic Score Tab */}
              <TabsContent value={TokenCategory.TOP_ORGANIC_SCORE} className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token, i) => (
                        <div
                          key={token.id}
                          className="animate-slide-up"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <TokenCard
                            symbol={token.symbol}
                            name={token.name}
                            price={token.usdPrice}
                            change24h={token.stats24h?.priceChange ?? 0}
                            category={getCategory(token)}
                            selected={selectedTokens.includes(token.id)}
                            onToggle={() => toggleToken(token.id)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No tokens found matching &quot;{tokenSearch}&quot;
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Top Traded Tab */}
              <TabsContent value={TokenCategory.TOP_TRADED} className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token, i) => (
                        <div
                          key={token.id}
                          className="animate-slide-up"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <TokenCard
                            symbol={token.symbol}
                            name={token.name}
                            price={token.usdPrice}
                            change24h={token.stats24h?.priceChange ?? 0}
                            category={getCategory(token)}
                            selected={selectedTokens.includes(token.id)}
                            onToggle={() => toggleToken(token.id)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No tokens found matching &quot;{tokenSearch}&quot;
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Trending Tab */}
              <TabsContent value={TokenCategory.TOP_TRENDING} className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token, i) => (
                        <div
                          key={token.id}
                          className="animate-slide-up"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <TokenCard
                            symbol={token.symbol}
                            name={token.name}
                            price={token.usdPrice}
                            change24h={token.stats24h?.priceChange ?? 0}
                            category={getCategory(token)}
                            selected={selectedTokens.includes(token.id)}
                            onToggle={() => toggleToken(token.id)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        No tokens found matching &quot;{tokenSearch}&quot;
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border bg-card sticky top-20">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Portfolio Builder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tokens Selected</span>
                    <span className="font-bold text-foreground">
                      {selectedTokens.length}/{maxTokens}
                    </span>
                  </div>
                  <Progress value={budgetUsed} className="h-3" />
                </div>

                {/* Entry Fee */}
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Entry Fee
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {entryFee} SOL
                    </span>
                  </div>
                </div>

                {/* Rules */}
                <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground leading-relaxed">
                    Select exactly {maxTokens} tokens. Your portfolio performance
                    will be tracked in real-time during the contest.
                  </div>
                </div>

                {/* Join Button */}
                <Button
                  disabled={!canJoin}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {canJoin
                      ? "Join Contest"
                      : `Select ${maxTokens - selectedTokens.length} More`}
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
