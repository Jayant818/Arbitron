"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSolana } from "@/components/solana-provider";

interface Contest {
  id: string;
  title: string;
  entryFee: number;
  decimals: number;
  currentPlayers: number;
  maxPlayers: number;
  duration: number;
  waitingTime: number;
  host: string;
}

export default function Home() {
  const router = useRouter();
  const { isConnected } = useSolana();
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContests() {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/all`);
        setContests(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContests();
  }, []);

  const heroVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-white text-zinc-700 font-geist-sans flex flex-col justify-between">
      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-white to-zinc-50">
  <div className="container mx-auto px-6 text-center max-w-3xl">
    <motion.h1
      variants={heroVariants}
      initial="hidden"
      animate="visible"
      className="text-5xl md:text-6xl font-extrabold leading-tight"
    >
      Welcome to{" "}
      <span className="bg-gradient-to-r from-[#cc2229] to-[#ff5b61] bg-clip-text text-transparent">
        Arbitron
      </span>
    </motion.h1>

    <motion.p
      variants={heroVariants}
      initial="hidden"
      animate="visible"
      className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto"
    >
      Build, compete, and conquer in the crypto-arena. Precision, timing, and strategy win the game.
    </motion.p>

    <motion.div
      variants={heroVariants}
      initial="hidden"
      animate="visible"
      className="mt-8 flex flex-wrap justify-center gap-4"
    >
      <Button
        size="lg"
        className="bg-[#cc2229] hover:bg-[#b31d23] text-white font-semibold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all"
        onClick={() => router.push(isConnected ? "/deck" : "/connect")}
      >
        {isConnected ? "Build Deck" : "Connect Wallet"}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-[#cc2229] text-[#cc2229] hover:bg-[#cc2229]/10 font-semibold rounded-full px-6 py-3"
        onClick={() => router.push("/contests")}
      >
        Join Arena
      </Button>
    </motion.div>
  </div>
</section>

    {/* Contests */}
    <section className="container mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold mb-8 text-[#cc2229] text-center">Active Arenas</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : contests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map((contest) => {
              const entryFee = contest.entryFee / Math.pow(10, contest.decimals);
              const prizePool = entryFee * contest.maxPlayers;

              return (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-white border border-zinc-200 hover:shadow-xl transition-all duration-300 rounded-2xl">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">{contest.title}</CardTitle>
                        <Badge className="bg-[#cc2229] text-white rounded-full">Live</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between text-zinc-500">
                          <span>Entry</span>
                          <span className="text-[#cc2229] font-medium">${entryFee}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                          <span>Prize</span>
                          <span className="text-[#cc2229] font-medium">${prizePool}</span>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="w-full">
                              <div className="flex justify-between items-center text-zinc-500">
                                <span>Starts In</span>
                                <span className="flex items-center gap-1 text-[#cc2229]">
                                  <Clock size={14} />
                                  Soon
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Contest starts soon</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        className="mt-4 w-full bg-[#cc2229] hover:bg-[#b31d23] text-white rounded-full"
                        onClick={() => router.push(`/contest/${contest.id}`)}
                      >
                        Join
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500 text-center">No active arenas yet. Check back soon!</p>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-10 mt-16">
        <div className="container mx-auto px-6 text-center text-zinc-500 text-sm">
          <p>&copy; 2025 Arbitron</p>
          <div className="mt-3 flex justify-center gap-6">
            <a href="#" className="text-[#cc2229] hover:underline">
              X (Twitter)
            </a>
            <a href="#" className="text-[#cc2229] hover:underline">
              Terms
            </a>
            <a href="#" className="text-[#cc2229] hover:underline">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
