"use client"

import { Navbar } from "@/components/navbar"
import { ContestCard } from "@/components/contest-card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Zap, Shield, Trophy, Sparkles } from "lucide-react"
import { useGetAllContestsQuery } from "@/hooks/api-hooks/useContestQuery"
import Link from "next/link"

export default function HomePage() {

  const { data: contests, isLoading: isLoadingContests } = useGetAllContestsQuery();

  console.log("Contests:", contests);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden pt-24 pb-16">
        {/* Animated morphing background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#00FFFF", stopOpacity: 0.2 }} />
                <stop offset="100%" style={{ stopColor: "#FF00FF", stopOpacity: 0.2 }} />
              </linearGradient>
            </defs>
            <path
              d="M0,100 Q250,50 500,100 T1000,100 L1000,0 L0,0 Z"
              fill="url(#grad1)"
              className="animate-morph-wave"
            />
          </svg>

          {/* Floating particles */}
          <div className="absolute top-20 left-[10%] w-2 h-2 bg-primary rounded-full animate-float-slow" />
          <div className="absolute top-40 right-[15%] w-3 h-3 bg-accent rounded-full animate-float-medium" />
          <div className="absolute bottom-40 left-[20%] w-2 h-2 bg-primary rounded-full animate-float-fast" />
          <div className="absolute top-60 right-[30%] w-4 h-4 bg-accent rounded-full animate-float-slow" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full glass border-primary/30 px-4 py-2 text-sm font-medium text-primary animate-glow-cyan">
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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth px-8 py-6 text-lg font-semibold animate-glow-cyan"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Browse Contests
                </span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="glass glass-hover transition-smooth px-8 py-6 text-lg font-semibold text-white bg-transparent"
              >
                How It Works
              </Button>
            </div>
          </div>

          <div className="mt-24 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Strategic Gameplay",
                description: "Draft your portfolio within budget and category constraints",
              },
              {
                icon: Zap,
                title: "Fast-Paced Action",
                description: "15-60 minute contests with real-time leaderboards",
              },
              {
                icon: Shield,
                title: "Skill-Based Rewards",
                description: "Win SOL prizes and exclusive NFT badges",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group glass glass-hover p-6 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg glass border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-card-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Active & Upcoming Contests</h2>
            <p className="text-lg text-card-foreground">Join a contest and start competing</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {!isLoadingContests && contests && contests.length > 0 ? (
              contests.slice(0, 6).map((contest, i) => (
                <div key={contest.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <ContestCard {...contest} />
                </div>
              ))
            ) : isLoadingContests ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Loading contests...</p>
              </div>
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No contests found</p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/contests"
              className=" transition-smooth text-white font-semibold "
            >
              View All Contests
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
