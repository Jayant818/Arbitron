"use client"

import { useContext } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { NeonButton } from "@/components/ui/neon-button"
import { ConnectWalletMenu } from "@/components/ConnectWalletMenu"
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext"
import { ArrowLeft, Home } from "lucide-react"
import { DropdownMenu } from "@radix-ui/themes"

export function GlobalHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)
  
  const isHomePage = pathname === "/"
  
  return (
    <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isHomePage && (
            <NeonButton variant="outline" size="sm" onClick={() => router.back()} className="animate-scale-hover">
              <ArrowLeft className="w-4 h-4" />
              Back
            </NeonButton>
          )}
          <div 
            className="text-xl font-display font-bold neon-text-teal tracking-wider cursor-pointer hover:opacity-80 transition-opacity animate-glow"
            onClick={() => router.push("/")}
          >
            ARBITRON
          </div>
          {!isHomePage && (
            <NeonButton variant="ghost" size="sm" onClick={() => router.push("/")} className="animate-scale-hover">
              <Home className="w-4 h-4" />
              Home
            </NeonButton>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-deep-purple border-deep-purple font-mono">
            BETA
          </Badge>
          
          {/* Show wallet info if connected, otherwise show connect button */}
          {selectedWalletAccount ? (
            <div className="flex items-center gap-3">
              <ConnectWalletMenu>
                <div className="text-sm font-mono animate-scale-hover">
                  <div className="text-azure-teal">
                    {selectedWalletAccount.account.address.slice(0, 4)}...{selectedWalletAccount.account.address.slice(-4)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedWalletAccount.wallet.name}
                  </div>
                  <DropdownMenu.TriggerIcon />
                </div>
              </ConnectWalletMenu>
            </div>
          ) : (
            <ConnectWalletMenu>
              <NeonButton variant="outline" size="sm" className="animate-glow">
                Connect Wallet
                <DropdownMenu.TriggerIcon />
              </NeonButton>
            </ConnectWalletMenu>
          )}
        </div>
      </div>
    </header>
  )
}