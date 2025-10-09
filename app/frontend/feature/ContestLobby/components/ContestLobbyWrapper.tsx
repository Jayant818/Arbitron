"use client"
import { ConnectWalletMenu } from '@/components/ConnectWalletMenu'
import { GlassCard } from '@/components/ui/glass-card'
import { SelectedWalletAccountContext } from '@/context/SelectedWalletAccountContext'
import React, { useContext, useEffect, useState } from 'react'
import ContestLobbyPage from './ContestLobbyPage'
import { RpcContext } from '@/context/RpcContext'
import { fetchMaybeParticipent, fetchMaybeContest } from "../../../../../dist/js-client/index"
import { getAddressEncoder, address, getProgramDerivedAddress } from '@solana/kit'
import { useRouter } from 'next/navigation'

const ContestLobbyWrapper = ({ contestId }: { contestId: string }) => {
    const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)
    const { rpc } = useContext(RpcContext)
    const ARBITRON_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_PROGRAM_ID
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)

    // Validate contestId format
    useEffect(() => {
        if (contestId) {
            // Check if contestId is a valid base58 string (Solana address format)
            const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
            if (!base58Regex.test(contestId) || contestId.length < 32 || contestId.length > 44) {
                console.error("❌ Invalid contest ID format:", contestId);
                alert("Invalid contest ID. Please check the URL.");
                router.push("/");
                setIsChecking(false);
                return;
            }
        }
    }, [contestId, router]);

    useEffect(() => {
        if (!selectedWalletAccount || !selectedWalletAccount.account.address || !contestId) return

        checkAuthorizationAndStatus()

        async function checkAuthorizationAndStatus() {
            try {
                // 1. Check if user has participant account for this contest
                const participantAccountSeeds = [
                    new TextEncoder().encode("participent"),
                    getAddressEncoder().encode(address(contestId)), // ← Use contestId prop, not params
                    getAddressEncoder().encode(address(selectedWalletAccount!.account.address))
                ]

                const [participantPda] = await getProgramDerivedAddress({
                    seeds: participantAccountSeeds,
                    programAddress: address(ARBITRON_PROGRAM_ADDRESS!)
                })

                const participantInfo = await fetchMaybeParticipent(rpc, participantPda)

                if (!participantInfo.exists) {
                    // User hasn't joined this contest - redirect to home
                    console.log("❌ Unauthorized: User hasn't joined this contest")
                    router.push("/")
                    return
                }

                console.log("✅ User is authorized participant")

                // 2. Check contest status
                const contestInfo = await fetchMaybeContest(rpc, address(contestId))

                if (contestInfo.exists) {
                    const status = contestInfo.data.status
                    console.log("📊 Contest status:", status)

                    // ContestState enum: 0 = Upcoming, 1 = Ongoing, 2 = Completed
                    if (status === 1) { // Ongoing
                        // Contest is active - redirect to arena
                        console.log("🎮 Contest is ongoing - redirecting to arena")
                        router.push(`/arena/${contestId}`)
                        return
                    }
                }

                // User is authorized and contest is not ongoing yet - show lobby
                setIsAuthorized(true)
            } catch (error) {
                console.error("Error checking authorization:", error)
                // On error, redirect to home for safety
                router.push("/")
            } finally {
                setIsChecking(false)
            }
        }
    }, [rpc, selectedWalletAccount, ARBITRON_PROGRAM_ADDRESS, contestId, router])

    if (!selectedWalletAccount) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <GlassCard className="text-center">
                    <h1 className="text-2xl font-display font-bold neon-text-teal mb-4">Connect Your Wallet</h1>
                    <p className="text-muted-foreground mb-6">You need to connect your wallet to access the contest lobby.</p>
                    <ConnectWalletMenu>Connect Wallet</ConnectWalletMenu>
                </GlassCard>
            </div>
        )
    }

    if (isChecking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azure-teal mx-auto mb-4" />
                    <p className="text-muted-foreground font-mono">Verifying access...</p>
                </div>
            </div>
        )
    }

    if (!isAuthorized) {
        return null // Will redirect, so don't show anything
    }

    return (
        <ContestLobbyPage
            selectedWalletAccount={selectedWalletAccount}
            contestId={contestId}
        />
    )
}

export default ContestLobbyWrapper