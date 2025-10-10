"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet, Trophy, User, Home, Plus } from "lucide-react"
import { WalletConnectModal } from "@/components/wallet-connect-modal"
import { useState } from "react"

export function Navbar() {
  const [walletModalOpen, setWalletModalOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 transition-smooth hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">SolContest</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                href="/contests"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
              >
                <Trophy className="h-4 w-4" />
                Contests
              </Link>
              <Link
                href="/create"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Create
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            </div>

            {/* Connect Wallet Button */}
            <Button
              onClick={() => setWalletModalOpen(true)}
              className="group relative overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </div>
      </nav>

      <WalletConnectModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
    </>
  )
}
