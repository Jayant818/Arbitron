"use client";

import { TokenCard } from "@/components/token-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle, TrendingUp, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { fetchJupiterSearch } from "@/api-functions/allTokens.api";
import { useGetContestByIdQuery } from "@/hooks/api-hooks/useContestQuery";
import { useParams } from "next/navigation";

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
  // Map of token ID to { token: Token, quantity: number }
  const [selectedTokens, setSelectedTokens] = useState<Map<string, { token: Token; quantity: number }>>(new Map());
  const [powerTokenId, setPowerTokenId] = useState<string | null>(null);
  const [tokenSearch, setTokenSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { id } = useParams();
  
  console.log("Contest ID from params:", id);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(tokenSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [tokenSearch]);

  // fetching all categories (React Query will cache them)
  const { data: allTokens, isLoading: loadingAll } = useGetAllTokenQuery();

  const { data: contestDetails, isLoading: isContestLoading } = useGetContestByIdQuery({
    id: id as string ,
    customConfig: {
      enabled: !!id
    },  
  });

  // const {
  //   data: newListedTokens,
  //   isLoading: loadingNewListed,
  // } = useGetTokensByCategoryQuery(TokenCategory.NEW_LISTED);

  const {
    data: topOrganicTokens,
    isLoading: loadingTopOrganic,
  } = useGetTokensByCategoryQuery(TokenCategory.TOP_ORGANIC);

  const {
    data: topTradedTokens,
    isLoading: loadingTopTraded,
  } = useGetTokensByCategoryQuery(TokenCategory.TOP_TRADED);

  const {
    data: trendingTokens,
    isLoading: loadingTrending,
  } = useGetTokensByCategoryQuery(TokenCategory.TRENDING);

  const { data: searchTokens, isLoading: loadingSearch } = useQuery({
    queryKey: ["tokens", "search", debouncedSearch],
    queryFn: () => fetchJupiterSearch(debouncedSearch),
    enabled: !!debouncedSearch && debouncedSearch.length > 0, 
  });

  // Select the appropriate tokens based on active tab
  let tabTokens: Token[] = [];
  let tabLoading = false;

  switch (activeTab) {
    case "all":
      tabTokens = allTokens || [];
      tabLoading = loadingAll;
      break;
    // case TokenCategory.NEW_LISTED:
    //   tabTokens = newListedTokens || [];
    //   tabLoading = loadingNewListed;
    //   break;
    case TokenCategory.TOP_ORGANIC:
      tabTokens = topOrganicTokens || [];
      tabLoading = loadingTopOrganic;
      break;
    case TokenCategory.TOP_TRADED:
      tabTokens = topTradedTokens || [];
      tabLoading = loadingTopTraded;
      break;
    case TokenCategory.TRENDING:
      tabTokens = trendingTokens || [];
      tabLoading = loadingTrending;
      break;
  }

  const currentTokens = tokenSearch ? (searchTokens || []) : tabTokens;
  const currentLoading = tokenSearch ? loadingSearch : tabLoading;

  // Get entry fee from contest details
  const entryFee = contestDetails 
    ? contestDetails.entryFee / Math.pow(10, contestDetails.decimals)
    : 0;

  // Calculate total value of selected tokens (price * quantity)
  // Note: Power Token does NOT affect entry fee/budget - it only affects P&L tracking in the contest
  const totalSelectedValue = Array.from(selectedTokens.values()).reduce(
    (sum, { token, quantity }) => {
      const baseValue = (token.usdPrice || 0) * quantity;
      return sum + baseValue;
    },
    0
  );

  // Calculate remaining budget
  const remainingBudget = entryFee - totalSelectedValue;

  // Clear error message after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Helper function to categorize tokens
  function getCategory(token: Token): "Stable" | "Meme" | "Alt" | "Native" {
    const symbol = token.symbol.toLowerCase();
    const name = token.name.toLowerCase();
  
    // Stablecoins
    if (
      symbol.includes("usdt") || symbol.includes("usdc") || symbol.includes("dai") ||
      symbol.includes("busd") || symbol.includes("usd") || symbol.includes("pyusd") ||
      symbol.includes("usde") || symbol.includes("frax") || symbol.includes("tusd") ||
      symbol.includes("pax") || symbol.includes("lusd") || symbol.includes("eurs") ||
      symbol.includes("usdd") || symbol.includes("gusd") || symbol.includes("fdusd")
    ) {
      return "Stable";
    }
  
    // Memecoins
    if (
      symbol.includes("doge") || symbol.includes("shib") || symbol.includes("pepe") ||
      symbol.includes("bonk") || symbol.includes("floki") || symbol.includes("elon") ||
      symbol.includes("wif") || symbol.includes("popcat") || symbol.includes("michi") ||
      symbol.includes("mog") || symbol.includes("trump") || symbol.includes("maga") ||
      symbol.includes("boden") || symbol.includes("harris") || symbol.includes("pump") ||
      name.includes("inu") || name.includes("moon") || name.includes("safe") ||
      name.includes("cat") || name.includes("dog") || name.includes("frog") ||
      name.includes("wifhat") || name.includes("retardio") || name.includes("neiro") ||
      name.includes("billy") || name.includes("mew") || name.includes("goat")
    ) {
      return "Meme";
    }
  
    // Native blockchain tokens
    if (
      symbol === "eth" || symbol === "sol" || symbol === "bnb" ||
      symbol === "matic" || symbol === "avax" || symbol === "dot" ||
      symbol === "ftm" || symbol === "near" || symbol === "atom" ||
      symbol === "ada" || symbol === "xlm" || symbol === "algo"
    ) {
      return "Native";
    }
  
    // Everything else
    return "Alt";
  }

  // Helper function to count tokens by category
  const getCategoryCounts = (tokensMap: Map<string, { token: Token; quantity: number }>) => {
    let native = 0;
    let stable = 0;
    let meme = 0;
    let alt = 0;

    tokensMap.forEach(({ token, quantity }) => {
      const category = getCategory(token);
      switch (category) {
        case "Native":
          native += quantity;
          break;
        case "Stable":
          stable += quantity;
          break;
        case "Meme":
          meme += quantity;
          break;
        case "Alt":
          alt += quantity;
          break;
      }
    });

    return { native, stable, meme, alt };
  };

  // Handlers
  const toggleToken = (token: Token) => {
    setSelectedTokens((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(token.id);
      
      if (existing) {
        // Token already selected, increment quantity or remove
        if (existing.quantity >= 3) {
          // Already at max, show error
          setErrorMessage(`You can only select ${token.symbol} up to 3 times`);
          return prev;
        }
        
        // Check token category rules before adding more
        const category = getCategory(token);
        const currentCategoryCounts = getCategoryCounts(prev);
        
        if (category === "Native" && currentCategoryCounts.native >= 1) {
          setErrorMessage("You can only have 1 Native token in your portfolio");
          return prev;
        }
        
        if (category === "Stable" && currentCategoryCounts.stable >= 2) {
          setErrorMessage("You can only have 2 Stable tokens (total quantity) in your portfolio");
          return prev;
        }
        
        // Check if adding one more would exceed budget
        const tokenPrice = token.usdPrice || 0;
        const currentTotalValue = Array.from(prev.values()).reduce(
          (sum, { token: t, quantity: q }) => sum + (t.usdPrice || 0) * q,
          0
        );
        
        if (currentTotalValue + tokenPrice <= entryFee) {
          // Increment quantity
          newMap.set(token.id, { token, quantity: existing.quantity + 1 });
        } else {
          setErrorMessage("Not enough budget to add another of this token");
          return prev;
        }
      } else {
        // Token not selected yet, check category rules
        const category = getCategory(token);
        const currentCategoryCounts = getCategoryCounts(prev);
        
        if (category === "Native" && currentCategoryCounts.native >= 1) {
          setErrorMessage("You can only have 1 Native token in your portfolio");
          return prev;
        }
        
        if (category === "Stable" && currentCategoryCounts.stable >= 2) {
          setErrorMessage("You can only have 2 Stable tokens (total quantity) in your portfolio");
          return prev;
        }
        
        // Token not selected yet, add it with quantity 1
        const tokenPrice = token.usdPrice || 0;
        const currentTotalValue = Array.from(prev.values()).reduce(
          (sum, { token: t, quantity: q }) => sum + (t.usdPrice || 0) * q,
          0
        );
        
        if (currentTotalValue + tokenPrice <= entryFee) {
          newMap.set(token.id, { token, quantity: 1 });
        } else {
          setErrorMessage("Not enough budget to select this token");
          return prev;
        }
      }
      
      return newMap;
    });
  };

  // Remove one instance of a token (or remove completely if quantity is 1)
  const decrementToken = (tokenId: string) => {
    setSelectedTokens((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(tokenId);
      
      if (existing) {
        if (existing.quantity > 1) {
          // Decrement quantity
          newMap.set(tokenId, { token: existing.token, quantity: existing.quantity - 1 });
        } else {
          // Remove token completely
          newMap.delete(tokenId);
          // Clear power token if this was the power token
          if (tokenId === powerTokenId) {
            setPowerTokenId(null);
          }
        }
      }
      
      return newMap;
    });
  };

  // Toggle power token status
  const togglePowerToken = (tokenId: string) => {
    if (powerTokenId === tokenId) {
      // Remove power token status
      setPowerTokenId(null);
    } else {
      // Set as power token
      setPowerTokenId(tokenId);
    }
  };

  // Check if a token can be selected (won't exceed budget and follows category rules)
  const canSelectToken = (token: Token) => {
    const existing = selectedTokens.get(token.id);
    if (existing && existing.quantity >= 3) {
      return false; // Already at max quantity
    }
    
    // Check category rules
    const category = getCategory(token);
    const currentCategoryCounts = getCategoryCounts(selectedTokens);
    
    if (category === "Native" && currentCategoryCounts.native >= 1 && !existing) {
      return false; // Can't add another native token
    }
    
    if (category === "Stable" && currentCategoryCounts.stable >= 2 && !existing) {
      return false; // Can't add another stable token
    }
    
    if (category === "Stable" && existing && currentCategoryCounts.stable >= 2) {
      return false; // Can't increment stable token if already at 2
    }
    
    const tokenPrice = token.usdPrice || 0;
    return totalSelectedValue + tokenPrice <= entryFee;
  };

  const filteredTokens = tokenSearch
    ? currentTokens
    : currentTokens.filter(
        (token: Token) =>
          token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
          token.name.toLowerCase().includes(tokenSearch.toLowerCase())
      );

  const budgetUsed = entryFee > 0 ? (totalSelectedValue / entryFee) * 100 : 0;
  const MINIMUM_THRESHOLD = 50; // 50% of entry fee
  const canJoin = selectedTokens.size > 0 && budgetUsed >= MINIMUM_THRESHOLD; // Can join when 50% or more of entry fee is reached

  console.log("Contest Details:", contestDetails);
  

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 animate-slide-down">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          </div>
        )}

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
            Select tokens worth at least 50% of the entry fee to join
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
                <TabsTrigger value="all">All</TabsTrigger>
                {/* <TabsTrigger value={TokenCategory.NEW_LISTED}>
                  New Listed
                </TabsTrigger> */}
                <TabsTrigger value={TokenCategory.TOP_ORGANIC}>
                  Top Organic
                </TabsTrigger>
                <TabsTrigger value={TokenCategory.TOP_TRADED}>
                  Top Traded
                </TabsTrigger>
                <TabsTrigger value={TokenCategory.TRENDING}>
                  Trending
                </TabsTrigger>
              </TabsList>

              {/* All Tokens Tab */}
              <TabsContent value="all" className="space-y-4">
                {currentLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token: Token, i: number) => (
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
                            selected={selectedTokens.has(token.id)}
                            disabled={!canSelectToken(token)}
                            quantity={selectedTokens.get(token.id)?.quantity}
                            onToggle={() => toggleToken(token)}
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

              {/* New Listed Tab */}
              {/* <TabsContent value={TokenCategory.NEW_LISTED} className="space-y-4">
                {currentLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token: Token, i: number) => (
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
                            selected={selectedTokens.has(token.id)}
                            disabled={!canSelectToken(token)}
                            onToggle={() => toggleToken(token)}
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
              </TabsContent> */}

              {/* Top Organic Tab */}
              <TabsContent value={TokenCategory.TOP_ORGANIC} className="space-y-4">
                {currentLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token: Token, i: number) => (
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
                            selected={selectedTokens.has(token.id)}
                            disabled={!canSelectToken(token)}
                            quantity={selectedTokens.get(token.id)?.quantity}
                            onToggle={() => toggleToken(token)}
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
                {currentLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token: Token, i: number) => (
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
                            selected={selectedTokens.has(token.id)}
                            disabled={!canSelectToken(token)}
                            quantity={selectedTokens.get(token.id)?.quantity}
                            onToggle={() => toggleToken(token)}
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
              <TabsContent value={TokenCategory.TRENDING} className="space-y-4">
                {currentLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading tokens...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {filteredTokens.length > 0 ? (
                      filteredTokens.map((token: Token, i: number) => (
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
                            selected={selectedTokens.has(token.id)}
                            disabled={!canSelectToken(token)}
                            quantity={selectedTokens.get(token.id)?.quantity}
                            onToggle={() => toggleToken(token)}
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
                      {selectedTokens.size}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-bold text-foreground">
                      ${totalSelectedValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining Budget</span>
                    <span className={`font-bold ${remainingBudget < 0 ? 'text-destructive' : 'text-primary'}`}>
                      ${remainingBudget.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={budgetUsed} className="h-3" />
                  
                  {/* Budget threshold indicator */}
                  {budgetUsed >= MINIMUM_THRESHOLD && budgetUsed < 100 && (
                    <div className="text-xs text-success flex items-center gap-1">
                      <span>✓</span>
                      <span>Minimum threshold reached! You can join now.</span>
                    </div>
                  )}
                </div>

                {/* Category Breakdown */}
                {selectedTokens.size > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">Category Breakdown</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(() => {
                        const counts = getCategoryCounts(selectedTokens);
                        return (
                          <>
                            <div className="flex items-center justify-between rounded-md border border-orange-500/30 bg-orange-500/5 px-2 py-1">
                              <span className="text-orange-400">Native</span>
                              <span className={`font-bold ${counts.native > 1 ? 'text-destructive' : 'text-orange-400'}`}>
                                {counts.native}/1
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-blue-500/30 bg-blue-500/5 px-2 py-1">
                              <span className="text-blue-400">Stable</span>
                              <span className={`font-bold ${counts.stable > 2 ? 'text-destructive' : 'text-blue-400'}`}>
                                {counts.stable}/2
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-purple-500/30 bg-purple-500/5 px-2 py-1">
                              <span className="text-purple-400">Meme</span>
                              <span className="font-bold text-purple-400">{counts.meme}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-green-500/30 bg-green-500/5 px-2 py-1">
                              <span className="text-green-400">Alt</span>
                              <span className="font-bold text-green-400">{counts.alt}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Selected Tokens List */}
                {selectedTokens.size > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-foreground">Your Portfolio</div>
                      {powerTokenId && (
                        <div className="text-xs text-amber-400 flex items-center gap-1">
                          <span>⚡</span>
                          <span>2x P&L</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Power Token Info */}
                    {!powerTokenId && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
                        <span className="text-amber-400 text-sm">⚡</span>
                        <div className="text-xs text-amber-400/80">
                          Click ⚡ to set a Power Token - its P&L will be tracked at 2x during the contest!
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {Array.from(selectedTokens.values()).map(({ token, quantity }) => {
                        const isPowerToken = token.id === powerTokenId;
                        const tokenValue = (token.usdPrice || 0) * quantity;
                        
                        return (
                          <div
                            key={token.id}
                            className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                              isPowerToken 
                                ? 'border-amber-500/50 bg-amber-500/10' 
                                : 'border-border bg-secondary/30'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <button
                                onClick={() => togglePowerToken(token.id)}
                                className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                                  isPowerToken
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-secondary border border-border hover:border-amber-500/50 hover:bg-amber-500/10'
                                }`}
                                title={isPowerToken ? "Power Token (2x P&L tracking)" : "Set as Power Token (2x P&L tracking)"}
                              >
                                ⚡
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-foreground">
                                    {token.symbol}
                                  </div>
                                  {isPowerToken && (
                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                      POWER
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ${(token.usdPrice || 0).toFixed(4)} × {quantity}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`text-sm font-bold ${isPowerToken ? 'text-amber-400' : 'text-primary'}`}>
                                ${tokenValue.toFixed(2)}
                              </div>
                              <button
                                onClick={() => decrementToken(token.id)}
                                className="h-6 w-6 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 flex items-center justify-center transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Entry Fee */}
                {isContestLoading ? (
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-center py-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                  </div>
                ) : contestDetails ? (
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Entry Fee
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {(contestDetails.entryFee / Math.pow(10, contestDetails.decimals)).toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <div className="text-center text-sm text-destructive">
                      Failed to load contest details
                    </div>
                  </div>
                )}

                {/* Rules */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-foreground">Selection Rules</div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></div>
                      <span>You need to reach at least <span className="font-semibold text-primary">50% of the entry fee</span> to join</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0"></div>
                      <span>Select one <span className="font-semibold text-amber-400">Power Token (⚡)</span> - its P&L will be tracked at <span className="font-semibold text-amber-400">2x during the contest</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                      <span>Maximum <span className="font-semibold text-orange-400">1 Native</span> token (ETH, SOL, BNB, etc.)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                      <span>Maximum <span className="font-semibold text-blue-400">2 Stable</span> tokens total (USDT, USDC, DAI, etc.)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0"></div>
                      <span>Unlimited <span className="font-semibold text-purple-400">Meme</span> tokens (DOGE, SHIB, PEPE, etc.)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                      <span>Unlimited <span className="font-semibold text-green-400">Alt</span> tokens (other tokens)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0"></div>
                      <span>Each token can be selected up to <span className="font-semibold text-accent">3 times</span></span>
                    </div>
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
                      : selectedTokens.size === 0 
                      ? "Select Tokens"
                      : budgetUsed < MINIMUM_THRESHOLD
                      ? `Need ${MINIMUM_THRESHOLD - Math.round(budgetUsed)}% More (${((entryFee * MINIMUM_THRESHOLD / 100) - totalSelectedValue).toFixed(2)} USDT)`
                      : `Add $${Math.abs(remainingBudget).toFixed(2)} ${remainingBudget > 0 ? 'More' : 'Less'}`}
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