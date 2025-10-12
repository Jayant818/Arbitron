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
  const [selectedTokens, setSelectedTokens] = useState<Map<string, Token>>(new Map());
  const [tokenSearch, setTokenSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
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

  // Calculate total value of selected tokens
  const totalSelectedValue = Array.from(selectedTokens.values()).reduce(
    (sum, token) => sum + (token.usdPrice || 0),
    0
  );

  // Calculate remaining budget
  const remainingBudget = entryFee - totalSelectedValue;

  // Handlers
  const toggleToken = (token: Token) => {
    setSelectedTokens((prev) => {
      const newMap = new Map(prev);
      
      if (newMap.has(token.id)) {
        // Remove token if already selected
        newMap.delete(token.id);
      } else {
        // Check if adding this token would exceed the budget
        const tokenPrice = token.usdPrice || 0;
        if (totalSelectedValue + tokenPrice <= entryFee) {
          newMap.set(token.id, token);
        }
      }
      
      return newMap;
    });
  };

  // Check if a token can be selected (not already selected and won't exceed budget)
  const canSelectToken = (token: Token) => {
    if (selectedTokens.has(token.id)) {
      return true; // Already selected, can be deselected
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
  const canJoin = selectedTokens.size > 0 && Math.abs(totalSelectedValue - entryFee) < 0.01; // Allow small floating point differences

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

  console.log("Contest Details:", contestDetails);
  

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
            Select tokens worth exactly the entry fee
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
                </div>

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
                <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-foreground leading-relaxed">
                    Select tokens whose total value equals the entry fee. Your portfolio performance
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
                      : selectedTokens.size === 0 
                      ? "Select Tokens"
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