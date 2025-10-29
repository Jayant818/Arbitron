"use client"

import { useContext } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { useSolana } from "@/components/solana-provider";
import { WalletConnectButton } from "@/components/wallet-connect-button";

import { Wallet } from "lucide-react"

export default function CreateContestWrapper() {
  const { selectedAccount } = useSolana();

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center shadow-md border border-border/50">
          <CardHeader>
            <div className="flex flex-col items-center gap-2">
              <Wallet className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Connect Your Wallet</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need to connect your wallet to create a contest.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <WalletConnectButton/>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <div>Create contest page is under construction.</div>
}
