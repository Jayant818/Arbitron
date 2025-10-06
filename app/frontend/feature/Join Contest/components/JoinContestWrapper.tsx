"use client"
import { ConnectWalletMenu } from '@/components/ConnectWalletMenu'
import { GlassCard } from '@/components/ui/glass-card'
import { SelectedWalletAccountContext } from '@/context/SelectedWalletAccountContext'
import React, { useContext, useEffect } from 'react'
import JoinContestPage from './JoinContestPage'
import { RpcContext } from '@/context/RpcContext'
import {fetchMaybeParticipent} from "../../../../../dist/js-client/index"
import { getAddressEncoder,address, getProgramDerivedAddress } from '@solana/kit'
import { useRouter } from 'next/navigation'

const JoinContestWrapper = ({ contestId }:{ contestId: string }) => {

    const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)
    const { rpc } = useContext(RpcContext);
    const ARBITRON_PROGRAM_ADDRESS = process.env.NEXT_PUBLIC_PROGRAM_ID;
    const router = useRouter();
    
    useEffect(() => {
        if (!selectedWalletAccount || !selectedWalletAccount.account.address || !contestId) return;
        
        checkParticipantInfo();
        
        async function checkParticipantInfo() {
            try {
                // Check if user has already joined THIS specific contest
                // PDA seeds: ["participent", contest_pubkey, user_pubkey]
                const participantAccountSeeds = [
                    new TextEncoder().encode("participent"),
                    getAddressEncoder().encode(address(contestId)),
                    getAddressEncoder().encode(address(selectedWalletAccount!.account.address))
                ];

                const [participantPda] = await getProgramDerivedAddress({
                    seeds: participantAccountSeeds,
                    programAddress: address(ARBITRON_PROGRAM_ADDRESS!)
                });

                const participantInfo = await fetchMaybeParticipent(rpc, participantPda);

                if (participantInfo.exists) {
                    // User has already joined this contest - redirect to contest lobby
                    console.log("✅ User already joined this contest:", participantInfo.data);
                    console.log("📊 Score:", participantInfo.data.score, "| Rank:", participantInfo.data.rank);
                    router.push(`/contest/${contestId}`);
                } else {
                    // User hasn't joined yet - let them proceed to join page
                    console.log("ℹ️ User hasn't joined this contest yet. Showing join page.");
                }
            } catch(error) {
                // Account doesn't exist - user hasn't joined this contest
                console.log("ℹ️ User hasn't joined this contest. Ready to join.");
                console.debug("Error details:", error);
            }
        }

    },[rpc, selectedWalletAccount, ARBITRON_PROGRAM_ADDRESS, contestId, router])
    
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
      <JoinContestPage
        selectedWalletAccount={selectedWalletAccount}
      />
  )
}

export default JoinContestWrapper