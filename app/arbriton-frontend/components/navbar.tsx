"use client"

import Link from "next/link"
import { Trophy, User, Home, Plus } from "lucide-react"
import { WalletConnectButton } from "./wallet-connect-button"

export function Navbar() {

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 transition-smooth hover:opacity-80">
              {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              </div> */}
              <span className="text-2xl font-bold text-white uppercase leading-tight border-dashed border-2 border-[#7A6F4B] p-2 ">Arbitron</span>
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

           <WalletConnectButton />
          </div>
        </div>
      </nav>

    </>
  )
}
