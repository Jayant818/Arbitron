"use client"
import { ConnectWalletMenu } from '@/components/ConnectWalletMenu'
import { GlassCard } from '@/components/ui/glass-card'
import { SelectedWalletAccountContext } from '@/context/SelectedWalletAccountContext'
import React, { useContext } from 'react'
import TradingArenaPage from './TradingArenaPage'

const TradingArenaWrapper = () => {
    const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)
    
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
    <TradingArenaPage/>
  )
}

export default TradingArenaWrapper