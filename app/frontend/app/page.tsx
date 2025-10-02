"use client"

import { useState, useMemo, useContext } from "react"
import { useRouter } from "next/navigation"
import { NeonButton } from "@/components/ui/neon-button"
import { ContestCard } from "@/components/contest-card"
import { ContestFilters } from "@/components/contest-filters"
import { TrendingUp, Users, Trophy } from "lucide-react"
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext"
import { useToast } from "@/hooks/use-toast"

// Mock contest data
const mockContests = [
	{
		id: "001",
		title: "Lightning Round Alpha",
		type: "lightning" as const,
		entryFee: 100,
		prizePool: 2500,
		currentPlayers: 24,
		maxPlayers: 25,
		timeRemaining: "2m 34s",
		status: "waiting" as const,
		difficulty: "beginner" as const,
	},
	{
		id: "002",
		title: "Endurance Marathon",
		type: "endurance" as const,
		entryFee: 250,
		prizePool: 10000,
		currentPlayers: 18,
		maxPlayers: 40,
		timeRemaining: "45m 12s",
		status: "active" as const,
		difficulty: "intermediate" as const,
	},
	{
		id: "003",
		title: "Precision Strike",
		type: "precision" as const,
		entryFee: 500,
		prizePool: 25000,
		currentPlayers: 12,
		maxPlayers: 20,
		timeRemaining: "1h 23m",
		status: "waiting" as const,
		difficulty: "expert" as const,
	},
	{
		id: "004",
		title: "Speed Demon",
		type: "lightning" as const,
		entryFee: 50,
		prizePool: 1200,
		currentPlayers: 15,
		maxPlayers: 15,
		timeRemaining: "Ending Soon",
		status: "ending" as const,
		difficulty: "beginner" as const,
	},
	{
		id: "005",
		title: "Whale Hunter",
		type: "precision" as const,
		entryFee: 1000,
		prizePool: 50000,
		currentPlayers: 8,
		maxPlayers: 10,
		timeRemaining: "3h 45m",
		status: "waiting" as const,
		difficulty: "expert" as const,
	},
	{
		id: "006",
		title: "Day Trader Special",
		type: "endurance" as const,
		entryFee: 200,
		prizePool: 8000,
		currentPlayers: 32,
		maxPlayers: 50,
		timeRemaining: "6h 12m",
		status: "active" as const,
		difficulty: "intermediate" as const,
	},
]

export default function HomePage() {
	const router = useRouter()
	const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [typeFilter, setTypeFilter] = useState("all")
	const [difficultyFilter, setDifficultyFilter] = useState("all")

	const filteredContests = useMemo(() => {
		return mockContests.filter((contest) => {
			const matchesSearch =
				contest.title.toLowerCase().includes(searchTerm.toLowerCase()) || contest.id.includes(searchTerm)
			const matchesStatus = statusFilter === "all" || contest.status === statusFilter
			const matchesType = typeFilter === "all" || contest.type === typeFilter
			const matchesDifficulty = difficultyFilter === "all" || contest.difficulty === difficultyFilter

			return matchesSearch && matchesStatus && matchesType && matchesDifficulty
		})
	}, [searchTerm, statusFilter, typeFilter, difficultyFilter])

	const totalPrizePool = mockContests.reduce((sum, contest) => sum + contest.prizePool, 0)
	const totalPlayers = mockContests.reduce((sum, contest) => sum + contest.currentPlayers, 0)
	const activeContests = mockContests.filter((c) => c.status === "active").length

	const handleCreateContest = () => {
		if (!selectedWalletAccount) {
			toast({
				title: "Wallet not connected",
				description: "Please connect your wallet to create a contest.",
				variant: "destructive",
			})
			return
		}
		// Navigate to create contest page
		router.push("/create")
	}

	return (
		<div className="min-h-screen bg-background">

			{/* Hero Section */}
			<section className="container mx-auto px-4 py-16 text-center">
				<h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-bold mb-6 neon-text-teal tracking-wider">
					ARBITRON
				</h1>
				<p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto font-mono leading-relaxed">
					Enter the ultimate Solana trading arena. Compete in real-time contests, earn NFT rewards, and dominate the
					neon grid. Where skill meets fortune.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
					<NeonButton size="xl" className="cursor-pointer">
						Enter the Arena
					</NeonButton>
					<NeonButton variant="outline" size="xl" className="cursor-pointer">
						Watch Live Contests
					</NeonButton>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
					<div className="text-center">
						<div className="flex items-center justify-center gap-2 text-electric-teal mb-2">
							<Trophy className="w-5 h-5" />
							<span className="text-2xl font-display font-bold">${totalPrizePool.toLocaleString()}</span>
						</div>
						<p className="text-sm text-muted-foreground font-mono">Total Prize Pool</p>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center gap-2 text-vibrant-purple mb-2">
							<Users className="w-5 h-5" />
							<span className="text-2xl font-display font-bold">{totalPlayers}</span>
						</div>
						<p className="text-sm text-muted-foreground font-mono">Active Traders</p>
					</div>
					<div className="text-center">
						<div className="flex items-center justify-center gap-2 text-hot-pink mb-2">
							<TrendingUp className="w-5 h-5" />
							<span className="text-2xl font-display font-bold">{activeContests}</span>
						</div>
						<p className="text-sm text-muted-foreground font-mono">Live Contests</p>
					</div>
				</div>
			</section>

			{/* Contest Browser */}
			<section className="container mx-auto px-4 py-16">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-3xl font-display font-bold neon-text-purple">Contest Arena</h2>
					<NeonButton variant="secondary" size="sm" onClick={handleCreateContest}>
						Create Contest
					</NeonButton>
				</div>

				<ContestFilters
					searchTerm={searchTerm}
					onSearchChange={setSearchTerm}
					statusFilter={statusFilter}
					onStatusFilterChange={setStatusFilter}
					typeFilter={typeFilter}
					onTypeFilterChange={setTypeFilter}
					difficultyFilter={difficultyFilter}
					onDifficultyFilterChange={setDifficultyFilter}
				/>

				{filteredContests.length === 0 ? (
					<div className="text-center py-16">
						<p className="text-muted-foreground font-mono text-lg mb-4">No contests match your filters</p>
						<NeonButton
							variant="ghost"
							onClick={() => {
								setSearchTerm("")
								setStatusFilter("all")
								setTypeFilter("all")
								setDifficultyFilter("all")
							}}
						>
							Clear Filters
						</NeonButton>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredContests.map((contest) => (
							<ContestCard key={contest.id} contest={contest} />
						))}
					</div>
				)}
			</section>

			{/* Footer */}
			<footer className="border-t border-border/50 mt-20">
				<div className="container mx-auto px-4 py-8 text-center">
					<p className="text-muted-foreground font-mono text-sm">
						Built on Solana • Powered by the future • Trade at light speed
					</p>
				</div>
			</footer>
		</div>
	)
}
