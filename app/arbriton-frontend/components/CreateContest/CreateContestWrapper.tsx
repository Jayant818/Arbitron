"use client"

import { useContext } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { SelectedWalletAccountContext } from "@/context/SelectedWalletAccountContext"
import { ConnectWalletMenu } from "@/components/ConnectWalletMenu"
import CreateContestPage from "./CreateContestPage"
import { Wallet } from "lucide-react"

export default function CreateContestWrapper() {
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext)

  if (!selectedWalletAccount) {
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
            <ConnectWalletMenu>
              <Button variant="default" size="lg" className="rounded-xl">
                Connect Wallet
              </Button>
            </ConnectWalletMenu>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <CreateContestPage account={selectedWalletAccount.account} />
}
