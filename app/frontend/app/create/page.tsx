"use client"

import { useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, Target, CalendarIcon, Sparkles, Trophy, Settings } from "lucide-react"
import { format } from "date-fns"
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext"
import { ConnectWalletMenu } from "@/components/ConnectWalletMenu"

const contestTypes = [
	{ id: "lightning", name: "Lightning Round", duration: "5 minutes", icon: "⚡" },
	{ id: "blitz", name: "Blitz Battle", duration: "15 minutes", icon: "🚀" },
	{ id: "marathon", name: "Marathon", duration: "1 hour", icon: "🏃" },
	{ id: "endurance", name: "Endurance", duration: "4 hours", icon: "💪" },
]

const difficultyLevels = [
	{ id: "beginner", name: "Beginner", color: "text-electric-teal", description: "Perfect for new traders" },
	{ id: "intermediate", name: "Intermediate", color: "text-vibrant-purple", description: "For experienced traders" },
	{ id: "expert", name: "Expert", color: "text-hot-pink", description: "High-stakes competition" },
]

const prizeStructures = [
	{ id: "winner-takes-all", name: "Winner Takes All", distribution: [100] },
	{ id: "top-3", name: "Top 3 Split", distribution: [60, 25, 15] },
	{ id: "top-5", name: "Top 5 Split", distribution: [40, 25, 20, 10, 5] },
	{ id: "top-10", name: "Top 10 Split", distribution: [30, 20, 15, 10, 8, 6, 4, 3, 2, 2] },
]

export default function CreateContestPage() {
	const router = useRouter()
	const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		type: "",
		difficulty: "",
		entryFee: [100],
		prizePool: [2500],
		maxParticipants: [50],
		prizeStructure: "",
		startDate: undefined as Date | undefined,
		startTime: "12:00",
		allowedTokens: [] as string[],
		isPrivate: false,
		requiresApproval: false,
		customRules: "",
	})

	const [selectedTokens, setSelectedTokens] = useState<string[]>([])
	const [isCreating, setIsCreating] = useState(false)

	const availableTokens = ["SOL", "USDC", "USDT", "RAY", "ORCA", "MNGO", "SRM", "FIDA", "COPE", "STEP"]

	const handleTokenToggle = (token: string) => {
		setSelectedTokens((prev) => (prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]))
	}

	const handleCreateContest = async () => {
		setIsCreating(true)

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Redirect to contest lobby
		router.push("/contest/new-contest-001")
	}

	const selectedType = contestTypes.find((t) => t.id === formData.type)
	const selectedDifficulty = difficultyLevels.find((d) => d.id === formData.difficulty)
	const selectedPrizeStructure = prizeStructures.find((p) => p.id === formData.prizeStructure)

	if (!selectedWalletAccount) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<GlassCard className="text-center">
					<h1 className="text-2xl font-display font-bold neon-text-teal mb-4">Connect Your Wallet</h1>
					<p className="text-muted-foreground mb-6">You need to connect your wallet to create a contest.</p>
					<ConnectWalletMenu>Connect Wallet</ConnectWalletMenu>
				</GlassCard>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-display font-bold neon-text-teal tracking-wider mb-2">CREATE CONTEST</h1>
					<p className="text-muted-foreground font-mono">Build your custom trading arena</p>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Form */}
					<div className="lg:col-span-2 space-y-6">
						{/* Basic Information */}
						<GlassCard>
							<h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
								<Settings className="w-5 h-5 text-electric-teal" />
								Basic Information
							</h2>

							<div className="space-y-4">
								<div>
									<Label htmlFor="title" className="text-sm font-mono text-muted-foreground">
										Contest Title
									</Label>
									<Input
										id="title"
										placeholder="Enter contest title..."
										value={formData.title}
										onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
										className="mt-1"
									/>
								</div>

								<div>
									<Label htmlFor="description" className="text-sm font-mono text-muted-foreground">
										Description
									</Label>
									<Textarea
										id="description"
										placeholder="Describe your contest..."
										value={formData.description}
										onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
										className="mt-1 min-h-[100px]"
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label className="text-sm font-mono text-muted-foreground">Contest Type</Label>
										<Select
											value={formData.type}
											onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
										>
											<SelectTrigger className="mt-1">
												<SelectValue placeholder="Select type..." />
											</SelectTrigger>
											<SelectContent>
												{contestTypes.map((type) => (
													<SelectItem key={type.id} value={type.id}>
														<div className="flex items-center gap-2">
															<span>{type.icon}</span>
															<div>
																<div className="font-mono">{type.name}</div>
																<div className="text-xs text-muted-foreground">{type.duration}</div>
															</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div>
										<Label className="text-sm font-mono text-muted-foreground">Difficulty</Label>
										<Select
											value={formData.difficulty}
											onValueChange={(value) => setFormData((prev) => ({ ...prev, difficulty: value }))}
										>
											<SelectTrigger className="mt-1">
												<SelectValue placeholder="Select difficulty..." />
											</SelectTrigger>
											<SelectContent>
												{difficultyLevels.map((level) => (
													<SelectItem key={level.id} value={level.id}>
														<div>
															<div className={`font-mono ${level.color}`}>{level.name}</div>
															<div className="text-xs text-muted-foreground">{level.description}</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</GlassCard>

						{/* Financial Settings */}
						<GlassCard>
							<h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
								<DollarSign className="w-5 h-5 text-vibrant-purple" />
								Financial Settings
							</h2>

							<div className="space-y-6">
								<div>
									<Label className="text-sm font-mono text-muted-foreground">Entry Fee (USDC)</Label>
									<div className="mt-2">
										<Slider
											value={formData.entryFee}
											onValueChange={(value) => setFormData((prev) => ({ ...prev, entryFee: value }))}
											max={1000}
											min={10}
											step={10}
											className="w-full"
										/>
										<div className="flex justify-between text-xs text-muted-foreground mt-1">
											<span>$10</span>
											<span className="text-electric-teal font-mono">${formData.entryFee[0]}</span>
											<span>$1,000</span>
										</div>
									</div>
								</div>

								<div>
									<Label className="text-sm font-mono text-muted-foreground">Prize Pool (USDC)</Label>
									<div className="mt-2">
										<Slider
											value={formData.prizePool}
											onValueChange={(value) => setFormData((prev) => ({ ...prev, prizePool: value }))}
											max={50000}
											min={100}
											step={100}
											className="w-full"
										/>
										<div className="flex justify-between text-xs text-muted-foreground mt-1">
											<span>$100</span>
											<span className="text-vibrant-purple font-mono">${formData.prizePool[0].toLocaleString()}</span>
											<span>$50,000</span>
										</div>
									</div>
								</div>

								<div>
									<Label className="text-sm font-mono text-muted-foreground">Prize Distribution</Label>
									<Select
										value={formData.prizeStructure}
										onValueChange={(value) => setFormData((prev) => ({ ...prev, prizeStructure: value }))}
									>
										<SelectTrigger className="mt-1">
											<SelectValue placeholder="Select prize structure..." />
										</SelectTrigger>
										<SelectContent>
											{prizeStructures.map((structure) => (
												<SelectItem key={structure.id} value={structure.id}>
													<div>
														<div className="font-mono">{structure.name}</div>
														<div className="text-xs text-muted-foreground">
															{structure.distribution.map((pct, i) => `${i + 1}st: ${pct}%`).join(", ")}
														</div>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</GlassCard>

						{/* Contest Settings */}
						<GlassCard>
							<h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
								<Target className="w-5 h-5 text-hot-pink" />
								Contest Settings
							</h2>

							<div className="space-y-6">
								<div>
									<Label className="text-sm font-mono text-muted-foreground">Maximum Participants</Label>
									<div className="mt-2">
										<Slider
											value={formData.maxParticipants}
											onValueChange={(value) => setFormData((prev) => ({ ...prev, maxParticipants: value }))}
											max={200}
											min={5}
											step={5}
											className="w-full"
										/>
										<div className="flex justify-between text-xs text-muted-foreground mt-1">
											<span>5</span>
											<span className="text-hot-pink font-mono">{formData.maxParticipants[0]} traders</span>
											<span>200</span>
										</div>
									</div>
								</div>

								<div>
									<Label className="text-sm font-mono text-muted-foreground">Start Date & Time</Label>
									<div className="flex gap-2 mt-1">
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="outline" className="flex-1 justify-start text-left font-normal bg-transparent">
													<CalendarIcon className="mr-2 h-4 w-4" />
													{formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={formData.startDate}
													onSelect={(date) => setFormData((prev) => ({ ...prev, startDate: date }))}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
										<Input
											type="time"
											value={formData.startTime}
											onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
											className="w-32"
										/>
									</div>
								</div>

								<div>
									<Label className="text-sm font-mono text-muted-foreground mb-3 block">Allowed Trading Tokens</Label>
									<div className="grid grid-cols-5 gap-2">
										{availableTokens.map((token) => (
											<Badge
												key={token}
												variant={selectedTokens.includes(token) ? "default" : "outline"}
												className={`cursor-pointer text-center justify-center py-2 transition-colors ${
													selectedTokens.includes(token)
														? "bg-electric-teal/20 text-electric-teal border-electric-teal"
														: "hover:bg-electric-teal/10"
												}`}
												onClick={() => handleTokenToggle(token)}
											>
												{token}
											</Badge>
										))}
									</div>
								</div>

								<Separator />

								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<Label className="text-sm font-mono text-muted-foreground">Private Contest</Label>
											<p className="text-xs text-muted-foreground">Only invited users can join</p>
										</div>
										<Switch
											checked={formData.isPrivate}
											onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPrivate: checked }))}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<Label className="text-sm font-mono text-muted-foreground">Requires Approval</Label>
											<p className="text-xs text-muted-foreground">Manual approval for participants</p>
										</div>
										<Switch
											checked={formData.requiresApproval}
											onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, requiresApproval: checked }))}
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="customRules" className="text-sm font-mono text-muted-foreground">
										Custom Rules (Optional)
									</Label>
									<Textarea
										id="customRules"
										placeholder="Add any custom rules or restrictions..."
										value={formData.customRules}
										onChange={(e) => setFormData((prev) => ({ ...prev, customRules: e.target.value }))}
										className="mt-1"
									/>
								</div>
							</div>
						</GlassCard>
					</div>

					{/* Preview Sidebar */}
					<div className="space-y-6">
						{/* Contest Preview */}
						<GlassCard>
							<h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
								<Sparkles className="w-5 h-5 text-electric-teal" />
								Contest Preview
							</h3>

							<div className="space-y-4">
								<div>
									<h4 className="font-display font-bold text-lg">{formData.title || "Untitled Contest"}</h4>
									<p className="text-sm text-muted-foreground mt-1">
										{formData.description || "No description provided"}
									</p>
								</div>

								{selectedType && (
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-electric-teal border-electric-teal">
											{selectedType.icon} {selectedType.name}
										</Badge>
									</div>
								)}

								{selectedDifficulty && (
									<div className="flex items-center gap-2">
										<Badge variant="outline" className={`${selectedDifficulty.color} border-current`}>
											{selectedDifficulty.name}
										</Badge>
									</div>
								)}

								<Separator />

								<div className="space-y-2 text-sm font-mono">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Entry Fee:</span>
										<span className="text-electric-teal">${formData.entryFee[0]} USDC</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Prize Pool:</span>
										<span className="text-vibrant-purple">${formData.prizePool[0].toLocaleString()} USDC</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Max Participants:</span>
										<span>{formData.maxParticipants[0]}</span>
									</div>
									{selectedPrizeStructure && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">Prize Structure:</span>
											<span className="text-hot-pink">{selectedPrizeStructure.name}</span>
										</div>
									)}
								</div>

								{selectedTokens.length > 0 && (
									<>
										<Separator />
										<div>
											<div className="text-sm text-muted-foreground font-mono mb-2">Allowed Tokens:</div>
											<div className="flex flex-wrap gap-1">
												{selectedTokens.map((token) => (
													<Badge key={token} variant="outline" className="text-xs">
														{token}
													</Badge>
												))}
											</div>
										</div>
									</>
								)}
							</div>
						</GlassCard>

						{/* Prize Breakdown */}
						{selectedPrizeStructure && (
							<GlassCard>
								<h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
									<Trophy className="w-5 h-5 text-vibrant-purple" />
									Prize Breakdown
								</h3>
								<div className="space-y-2">
									{selectedPrizeStructure.distribution.map((percentage, index) => {
										const amount = (formData.prizePool[0] * percentage) / 100
										return (
											<div key={index} className="flex justify-between text-sm font-mono">
												<span className="text-muted-foreground">#{index + 1}:</span>
												<span className="text-electric-teal">
													${amount.toFixed(0)} ({percentage}%)
												</span>
											</div>
										)
									})}
								</div>
							</GlassCard>
						)}

						{/* Create Button */}
						<NeonButton
							size="lg"
							className="w-full"
							onClick={handleCreateContest}
							disabled={!formData.title || !formData.type || !formData.difficulty || isCreating}
						>
							{isCreating ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
									Creating Contest...
								</>
							) : (
								<>
									<Plus className="w-4 h-4" />
									Create Contest
								</>
							)}
						</NeonButton>
					</div>
				</div>
			</div>
		</div>
	)
}
