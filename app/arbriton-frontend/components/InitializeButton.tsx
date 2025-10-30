import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { 
  createTransactionMessage, 
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signAndSendTransactionMessageWithSigners,
  pipe,
  getBase58Decoder,
  address
} from "@solana/kit"
import { Address } from "@solana/kit"
import { useSolana } from "@/components/solana-provider"
import { useWalletAccountTransactionSendingSigner } from "@solana/react"
import { ARBITRON_PROGRAM_ADDRESS, getInitializeInstructionAsync } from "../../../dist/js-client/index"

const PLATFORM_FEE_WALLET = "5t8GGCwYNnvB3JwBjU5muUtchntK389CHCAEMiLwrHj9" as Address
const PLATFORM_FEE_BPS = 50 // 0.5% fees

export function InitializeButton() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { selectedAccount, chain } = useSolana()
  const signer = useWalletAccountTransactionSendingSigner(selectedAccount!, chain)

  const handleInitialize = async () => {
    if (!selectedAccount || !signer) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsInitializing(true)

    try {
      console.log("Initializing platform with:")
      console.log("Admin:", signer.address)
      console.log("Platform Fee Wallet:", PLATFORM_FEE_WALLET)
      console.log("Platform Fee BPS:", PLATFORM_FEE_BPS)

      // Create the initialize instruction
      const initializeIx = await getInitializeInstructionAsync({
        admin: signer,
        platformFeeWallet: PLATFORM_FEE_WALLET,
          platformFeeBps: PLATFORM_FEE_BPS,
        platformFeeWalletMint: address("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr")
      }, {
        programAddress: ARBITRON_PROGRAM_ADDRESS
      })

      // Get latest blockhash
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8899"
      const rpcResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
        }),
      })
      const { result } = await rpcResponse.json()
      const blockhash = result.value

      // Create transaction message
      const txMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
        (tx) => appendTransactionMessageInstructions([initializeIx], tx)
      )

      // Sign and send transaction
      const signatureBytes = await signAndSendTransactionMessageWithSigners(txMessage)
      const signature = getBase58Decoder().decode(signatureBytes)

      console.log("✅ Platform initialized successfully! Signature:", signature)
      toast.success("Platform initialized successfully!")
      setIsInitialized(true)

    } catch (error) {
      console.error("Initialize failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Initialization failed: ${errorMessage}`)
    } finally {
      setIsInitializing(false)
    }
  }

  if (isInitialized) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <div className="h-2 w-2 bg-green-600 rounded-full" />
        <span className="text-sm font-medium">Platform Initialized</span>
      </div>
    )
  }

  return (
    <Button
      onClick={handleInitialize}
      disabled={isInitializing || !selectedAccount}
      className="bg-primary hover:bg-primary/90 text-white font-semibold"
    >
      {isInitializing ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Initializing Platform...
        </div>
      ) : (
        "Initialize Platform (One-Time Setup)"
      )}
    </Button>
  )
}
