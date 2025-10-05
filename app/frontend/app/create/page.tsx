"use client"

import { useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonButton } from "@/components/ui/neon-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { address, getAddressEncoder, getBase58Decoder, getProgramDerivedAddress, signAndSendTransactionMessageWithSigners } from "@solana/kit"
import { ChainContext } from "@/context/ChainContext"
import {
	CreateContestAsyncInput,
	ARBITRON_PROGRAM_ADDRESS as ARBITRON_PROGRAM_ID,
	getCreateContestInstructionAsync,
} from "../../../../dist/js-client/index"

import {
	createTransactionMessage,
	setTransactionMessageFeePayerSigner,
	setTransactionMessageLifetimeUsingBlockhash,
	appendTransactionMessageInstructions,
	pipe,
} from "@solana/kit";
import { RpcContext } from "@/context/RpcContext"
import { useWalletAccountTransactionSendingSigner } from "@solana/react";  
import { log } from "console"
  
export const USD_MINT = address("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

interface contestType {
	id: string;
	name: string;
	duration: string;
	icon: string;
}

const contestTypes: contestType[] = [
	{ id: "lightning", name: "Lightning Round", duration: "5 minutes", icon: "⚡" },
	{ id: "marathon", name: "Marathon", duration: "1 hour", icon: "🏃" },
	{ id: "endurance", name: "Endurance", duration: "4 hours", icon: "💪" },
]

const prizeStructures = [
	{ id: "winner-takes-all", name: "Winner Takes All", distribution: [100] },
	{ id: "top-3", name: "Top 3 Split", distribution: [60, 25, 15] },
	{ id: "top-5", name: "Top 5 Split", distribution: [40, 25, 20, 10, 5] },
	{ id: "top-10", name: "Top 10 Split", distribution: [30, 20, 15, 10, 8, 6, 4, 3, 2, 2] },
]

export default function CreateContestPage() {
	const router = useRouter()
	const { chain } = useContext(ChainContext);
	const { rpc } = useContext(RpcContext);
	
	const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		type: contestTypes[0].id, // Storing the ID string, not the entire object
		entryFee: [100],
		maxParticipants: [50],
		prizeStructure: "",
		startDate: undefined as Date | undefined,
		startTime: "12:00",
		isPrivate: false,
		requiresApproval: false,
		customRules: "",
	})

	const [isCreating, setIsCreating] = useState(false)

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


	// Create the wallet-compatible signer (must be at component top-level)
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const signer = useWalletAccountTransactionSendingSigner(
		selectedWalletAccount?.account,
		chain   // Use your chain context; fallback to devnet if undefined
	);

	const handleCreateContest = async () => {
		try {
		  setIsCreating(true);
	  
		  const contestName = formData.title;
		  
		  // Get the selected contest type to extract duration
		  const selectedType = contestTypes.find(t => t.id === formData.type);
		  if (!selectedType) {
			alert("Please select a valid contest type.");
			setIsCreating(false);
			return;
		  }
		  
		  // Parse duration from "5 minutes" or "1 hour" format
		  const durationMatch = selectedType.duration.match(/(\d+)\s*(minute|hour)/i);
		  if (!durationMatch) {
			alert("Invalid duration format.");
			setIsCreating(false);
			return;
		  }
		  
		  const durationValue = parseInt(durationMatch[1]);
		  const durationUnit = durationMatch[2].toLowerCase();
		  const durationInSeconds = durationUnit === 'hour' 
			? durationValue * 60 * 60 
			: durationValue * 60;
	  
		  // 1️⃣ Generate Contest PDA (use signer.address)
		  const contestSeeds = [
			new TextEncoder().encode("contest"),
			new TextEncoder().encode(contestName),
			getAddressEncoder().encode(signer.address),
		  ];
	  
		  const [contestPda] = await getProgramDerivedAddress({
			programAddress: ARBITRON_PROGRAM_ID,
			seeds: contestSeeds,
		  });
			
			console.log("durationInSeconds:", durationInSeconds);
			console.log("signer.address:", signer.address);
			console.log("entryFees", formData.entryFee);
			console.log("maxParticipants", formData.maxParticipants);
	  
		  // 2️⃣ Prepare instruction input (use signer)
		  const createContestAsyncInput: CreateContestAsyncInput = {
			duration: durationInSeconds, // duration in seconds
			entryFees: BigInt(formData.entryFee[0] * 10 ** 6), // e.g. 100 USDC (6 decimals)
			maxParticipents: Number(formData.maxParticipants[0]),
			name: contestName,
			startTime: Math.floor(Date.now() / 1000) + 60, // start in 1 min
			signer: signer,  // <-- Use signer here
			tokenMint: USD_MINT,
			contest: contestPda,
		  };
	  
		  // 3️⃣ Get instruction
		  const createContestIx = await getCreateContestInstructionAsync(
			createContestAsyncInput,
			{
			  programAddress: ARBITRON_PROGRAM_ID,
			}
		  );
	  
		  // 4️⃣ Build transaction
		  const { value: blockhash } = await rpc.getLatestBlockhash().send();
	  
		  const txMsg = pipe(
			createTransactionMessage({ version: 0 }),
			(tx) => setTransactionMessageFeePayerSigner(signer, tx),  // <-- Use signer here
			(tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
			(tx) => appendTransactionMessageInstructions([createContestIx], tx)
		  );
	  
		  // 5️⃣ Sign & Send transaction via wallet (this should prompt the wallet UI)
		  const signatureBytes = await signAndSendTransactionMessageWithSigners(txMsg);
		  const sig = getBase58Decoder().decode(signatureBytes);  // Decode to base58 if needed for logging/explorer
		  
		  console.log("✅ Contest created successfully! Signature:", sig);
	  
		  alert("Contest created successfully!");
		  router.push("/contest/" + contestName);
		} catch (error) {
		  console.error("❌ Error creating contest:", error);
		  alert("Error creating contest. Check console for details.");
		} finally {
		  setIsCreating(false);
		}
	  };

	const selectedPrizeStructure = prizeStructures.find((p) => p.id === formData.prizeStructure)
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

								<Separator />

								<div className="space-y-2 text-sm font-mono">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Entry Fee:</span>
										<span className="text-electric-teal">${formData.entryFee[0]} USDC</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Expected Prize Pool:</span>
										<span className="text-vibrant-purple">${formData.entryFee[0] * formData.maxParticipants[0]} USDC</span>
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
										const amount = (formData.entryFee[0] * formData.maxParticipants[0] * percentage) / 100  // Adjusted to use entryFee * maxParticipants as prize pool estimate
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
							disabled={!formData.title || !formData.type  || isCreating}
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