"use client"

import { useState, useMemo, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NeonButton } from "@/components/ui/neon-button";
import { ContestCard } from "@/components/contest-card";
import { ContestFilters } from "@/components/contest-filters";
import { TrendingUp, Users, Trophy } from "lucide-react";
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export interface Contest {
	id: string,
    title: string,
    entryFee: number,
    currentPlayers: number,
    maxPlayers: number,
    duration: number,
    status: number,
    host: string,
    waitingTime: number,
	prizePoolAccount: string;
	decimals: number;
}

async function fetchContests() { 
	const contests = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/contest/all`);

	return contests.data;
}

export default function HomePage() {
	const router = useRouter();
	const [contests, setContests] = useState<Contest[]>([]);
	const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
	const { toast } = useToast();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");

	// Transform API contests to UI format
	const transformedContests = useMemo(() => {
		return contests.map((contest) => {
			// Derive contest type from duration (in seconds)
			const getContestType = (duration: number): "lightning" | "endurance" | "precision" => {
				if (duration <= 600) return "lightning" // <= 10 minutes
				if (duration <= 3600) return "precision" // <= 1 hour
				return "endurance" // > 1 hour
			}

			// Derive difficulty from entry fee (in base units)
			const getDifficulty = (entryFee: number, decimals: number): "beginner" | "intermediate" | "expert" => {
				const fee = entryFee / Math.pow(10, decimals)
				if (fee < 100) return "beginner"
				if (fee < 500) return "intermediate"
				return "expert"
			}

			// Convert status number to string
			const getStatus = (status: number): "waiting" | "active" | "ending" => {
				if (status === 0) return "waiting"
				if (status === 1) return "active"
				return "ending"
			}

			// Calculate time remaining
			const getTimeRemaining = (waitingTime: number, duration: number, status: number): string => {
				const now = Math.floor(Date.now() / 1000)
				
				if (status === 0) {
					// Waiting phase
					const timeUntilStart = waitingTime - now
					if (timeUntilStart <= 0) return "Starting Soon"
					const minutes = Math.floor(timeUntilStart / 60)
					const seconds = timeUntilStart % 60
					return `${minutes}m ${seconds}s`
				} else if (status === 1) {
					// Active phase
					const endTime = waitingTime + duration
					const timeRemaining = endTime - now
					if (timeRemaining <= 0) return "Ending Soon"
					const hours = Math.floor(timeRemaining / 3600)
					const minutes = Math.floor((timeRemaining % 3600) / 60)
					return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
				}
				return "Ended"
			}

			// Calculate prize pool (entry fee * current players)
			const prizePool = (contest.entryFee / Math.pow(10, contest.decimals)) * contest.currentPlayers

			// Check if user is host
			const isHost = selectedWalletAccount?.account.address === contest.host

			return {
				id: contest.id,
				title: contest.title,
				type: getContestType(contest.duration),
				entryFee: contest.entryFee / Math.pow(10, contest.decimals),
				prizePool,
				currentPlayers: contest.currentPlayers,
				maxPlayers: contest.maxPlayers,
				timeRemaining: getTimeRemaining(contest.waitingTime, contest.duration, contest.status),
				status: getStatus(contest.status),
				difficulty: getDifficulty(contest.entryFee, contest.decimals),
				isHost,
			}
		})
	}, [contests, selectedWalletAccount])

	const filteredContests = useMemo(() => {
		return transformedContests.filter((contest) => {
			const matchesSearch =
				contest.title.toLowerCase().includes(searchTerm.toLowerCase()) || contest.id.includes(searchTerm)
			const matchesStatus = statusFilter === "all" || contest.status === statusFilter
			const matchesType = typeFilter === "all" || contest.type === typeFilter

			return matchesSearch && matchesStatus && matchesType 
		})
	}, [transformedContests, searchTerm, statusFilter, typeFilter])

	const totalPrizePool = transformedContests.reduce((sum, contest) => sum + contest.prizePool, 0)
	const totalPlayers = transformedContests.reduce((sum, contest) => sum + contest.currentPlayers, 0)
	const activeContests = transformedContests.filter((c) => c.status === "active").length

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

	useEffect(() => {
		const fetchData = async () => {
			const contests = await fetchContests();
			console.log("Fetched Contests:", contests);
			setContests(contests);
		};
		fetchData();
	}, []);

	return (
		<div className="min-h-screen bg-background">

			{/* Hero Section with slide-up animation */}
			<section className="container mx-auto px-4 py-16 text-center animate-slide-up">
				<h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-bold mb-6 neon-text-teal tracking-wider">
					ARBITRON
				</h1>
				<p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto font-mono leading-relaxed">
					Enter the ultimate Solana trading arena. Compete in real-time contests, earn NFT rewards, and dominate the
					neon grid. Where skill meets fortune.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
					<NeonButton size="xl" className="cursor-pointer animate-glow">
						Enter the Arena
					</NeonButton>
					<NeonButton variant="outline" size="xl" className="cursor-pointer animate-glow">
						Watch Live Contests
					</NeonButton>
				</div>

				{/* Stats with pulse animation */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
					<div className="text-center animate-pulse-slow">
						<div className="flex items-center justify-center gap-2 text-azure-teal mb-2">
							<Trophy className="w-5 h-5" />
							<span className="text-2xl font-display font-bold">${totalPrizePool.toLocaleString()}</span>
						</div>
						<p className="text-sm text-muted-foreground font-mono">Total Prize Pool</p>
					</div>
					<div className="text-center animate-pulse-slow">
						<div className="flex items-center justify-center gap-2 text-deep-purple mb-2">
							<Users className="w-5 h-5" />
							<span className="text-2xl font-display font-bold">{totalPlayers}</span>
						</div>
						<p className="text-sm text-muted-foreground font-mono">Active Traders</p>
					</div>
					<div className="text-center animate-pulse-slow">
						<div className="flex items-center justify-center gap-2 text-maximum-red mb-2">
							<TrendingUp className="w-5 h-5" />
							<span className="text-2xl font-display font-bold">{activeContests}</span>
						</div>
						<p className="text-sm text-muted-foreground font-mono">Live Contests</p>
					</div>
				</div>
			</section>

			{/* Contest Browser with fade-in */}
			<section className="container mx-auto px-4 py-16 animate-fade-in">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-3xl font-display font-bold neon-text-purple">Contest Arena</h2>
					<NeonButton variant="secondary" size="sm" onClick={handleCreateContest} className="animate-glow">
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
				/>

				{filteredContests.length === 0 ? (
					<div className="text-center py-16 animate-fade-in">
						<p className="text-muted-foreground font-mono text-lg mb-4">No contests match your filters</p>
						<NeonButton
							variant="ghost"
							onClick={() => {
								setSearchTerm("")
								setStatusFilter("all")
								setTypeFilter("all")
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
						Built on Solana • Trade at light speed
					</p>
				</div>
			</footer>
		</div>
	)
}