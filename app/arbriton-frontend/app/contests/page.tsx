"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ContestCard } from "@/components/contest-card"
import { useGetAllContestsQuery } from "@/hooks/api-hooks/useContestQuery"

export default function ContestsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const {data:contests, isLoading:isContestLoading} = useGetAllContestsQuery()

  // Filter contests by status: 0 = Upcoming, 1 = Active/Ongoing, 2 = Completed/Ended
  const filteredUpcoming = contests
    ?.filter((contest) => contest.status === 0) // Status 0 = Upcoming
    ?.filter((contest) => contest.title.toLowerCase().includes(searchQuery.toLowerCase()))
  
  const filteredActive = contests
    ?.filter((contest) => contest.status === 1) // Status 1 = Active/Ongoing
    ?.filter((contest) => contest.title.toLowerCase().includes(searchQuery.toLowerCase()))
  
  const filteredCompleted = contests
    ?.filter((contest) => contest.status === 2) // Status 2 = Completed
    ?.filter((contest) => contest.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">All Contests</h1>
          <p className="text-lg text-muted-foreground">Browse and join trading contests</p>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4 max-w-2xl">
          <div className="relative flex-1 ">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 " />
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
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8">
            <TabsTrigger value="upcoming">
              Upcoming {filteredUpcoming && `(${filteredUpcoming.length})`}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active {filteredActive && `(${filteredActive.length})`}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed {filteredCompleted && `(${filteredCompleted.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {isContestLoading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Loading contests...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredUpcoming && filteredUpcoming.length > 0 ? (
                  filteredUpcoming.map((contest, i) => (
                    <div key={contest.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                      <ContestCard {...contest} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No upcoming contests found matching "${searchQuery}"`
                        : "No upcoming contests available"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            {isContestLoading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Loading contests...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredActive && filteredActive.length > 0 ? (
                  filteredActive.map((contest, i) => (
                    <div key={contest.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                      <ContestCard {...contest} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No active contests found matching "${searchQuery}"`
                        : "No active contests at the moment"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {isContestLoading ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Loading contests...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompleted && filteredCompleted.length > 0 ? (
                  filteredCompleted.map((contest, i) => (
                    <div key={contest.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                      <ContestCard {...contest} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No completed contests found matching "${searchQuery}"`
                        : "No completed contests yet"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
