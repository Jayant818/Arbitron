"use client"

import { Navbar } from "@/components/navbar"
import { ContestCard } from "@/components/contest-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ContestsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const upcomingContests = [
    {
      id: "1",
      title: "Quick Strike",
      entryFee: 0.1,
      prizePool: 5,
      duration: 15,
      slotsTotal: 50,
      slotsFilled: 38,
      startsIn: 3600,
      status: "upcoming" as const,
    },
    {
      id: "3",
      title: "Altcoin Arena",
      entryFee: 0.5,
      prizePool: 25,
      duration: 60,
      slotsTotal: 50,
      slotsFilled: 29,
      startsIn: 7200,
      status: "upcoming" as const,
    },
    {
      id: "5",
      title: "Speed Trader",
      entryFee: 0.15,
      prizePool: 7.5,
      duration: 20,
      slotsTotal: 50,
      slotsFilled: 15,
      startsIn: 5400,
      status: "upcoming" as const,
    },
  ]

  const activeContests = [
    {
      id: "2",
      title: "Meme Madness",
      entryFee: 0.25,
      prizePool: 12.5,
      duration: 30,
      slotsTotal: 50,
      slotsFilled: 50,
      startsIn: 0,
      status: "active" as const,
    },
    {
      id: "4",
      title: "DeFi Duel",
      entryFee: 0.3,
      prizePool: 15,
      duration: 45,
      slotsTotal: 50,
      slotsFilled: 50,
      startsIn: 0,
      status: "active" as const,
    },
  ]

  const filteredUpcoming = upcomingContests.filter((contest) =>
    contest.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const filteredActive = activeContests.filter((contest) =>
    contest.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">All Contests</h1>
          <p className="text-lg text-muted-foreground">Browse and join trading contests</p>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search contests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-border text-white placeholder:text-muted-foreground"
            />
          </div>
          <Button variant="outline" className="glass glass-hover text-white font-semibold bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUpcoming.length > 0 ? (
                filteredUpcoming.map((contest, i) => (
                  <div key={contest.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <ContestCard {...contest} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No upcoming contests found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredActive.length > 0 ? (
                filteredActive.map((contest, i) => (
                  <div key={contest.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <ContestCard {...contest} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No active contests found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
