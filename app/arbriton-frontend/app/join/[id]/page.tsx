"use client";

import { TokenCard } from "@/components/token-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  Search,
  Ban,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSolana } from "@/components/solana-provider";
import { useRouter } from "next/navigation";
import {
  useGetAllTokenQuery,
  useGetTokensByCategoryQuery,
} from "@/hooks/api-hooks/useTokensQuery";
import { Token, TokenCategory } from "@/api-functions/allTokens.api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { fetchJupiterSearch } from "@/api-functions/allTokens.api";
import { useGetContestByIdQuery } from "@/hooks/api-hooks/useContestQuery";
import { useParams } from "next/navigation";
import {
  ARBITRON_PROGRAM_ADDRESS,
} from "../../../../../dist/js-client/programs";
import {
  JoinContestAsyncInput,
  getJoinContestInstructionAsync,
} from "../../../../../dist/js-client/instructions/joinContest";
import {
  CreatePortfolioAsyncInput,
  getCreatePortfolioInstructionAsync,
} from "../../../../../dist/js-client/instructions/createPortfolio";
import {
  fetchMaybeParticipent,
} from "../../../../../dist/js-client/accounts/participent";
import {
  fetchMaybeContest,
} from "../../../../../dist/js-client/accounts/contest";
import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  setTransactionMessageFeePayerSigner,
  appendTransactionMessageInstructions,
  assertIsTransactionMessageWithinSizeLimit,
  signAndSendTransactionMessageWithSigners,
  getBase58Decoder,
} from "@solana/kit";
import {
  useWalletAccountMessageSigner,
  useWalletAccountTransactionSendingSigner,
  useWalletAccountTransactionSigner,
} from "@solana/react";
import { USDC_MINT_ADDRESS } from "@/app/create/page";
import {
  InitializeInput,
  getInitializeInstruction,
} from "../../../../../dist/js-client/index";
// import { findAssociatedTokenPda, TOKEN_2022_PROGRAM_ADDRESS } from "@solana-program/token-2022"
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import {
  SYSTEM_PROGRAM_ADDRESS,
} from "@solana-program/system";
import { useCreateParticipantMutation } from "@/hooks/api-hooks/useUserQuery";

export interface ISelectedToken {
  mint: string;
  quantity: number;
  isPowerToken: boolean;
  entry_price: number;
}

export default function Page() {
  const { isConnected, selectedAccount } = useSolana();

  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Wallet Not Connected
          </h2>
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
  const [selectedTokens, setSelectedTokens] = useState<
    Map<string, { token: Token; quantity: number }>
  >(new Map());
  const [powerTokenId, setPowerTokenId] = useState<string | null>(null);
  const [tokenSearch, setTokenSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isJoining, setIsJoining] = useState(false);
  const { id } = useParams();
  const { selectedAccount, chain, rpc } = useSolana();
  const router = useRouter();

  const { mutate: createParticipant } = useCreateParticipantMutation({
    customConfig: {
      onSuccess: (data) => {
        console.log("Participant created successfully:", data);
        // router.push(`/lobby/${id}`);
      },
    },
  });

  // console.log("Selected Wallet and Selected Account", selectedAccount, selectedWallet);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(tokenSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [tokenSearch]);

  const ContestState = {
    UPCOMING: 0,
    ONGOING: 1,
    COMPLETED: 2,
  };


  useEffect(() => {
    async function checkIfUserJoinedContest() {
      try {
        if (!selectedAccount?.address) {
          alert("Connect Your Wallet");
          return;
        }

        const participentInfoSeed = [
          new TextEncoder().encode("participent"),
          getAddressEncoder().encode(address(id as string)),
          getAddressEncoder().encode(address(selectedAccount?.address)),
        ];

        const [participentPDA] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ADDRESS,
          seeds: participentInfoSeed,
        });

        const participentInfo = await fetchMaybeParticipent(
          rpc,
          participentPDA
        );

        console.log("Participants Info", participentInfo);

        if (participentInfo.exists) {
          // User has already joined this contest - redirect to contest lobby
          console.log("✅ User already joined this contest:", participentInfo.data);
          console.log("📊 Score:", participentInfo.data.score, "| Rank:", participentInfo.data.rank);
          router.push(`/lobby/${id}`);
      } else {
          // User hasn't joined yet - let them proceed to join page
          console.log("ℹ️ User hasn't joined this contest yet. Showing join page.");
      }



        // console.log("✅ User is authorized participant");

        // // 2. Check contest status
        // const contestInfo = await fetchMaybeContest(rpc, address(id as string));

        // if (contestInfo.exists) {
        //   const status = contestInfo.data.status;
        //   console.log("📊 Contest status:", status);

        //   // ContestState enum: 0 = Upcoming, 1 = Ongoing, 2 = Completed
        //   if (status === ContestState.ONGOING) {
        //     // Ongoing
        //     // Contest is active - redirect to arena
        //     console.log("🎮 Contest is ongoing - redirecting to arena");
        //     router.push(`/contest/${id}`);
        //     return;
        //   } else if (status === ContestState.COMPLETED) {

        //   } 
        // }

      } catch (error) {
        console.log("ℹ️ User hasn't joined this contest. Ready to join.");
        console.debug("Error details:", error);
      } 
    }

    checkIfUserJoinedContest();
  }, [rpc,id, selectedAccount?.address,router]);

  // fetching all categories (React Query will cache them)
  const { data: allTokens, isLoading: loadingAll } = useGetAllTokenQuery();

  const { data: contestDetails, isLoading: isContestLoading } =
    useGetContestByIdQuery({
      id: id as string,
      customConfig: {
        enabled: !!id,
      },
    });

  // const {
  //   data: newListedTokens,
  //   isLoading: loadingNewListed,
  // } = useGetTokensByCategoryQuery(TokenCategory.NEW_LISTED);

  const { data: topOrganicTokens, isLoading: loadingTopOrganic } =
    useGetTokensByCategoryQuery(TokenCategory.TOP_ORGANIC);

  const { data: topTradedTokens, isLoading: loadingTopTraded } =
    useGetTokensByCategoryQuery(TokenCategory.TOP_TRADED);

  const { data: trendingTokens, isLoading: loadingTrending } =
    useGetTokensByCategoryQuery(TokenCategory.TRENDING);

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

  const currentTokens = tokenSearch ? searchTokens || [] : tabTokens;
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
      symbol.includes("usdt") ||
      symbol.includes("usdc") ||
      symbol.includes("dai") ||
      symbol.includes("busd") ||
      symbol.includes("usd") ||
      symbol.includes("pyusd") ||
      symbol.includes("usde") ||
      symbol.includes("frax") ||
      symbol.includes("tusd") ||
      symbol.includes("pax") ||
      symbol.includes("lusd") ||
      symbol.includes("eurs") ||
      symbol.includes("usdd") ||
      symbol.includes("gusd") ||
      symbol.includes("fdusd")
    ) {
      return "Stable";
    }

    // Memecoins
    if (
      symbol.includes("doge") ||
      symbol.includes("shib") ||
      symbol.includes("pepe") ||
      symbol.includes("bonk") ||
      symbol.includes("floki") ||
      symbol.includes("elon") ||
      symbol.includes("wif") ||
      symbol.includes("popcat") ||
      symbol.includes("michi") ||
      symbol.includes("mog") ||
      symbol.includes("trump") ||
      symbol.includes("maga") ||
      symbol.includes("boden") ||
      symbol.includes("harris") ||
      symbol.includes("pump") ||
      name.includes("inu") ||
      name.includes("moon") ||
      name.includes("safe") ||
      name.includes("cat") ||
      name.includes("dog") ||
      name.includes("frog") ||
      name.includes("wifhat") ||
      name.includes("retardio") ||
      name.includes("neiro") ||
      name.includes("billy") ||
      name.includes("mew") ||
      name.includes("goat")
    ) {
      return "Meme";
    }

    // Native blockchain tokens
    if (
      symbol === "eth" ||
      symbol === "sol" ||
      symbol === "bnb" ||
      symbol === "matic" ||
      symbol === "avax" ||
      symbol === "dot" ||
      symbol === "ftm" ||
      symbol === "near" ||
      symbol === "atom" ||
      symbol === "ada" ||
      symbol === "xlm" ||
      symbol === "algo"
    ) {
      return "Native";
    }

    // Everything else
    return "Alt";
  }

  // Helper function to count tokens by category
  const getCategoryCounts = (
    tokensMap: Map<string, { token: Token; quantity: number }>
  ) => {
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
          setErrorMessage(
            "You can only have 2 Stable tokens (total quantity) in your portfolio"
          );
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
          setErrorMessage(
            "You can only have 2 Stable tokens (total quantity) in your portfolio"
          );
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
          newMap.set(tokenId, {
            token: existing.token,
            quantity: existing.quantity - 1,
          });
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

    if (
      category === "Native" &&
      currentCategoryCounts.native >= 1 &&
      !existing
    ) {
      return false; // Can't add another native token
    }

    if (
      category === "Stable" &&
      currentCategoryCounts.stable >= 2 &&
      !existing
    ) {
      return false; // Can't add another stable token
    }

    if (
      category === "Stable" &&
      existing &&
      currentCategoryCounts.stable >= 2
    ) {
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
  const MINIMUM_THRESHOLD = 10; // 50% of entry fee

  // Check if contest can be joined (must be in UPCOMING state)
  const isContestJoinable = contestDetails?.status === ContestState.UPCOMING;
  const canJoin =
    isContestJoinable &&
    selectedTokens.size > 0 &&
    budgetUsed >= MINIMUM_THRESHOLD &&
    powerTokenId !== null; // Can join when contest is UPCOMING, budget threshold met, and power token selected

  // console.log("Contest Details:", contestDetails);

  const signer = useWalletAccountTransactionSendingSigner(
    selectedAccount!,
    chain
  );

  // const handleInit = () => {

  //   const configSeed = [
  //     new TextEncoder().encode("config")
  //   ]

  //   const [configPda] = getProgramDerivedAddress({
  //     programAddress: ARBITRON_PROGRAM_ADDRESS,
  //     seeds:configSeed
  //   })

  //   const Ix: InitializeInput = {
  //     admin: signer,
  //     config: address(configPda),
  //     platformFeeWallet: address()
  //   }
  // }

  const handleJoinContest = async () => {
    if (isJoining) {
      console.log("🔵 Already joining, ignoring click");
      return;
    }
    setIsJoining(true);
    setErrorMessage(""); 

    try {
      console.log("Attempting to join contest with ID:", id);

      if (!signer || !selectedAccount) {
        throw new Error("Wallet not connected properly");
      }
      if (selectedTokens.size === 0) {
        throw new Error("You must select at least one token.");
      }
      if (!powerTokenId) {
        throw new Error("You must select a Power Token (⚡) for your portfolio.");
      }
      if (!contestDetails?.host) {
        throw new Error("Invalid contest details");
      }

      const contestId = id as string;
      const host = address(contestDetails.host);

      console.log("🛠️ Preparing accounts and data...");

      const [playerGlobalProfile] = await getProgramDerivedAddress({
        programAddress: address(ARBITRON_PROGRAM_ADDRESS),
        seeds: [
          new TextEncoder().encode("player"),
          getAddressEncoder().encode(address(selectedAccount.address)),
        ],
      });

      const [participantPortfolio] = await getProgramDerivedAddress({
        programAddress: address(ARBITRON_PROGRAM_ADDRESS),
        seeds: [
          new TextEncoder().encode("portfolio"),
          getAddressEncoder().encode(address(selectedAccount.address)),
          getAddressEncoder().encode(address(contestId)),
        ],
      });
      
      const [participentInfo] = await getProgramDerivedAddress({
        programAddress: address(ARBITRON_PROGRAM_ADDRESS),
        seeds: [
            new TextEncoder().encode("participent"),
            getAddressEncoder().encode(address(contestId)),
            getAddressEncoder().encode(address(selectedAccount.address)),
        ],
      });

      const [prizePoolVault] = await getProgramDerivedAddress({
        programAddress: address(ARBITRON_PROGRAM_ADDRESS),
        seeds: [
          new TextEncoder().encode("prize_pool_usdt"),
          getAddressEncoder().encode(address(contestId)),
        ],
      });
      
      const [userAta] = await findAssociatedTokenPda({
        mint: address(USDC_MINT_ADDRESS),
        owner: address(selectedAccount.address),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });


      console.log("Selected Tokens:", selectedTokens);

      const minimalTokensForChain = Array.from(selectedTokens.values()).map(
        ({ token, quantity }) => ({
          mint: address(token.id),
          isPowerToken: token.id === powerTokenId,
          quantity: quantity,
          entryPrice: token.usdPrice
        })
      );

      console.log("🚀 Building instructions...");

      // Instruction 1: Create Portfolio
      const createPortfolioInput: CreatePortfolioAsyncInput = {
        user: signer,
        host: host,
        contest: address(contestId),
        participantPortfolio: participantPortfolio,
        tokenSelected: minimalTokensForChain,
      };
      const createPortfolioIx = await getCreatePortfolioInstructionAsync(createPortfolioInput);

      // Instruction 2: Join Contest
      const joinContestInput: JoinContestAsyncInput = {
        participent: signer,
        contest: address(contestId),
        host: host,
        tokenMint: USDC_MINT_ADDRESS,
        userAta: userAta,
        prizePoolVault: prizePoolVault,
        playerGlobalProfile: playerGlobalProfile,
        participentInfo: participentInfo,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
        portfolio: participantPortfolio,
      };
      const joinContestIx = await getJoinContestInstructionAsync(joinContestInput);

      // 4. ==================== BUILD & SEND TRANSACTION ====================
      console.log("📦 Building and sending single transaction...");
      
      const { value: blockhash } = await rpc.getLatestBlockhash().send();

      const tx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
        // Add both instructions to the same transaction
        (tx) => appendTransactionMessageInstructions([createPortfolioIx, joinContestIx], tx)
      );

      assertIsTransactionMessageWithinSizeLimit(tx);

      const signatureBytes = await signAndSendTransactionMessageWithSigners(tx);
      const signature = getBase58Decoder().decode(signatureBytes);

      console.log("✅ Contest joined successfully! Signature:", signature.toString());

      // 5. ==================== POST-TRANSACTION ACTIONS ====================
      // Convert tokens to API format (Address -> string)
      const tokensForAPI = minimalTokensForChain.map(token => ({
        mint: token.mint.toString(),
        quantity: token.quantity,
        isPowerToken: token.isPowerToken,
        entryPrice: token.entryPrice
      }));

      await createParticipant({
        contestId: contestId,
        userPublickey: selectedAccount.address.toString(),
        tokens: tokensForAPI,
      });

      router.push(`/lobby/${contestId}`);

    } catch (error: unknown) {
      console.error("❌ Join Contest Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while joining.";
      setErrorMessage(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Contest Status Banners */}
        {contestDetails && contestDetails.status === ContestState.COMPLETED && (
          <div className="mb-4 rounded-lg border border-muted-foreground/50 bg-muted/30 p-4 animate-slide-down">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5" />
              <div>
                <span className="font-semibold">This Contest Has Ended</span>
                <p className="text-sm">
                  This contest is completed. Check the results page to see the
                  winners!
                </p>
              </div>
            </div>
          </div>
        )}

        {contestDetails && contestDetails.status === ContestState.ONGOING && (
          <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 animate-slide-down">
            <div className="flex items-center gap-2 text-amber-500">
              <Ban className="h-5 w-5" />
              <div>
                <span className="font-semibold">
                  Contest is Currently Ongoing
                </span>
                <p className="text-sm">
                  You cannot join this contest as it has already started. Wait
                  for it to complete or join another contest!
                </p>
              </div>
            </div>
          </div>
        )}

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
                disabled={!isContestJoinable}
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
                            disabled={
                              !canSelectToken(token) || !isContestJoinable
                            }
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
                            disabled={!canSelectToken(token) || !isContestJoinable}
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
              <TabsContent
                value={TokenCategory.TOP_ORGANIC}
                className="space-y-4"
              >
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
                            disabled={
                              !canSelectToken(token) || !isContestJoinable
                            }
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
              <TabsContent
                value={TokenCategory.TOP_TRADED}
                className="space-y-4"
              >
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
                            disabled={
                              !canSelectToken(token) || !isContestJoinable
                            }
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
                            disabled={
                              !canSelectToken(token) || !isContestJoinable
                            }
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
                    <span className="text-muted-foreground">
                      Tokens Selected
                    </span>
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
                    <span className="text-muted-foreground">
                      Remaining Budget
                    </span>
                    <span
                      className={`font-bold ${
                        remainingBudget < 0
                          ? "text-destructive"
                          : "text-primary"
                      }`}
                    >
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
                    <div className="text-sm font-semibold text-foreground">
                      Category Breakdown
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(() => {
                        const counts = getCategoryCounts(selectedTokens);
                        return (
                          <>
                            <div className="flex items-center justify-between rounded-md border border-orange-500/30 bg-orange-500/5 px-2 py-1">
                              <span className="text-orange-400">Native</span>
                              <span
                                className={`font-bold ${
                                  counts.native > 1
                                    ? "text-destructive"
                                    : "text-orange-400"
                                }`}
                              >
                                {counts.native}/1
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-blue-500/30 bg-blue-500/5 px-2 py-1">
                              <span className="text-blue-400">Stable</span>
                              <span
                                className={`font-bold ${
                                  counts.stable > 2
                                    ? "text-destructive"
                                    : "text-blue-400"
                                }`}
                              >
                                {counts.stable}/2
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-purple-500/30 bg-purple-500/5 px-2 py-1">
                              <span className="text-purple-400">Meme</span>
                              <span className="font-bold text-purple-400">
                                {counts.meme}
                              </span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border border-green-500/30 bg-green-500/5 px-2 py-1">
                              <span className="text-green-400">Alt</span>
                              <span className="font-bold text-green-400">
                                {counts.alt}
                              </span>
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
                      <div className="text-sm font-semibold text-foreground">
                        Your Portfolio
                      </div>
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
                          Click ⚡ to set a Power Token - its P&L will be
                          tracked at{" "}
                          <span className="font-semibold text-amber-400">
                            2x during the contest
                          </span>
                          !
                        </div>
                      </div>
                    )}

                    {/* Warning when budget threshold met but no power token */}
                    {!powerTokenId && budgetUsed >= MINIMUM_THRESHOLD && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-500 bg-amber-500/20 p-3 animate-pulse">
                        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-amber-400">
                            Power Token Required!
                          </div>
                          <div className="text-xs text-amber-400/90 mt-1">
                            You must select a Power Token (⚡) before joining the contest.
                            Click the ⚡ button next to any token below.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {Array.from(selectedTokens.values()).map(
                        ({ token, quantity }) => {
                          const isPowerToken = token.id === powerTokenId;
                          const tokenValue = (token.usdPrice || 0) * quantity;

                          return (
                            <div
                              key={token.id}
                              className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                                isPowerToken
                                  ? "border-amber-500/50 bg-amber-500/10"
                                  : "border-border bg-secondary/30"
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  onClick={() => togglePowerToken(token.id)}
                                  className={`h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                                    isPowerToken
                                      ? "bg-amber-500 text-white"
                                      : "bg-secondary border border-border hover:border-amber-500/50 hover:bg-amber-500/10"
                                  }`}
                                  title={
                                    isPowerToken
                                      ? "Power Token (2x P&L tracking)"
                                      : "Set as Power Token (2x P&L tracking)"
                                  }
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
                                    ${(token.usdPrice || 0).toFixed(4)} ×{" "}
                                    {quantity}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`text-sm font-bold ${
                                    isPowerToken
                                      ? "text-amber-400"
                                      : "text-primary"
                                  }`}
                                >
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
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Entry Fee */}
                {isContestLoading ? (
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-center py-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading...
                      </span>
                    </div>
                  </div>
                ) : contestDetails ? (
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Entry Fee
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {(
                          contestDetails.entryFee /
                          Math.pow(10, contestDetails.decimals)
                        ).toFixed(2)}{" "}
                        USDT
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
                  <div className="text-sm font-semibold text-foreground">
                    Selection Rules
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></div>
                      <span>
                        You need to reach at least{" "}
                        <span className="font-semibold text-primary">
                          50% of the entry fee
                        </span>{" "}
                        to join
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0"></div>
                      <span>
                        Select one{" "}
                        <span className="font-semibold text-amber-400">
                          Power Token (⚡)
                        </span>{" "}
                        - its P&L will be tracked at{" "}
                        <span className="font-semibold text-amber-400">
                          2x during the contest
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                      <span>
                        Maximum{" "}
                        <span className="font-semibold text-orange-400">
                          1 Native
                        </span>{" "}
                        token (ETH, SOL, BNB, etc.)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                      <span>
                        Maximum{" "}
                        <span className="font-semibold text-blue-400">
                          2 Stable
                        </span>{" "}
                        tokens total (USDT, USDC, DAI, etc.)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0"></div>
                      <span>
                        Unlimited{" "}
                        <span className="font-semibold text-purple-400">
                          Meme
                        </span>{" "}
                        tokens (DOGE, SHIB, PEPE, etc.)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                      <span>
                        Unlimited{" "}
                        <span className="font-semibold text-green-400">
                          Alt
                        </span>{" "}
                        tokens (other tokens)
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0"></div>
                      <span>
                        Each token can be selected up to{" "}
                        <span className="font-semibold text-accent">
                          3 times
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                {/* Join Button */}
                <Button
                  disabled={!canJoin || isJoining}
                  onClick={(e: any) => {
                    handleJoinContest();
                  }}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isJoining ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                        <span>Joining Contest...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        {!isContestJoinable
                          ? contestDetails?.status === ContestState.COMPLETED
                            ? "Contest Completed"
                            : "Contest Ongoing"
                          : canJoin
                          ? "Join Contest"
                          : selectedTokens.size === 0
                          ? "Select Tokens"
                          : !powerTokenId
                          ? "Select Power Token ⚡"
                          : budgetUsed < MINIMUM_THRESHOLD
                          ? `Need ${
                              MINIMUM_THRESHOLD - Math.round(budgetUsed)
                            }% More (${(
                              (entryFee * MINIMUM_THRESHOLD) / 100 -
                              totalSelectedValue
                            ).toFixed(2)} USDT)`
                          : `Add $${Math.abs(remainingBudget).toFixed(2)} ${
                              remainingBudget > 0 ? "More" : "Less"
                            }`}
                      </>
                    )}
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
