"use client"

import { useQuery } from "@tanstack/react-query"
import { useSolana } from "@/components/solana-provider"
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token"
import { address } from "@solana/kit"
import { USDC_MINT_ADDRESS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Coins } from "lucide-react"

const useUsdcBalance = () => {
  const { rpc, selectedAccount, isConnected } = useSolana()

  return useQuery({
    queryKey: ["usdc-balance", selectedAccount?.address],
    queryFn: async () => {
      if (!isConnected || !selectedAccount) {
        return null
      }

      const [userAta] = await findAssociatedTokenPda({
        mint: USDC_MINT_ADDRESS,
        owner: address(selectedAccount.address),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      })

      try {
        const balance = await rpc.getTokenAccountBalance(userAta).send()
        return Number(balance.value.uiAmount)
      } catch (error) {
        // This likely means the ATA doesn't exist yet
        console.log("Could not fetch USDC balance, ATA likely not created.")
        return 0
      }
    },
    enabled: isConnected && !!selectedAccount,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function UsdcBalance() {
  const { data: balance, isLoading, error } = useUsdcBalance()

  const handleFaucet = () => {
    window.open("https://spl-token-faucet.com/?token-name=USDC-Dev", "_blank")
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-background/30 p-4 backdrop-blur-sm">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">USDC Balance</span>
        </div>
        <div className="mt-1 text-2xl font-bold gradient-text">
          {isLoading
            ? "Loading..."
            : error
            ? "Error"
            : `${balance?.toFixed(2) ?? "0.00"} USDC`}
        </div>
        <p className="text-xs text-muted-foreground">
          This is your wallet&apos;s devnet USDC balance.
        </p>
      </div>
      <Button onClick={handleFaucet} variant="outline" className="glass-button h-12 cursor-pointer">
        Get Free Devnet USDC
      </Button>
    </div>
  )
}