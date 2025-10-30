"use client"

import { Navbar } from "@/components/navbar"
import { ContestCard } from "@/components/contest-card"
import { ContestCardSkeleton } from "@/components/contest-card-skeleton"
import { Button } from "@/components/ui/button"
import { TrendingUp, Zap, Shield, Trophy, Sparkles, Lock, Eye, CheckCircle } from "lucide-react"
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

      <section className="relative overflow-hidden pt-32 md:pt-52 pb-24 md:pb-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center animate-slide-up flex flex-col gap-8 md:gap-12 items-center">
            <div className="inline-flex items-center gap-2 rounded-full glass border-primary/30 px-4 py-2 text-sm font-medium text-primary w-fit">
              <Sparkles className="h-4 w-4 animate-pulse" />
              No real trading • Pure skill competition
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold  text-balance text-white max-w-6xl">
              Compete in <span className="gradient-text animate-gradient-shift">Lightning Fast</span> Trading Contests
            </h1>

            <p className="text-xl md:text-2xl text-card-foreground leading-relaxed max-w-4xl mx-auto text-balance">
              Test your trading strategy in short-duration contests. Draft your portfolio, compete against others, and
              win prizes on Solana.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
              <Button
              size="lg"
              onClick={handleBrowseContestsClick}
                className="group relative overflow-hidden cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth px-10 py-7 text-lg font-semibold"
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
                className="glass glass-hover cursor-pointer transition-smooth px-10 py-7 text-lg font-semibold text-white bg-transparent"
              >
                How It Works
              </Button>
            </div>
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

      <section id="how-it-works" className="py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-2 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              The Future of <span className="gradient-text">Trading Competition</span>
            </h2>
            <p className="text-xl text-card-foreground max-w-3xl mx-auto">
              Experience skill-based trading without the risk. Compete, learn, and win in our revolutionary platform.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
            
            {/* Growth Analytics Card - Top Left */}
            <div className="md:col-span-2 lg:col-span-2 glass glass-hover rounded-2xl p-6 group relative overflow-hidden animate-slide-up bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full " />
                  <span className="text-white text-sm font-medium">Growth</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Live Analytics</h3>
                <p className="text-sm text-card-foreground mb-6">Real-time P&L tracking with advanced metrics</p>
                
                {/* Mock Chart */}
                <div className="flex items-end gap-1 h-16 mb-2">
                  {[40, 60, 30, 80, 95, 70, 85, 100, 75, 90].map((height, i) => (
                    <div 
                      key={i}
                      className="bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-sm flex-1 opacity-80 group-hover:opacity-100 transition-all duration-300"
                      style={{ 
                        height: `${height}%`,
                        animationDelay: `${i * 100}ms`
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Nov 20</span>
                  <span>Nov 30</span>
                  <span>Today</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Real-time Trading Card - Top Right */}
            <div className="md:col-span-2 lg:col-span-2 glass glass-hover rounded-2xl p-6 group relative overflow-hidden animate-slide-up bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-blue-500/30" style={{ animationDelay: '100ms' }}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full " />
                    <span className=" text-sm font-medium">Real-time</span>
                  </div>
                  <Zap className="h-5 w-5 text-yellow-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
                <p className="text-sm text-card-foreground mb-6">10-minute rounds with instant execution</p>
                
                {/* Mock Speed Indicator */}
                <div className="relative">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full group-hover:animate-pulse" style={{ width: '85%' }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">Speed</span>
                    <span className=" font-medium">850ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill-based Competition - Wide Card */}
            <div className="md:col-span-4 lg:col-span-2 glass glass-hover rounded-2xl p-6 group relative overflow-hidden animate-slide-up bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/30" style={{ animationDelay: '200ms' }}>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-400 mb-4">
                    <Shield className="h-3 w-3" />
                    Zero Risk
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Pure Skill Competition</h3>
                  <p className="text-card-foreground">
                    No gambling, no liquidation risk. Just strategy, knowledge, and skill-based trading.
                  </p>
                </div>
                
                {/* Floating elements */}
                <div className="mt-6 flex gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-300 flex items-center justify-center" style={{ animationDelay: '100ms' }}>
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 opacity-40 group-hover:opacity-60 transition-all duration-300 flex items-center justify-center" style={{ animationDelay: '200ms' }}>
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Zero Knowledge Security */}
            <div className="md:col-span-2 lg:col-span-2 glass glass-hover rounded-2xl p-6 group relative overflow-hidden animate-slide-up bg-gradient-to-br from-indigo-500/10 to-violet-600/10 border-indigo-500/30" style={{ animationDelay: '350ms' }}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-yellow-400 group-hover:rotate-12 transition-transform duration-300" />
                  <span className=" text-sm font-medium">ZK Proofs</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Zero Knowledge Security</h3>
                <p className="text-sm text-card-foreground mb-6">Cryptographic proofs ensure fair results without revealing private data</p>
                
                {/* ZK Proof Visualization */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs ">Contest data verified</span>
                    <CheckCircle className="h-4 w-4 text-yellow-400 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs ">Proof generated</span>
                    <CheckCircle className="h-4 w-4 text-yellow-400 ml-auto" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs ">Winner determined</span>
                    <div className="h-4 w-4 border-2 border-yellow-400 rounded-full animate-spin ml-auto" />
                  </div>
                </div>
                
                {/* Privacy Shield */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground line-through " />
                    <span className="text-xs text-muted-foreground">Private data hidden</span>
                  </div>
                  <Shield className="h-5 w-5 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              
            </div>

            {/* Portfolio Drafting */}
            <div className="md:col-span-2 lg:col-span-3 glass glass-hover rounded-2xl p-6 group relative overflow-hidden animate-slide-up bg-gradient-to-br from-orange-500/10 to-red-600/10 border-orange-500/30" style={{ animationDelay: '300ms' }}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  <span className="text-orange-400 text-sm font-medium">Strategy</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Fantasy Portfolio Drafting</h3>
                <p className="text-sm text-card-foreground mb-6">Pick tokens strategically under budget constraints</p>
                
                {/* Mock Token Selection */}
                <div className="grid grid-cols-3 gap-2">
                  {['SOL', 'BTC', 'ETH'].map((token, i) => (
                    <div 
                      key={token}
                      className="bg-gray-800/50 rounded-lg p-2 text-center group-hover:bg-orange-500/20 transition-colors duration-300"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="text-xs font-medium text-white">{token}</div>
                      <div className="text-xs text-orange-400">+{20+(i*7)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* NFT Rewards */}
            {/* <div className="md:col-span-2 lg:col-span-3 glass glass-hover rounded-2xl p-6 group relative overflow-hidden animate-slide-up bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border-yellow-500/30" style={{ animationDelay: '400ms' }}>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">Rewards</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">NFT Proof-of-Skill</h3>
                  <p className="text-sm text-card-foreground">Collectible badges that prove your trading prowess</p>
                </div>
                
                <div className="mt-6 flex gap-3 justify-end">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 opacity-90 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-2 border-yellow-400/30" />
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 opacity-70 group-hover:opacity-90 group-hover:scale-105 group-hover:-rotate-3 transition-all duration-300 border-2 border-amber-400/30" />
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-400 opacity-50 group-hover:opacity-70 group-hover:rotate-12 transition-all duration-300 border-2 border-yellow-400/30" />
                </div>
              </div>
            </div> */}

            {/* Solana + ZK Powered */}
            <div className="md:col-span-4 lg:col-span-6 glass glass-hover rounded-2xl p-8 group relative overflow-hidden animate-slide-up bg-gradient-to-r from-primary/10 via-secondary/10 to-indigo-500/10 border-primary/30" style={{ animationDelay: '500ms' }}>
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <div className="h-1 w-8 bg-gradient-to-r from-primary to-indigo-500" />
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Solana × Zero Knowledge</h3>
                    <p className="text-primary text-sm">Lightning fast, cryptographically secure</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">400ms</div>
                    <div className="text-sm text-muted-foreground">Block Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">$0.0025</div>
                    <div className="text-sm text-muted-foreground">Avg Fee</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">65,000</div>
                    <div className="text-sm text-muted-foreground">TPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">ZK</div>
                    <div className="text-sm text-muted-foreground">Proofs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-sm text-muted-foreground">Verifiable</div>
                  </div>
                </div>
                
                {/* ZK Benefits */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 justify-center">
                    <Shield className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-card-foreground">Cryptographic Security</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Eye className="h-4 w-4 text-yellow-400 line-through" />
                    <span className="text-sm text-card-foreground">Privacy Preserved</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-card-foreground">Mathematically Provable</span>
                  </div>
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
