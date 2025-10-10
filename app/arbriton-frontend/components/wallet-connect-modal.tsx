"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { useState } from "react"

interface WalletOption {
  name: string
  icon: string
  description: string
}

const wallets: WalletOption[] = [
  {
    name: "Phantom",
    icon: "https://phantom.app/img/phantom-logo.svg",
    description: "Popular Solana wallet",
  },
  {
    name: "Solflare",
    icon: "https://solflare.com/assets/logo.svg",
    description: "Secure & feature-rich",
  },
  {
    name: "Solana Mobile",
    icon: "https://solanamobile.com/favicon.ico",
    description: "Mobile-first wallet",
  },
]

interface WalletConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null)

  const handleConnect = (walletName: string) => {
    console.log(`[v0] Connecting to ${walletName}`)
    // Wallet connection logic would go here
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Connect Wallet</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose your preferred Solana wallet to get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {wallets.map((wallet) => (
            <Button
              key={wallet.name}
              variant="outline"
              className="group relative w-full justify-start gap-4 h-auto p-4 border-border bg-secondary/30 hover:bg-secondary hover:border-primary/50 transition-smooth overflow-hidden"
              onMouseEnter={() => setHoveredWallet(wallet.name)}
              onMouseLeave={() => setHoveredWallet(null)}
              onClick={() => handleConnect(wallet.name)}
            >
              {/* Hover glow effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 transition-opacity ${
                  hoveredWallet === wallet.name ? "opacity-100" : ""
                }`}
              />

              {/* Wallet icon */}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-background border border-border group-hover:border-primary/50 transition-smooth">
                <img src={wallet.icon || "/placeholder.svg"} alt={wallet.name} className="h-8 w-8" />
              </div>

              {/* Wallet info */}
              <div className="relative flex-1 text-left">
                <div className="font-semibold text-foreground">{wallet.name}</div>
                <div className="text-sm text-muted-foreground">{wallet.description}</div>
              </div>

              {/* Animated arrow */}
              <div className={`relative transition-transform ${hoveredWallet === wallet.name ? "translate-x-1" : ""}`}>
                <svg
                  className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Button>
          ))}
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold">No real token trading.</span> This is a game of skill where you compete
            based on portfolio strategy, not actual trades.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
