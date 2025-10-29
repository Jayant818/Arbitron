"use client"

import { Navbar } from "@/components/navbar"
import { ContestCard } from "@/components/contest-card"
import { ContestCardSkeleton } from "@/components/contest-card-skeleton"
import { Button } from "@/components/ui/button"
import { TrendingUp, Zap, Shield, Trophy, Sparkles } from "lucide-react"
import { useGetAllContestsQuery } from "@/hooks/api-hooks/useContestQuery"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function HomePage() {

  const { data: contests, isLoading: isLoadingContests } = useGetAllContestsQuery();

  const router = useRouter();

  const handleBrowseContestsClick = () => {
    router.push("/contests");
  }

  const handleHowItWorksClick = () => {
    const bentoSection = document.getElementById("how-it-works");
    if (bentoSection) {
      bentoSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden pt-52 pb-32 ">

          <div className="mx-auto max-w-7xl text-center  animate-slide-up flex flex-col gap-8 items-center">
            <div className="inline-flex items-center gap-2 rounded-full glass border-primary/30 px-4 py-2 text-sm font-medium text-primary w-fit">
              <Sparkles className="h-4 w-4 animate-pulse" />
              No real trading • Pure skill competition
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-balance text-white">
              Compete in <span className="gradient-text animate-gradient-shift">Lightning Fast</span> Trading Contests
            </h1>

            <p className="text-xl text-card-foreground leading-relaxed max-w-2xl mx-auto text-balance">
              Test your trading strategy in short-duration contests. Draft your portfolio, compete against others, and
              win prizes on Solana.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
              size="lg"
              onClick={handleBrowseContestsClick}
                className="group relative overflow-hidden cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth px-8 py-6 text-lg font-semibold "
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Browse Contests
                </span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleHowItWorksClick}
                className="glass glass-hover cursor-pointer transition-smooth px-8 py-6 text-lg font-semibold text-white bg-transparent"
              >
                How It Works
              </Button>
            </div>
          </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Active & Upcoming Contests</h2>
            <p className="text-lg text-card-foreground">Join a contest and start competing</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {!isLoadingContests && contests && contests.length > 0 ? (
              contests.slice(0, 6).map((contest, i) => (
                <div key={contest.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <ContestCard {...contest} />
                </div>
              ))
            ) : isLoadingContests ? (
              [...Array(6)].map((_, i) => (
                <ContestCardSkeleton key={i} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No contests found</p>
              </div>
            )}
          </div>

        </div>
      </section>

      <section id="how-it-works" className="py-24 px-4 md:px-8 lg:px-32 scroll-mt-20">
        <div className="container mx-auto">
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
            {/* Row 1: Problem & Vision */}
            {/* Problem Card */}
            <div className="group glass glass-hover rounded-xl p-8 animate-slide-up flex flex-col justify-between h-full">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 mb-4">
                  <Shield className="h-3 w-3" />
                  The Problem
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Trading Shouldn't Feel Like Gambling
                </h3>
                <p className="text-base text-card-foreground leading-relaxed">
                  Crypto trading is intimidating, risky, and emotion-driven, causing most users to disengage. 
                  <span className="text-white font-semibold"> Arbitron makes trading fun, fair, and skill-based</span> — 
                  no liquidation risk, no gambling, just strategy and competition.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-primary rounded-full" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Zero Real Risk</span>
              </div>
            </div>

            {/* Vision Card */}
            <div className="group glass glass-hover rounded-xl p-8 animate-slide-up flex flex-col justify-between h-full" style={{ animationDelay: '100ms' }}>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary mb-4">
                  <Sparkles className="h-3 w-3" />
                  Our Vision
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  The Fantasy Trading Arena of Web3
                </h3>
                <p className="text-base text-card-foreground leading-relaxed">
                  Arbitron aims to become the fantasy trading arena of Web3, expanding into leagues, tournaments, and social leaderboards. 
                  Our goal is to build a <span className="text-white font-semibold">global, transparent, and skill-driven trading ecosystem</span> — powered by Solana.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Built on Solana</span>
              </div>
            </div>

            {/* Row 2: Core Features - 3 Cards */}
            <div className="glass glass-hover rounded-xl p-6 animate-slide-up group" style={{ animationDelay: '200ms' }}>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Fantasy Portfolio Drafting</h4>
              <p className="text-sm text-card-foreground leading-relaxed">
                Pick tokens strategically under budget and category constraints. Test your market knowledge and build the perfect portfolio.
              </p>
            </div>

            <div className="glass glass-hover rounded-xl p-6 animate-slide-up group" style={{ animationDelay: '250ms' }}>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Fast <span className="font-mono">10</span>-Minute Rounds
              </h4>
              <p className="text-sm text-card-foreground leading-relaxed">
                Quick, engaging gameplay loops with power token mechanics. Double the volatility, double the risk/reward.
              </p>
            </div>

            <div className="glass glass-hover rounded-xl p-6 animate-slide-up group" style={{ animationDelay: '300ms' }}>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                <Trophy className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Live Leaderboard</h4>
              <p className="text-sm text-card-foreground leading-relaxed">
                Real-time rankings and P&L tracking. Watch your position change as the market moves and compete for the top spot.
              </p>
            </div>

            {/* Row 3: NFT Rewards - Full Width */}
            <div className="md:col-span-2 glass glass-hover rounded-xl p-8 animate-slide-up group bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/30" style={{ animationDelay: '350ms' }}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary mb-3">
                    <Trophy className="h-3 w-3" />
                    Collectible Rewards
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold text-white mb-3">NFT Proof-of-Skill Badges & On-Chain Fairness</h4>
                  <p className="text-base text-card-foreground leading-relaxed">
                    Winners earn collectible NFTs that serve as permanent proof of their trading skills. 
                    All results verified through Solana smart contracts and Pyth oracle data. Build your trophy case on-chain.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary to-secondary opacity-80 group-hover:opacity-100 transition-smooth group-hover:scale-110 transform border border-primary/30" />
                  <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-secondary to-primary opacity-60 group-hover:opacity-80 transition-smooth group-hover:scale-105 transform border border-primary/30" />
                  <div className="hidden md:block h-20 w-20 rounded-xl bg-gradient-to-br from-primary/50 to-secondary/50 opacity-40 group-hover:opacity-60 transition-smooth border border-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-xl mt-10">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-white uppercase leading-tight border-dashed border-2 border-[#a99145] p-2">Arbitron</span>
              </div>
              <p className="text-card-foreground text-sm leading-relaxed max-w-md">
                The fantasy trading arena of Web3. Compete in skill-based trading contests with zero real risk. 
                Built on Solana for speed and transparency.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Powered by Solana</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contests" className="text-card-foreground hover:text-primary transition-smooth text-sm">
                    Browse Contests
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="text-card-foreground hover:text-primary transition-smooth text-sm">
                    Create Contest
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-card-foreground hover:text-primary transition-smooth text-sm">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-card-foreground hover:text-primary transition-smooth text-sm">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-card-foreground hover:text-primary transition-smooth text-sm">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-card-foreground hover:text-primary transition-smooth text-sm">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
         
        </div>
      </footer>

    
    </div>
  )
}
