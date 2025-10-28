import "dotenv/config";
import {
  address,
  appendTransactionMessageInstructions,
  assertIsTransactionMessageWithinSizeLimit,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
  getCreateAssociatedTokenInstructionAsync,
  // getMintToInstruction, // <-- We don't need this anymore
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS, // <-- Add this import
} from "@solana-program/token";
import fs from "fs";

async function main() {
  const PATH = process.env.CRANK_KEYPAIR_PATH;
  console.log("CRANK_KEYPAIR_PATH:", PATH);

  const RPC_URL = process.env.RPC_URL;
  const WS_RPC_URL = process.env.WS_RPC_URL;

  const rpc = createSolanaRpc(RPC_URL!);
  const rpcSubscriptions = createSolanaRpcSubscriptions(WS_RPC_URL!);

  if (!PATH) {
    throw new Error("CRANK_KEYPAIR_PATH environment variable is not set");
  }

  const USER_ACCOUNT = await createKeyPairSignerFromBytes(
    Uint8Array.from(JSON.parse(fs.readFileSync(PATH, "utf-8")))
  );

  const PROGRAM_ADDRESS = address(
    "4sN8PnN2ki2W4TFXAfzR645FWs8nimmsYeNtxM8RBK6A"
  );

  const MINT_ADDRESS = address("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

  console.log("Minting USD Tokens...");

  const [user_ATA, bump] = await findAssociatedTokenPda({
    mint: MINT_ADDRESS,
    owner: USER_ACCOUNT.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  // This instruction is still needed, in case your ATA doesn't exist yet
  const createATAIX = await getCreateAssociatedTokenInstructionAsync({
    mint: MINT_ADDRESS,
    owner: USER_ACCOUNT.address,
    payer: USER_ACCOUNT,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  // -----------------------------------------------------------------
  // START: THE FIX
  // -----------------------------------------------------------------

  // This is the raw instruction data from the website's transaction
  const faucetIxData = new Uint8Array([
    0x71, 0xad, 0x24, 0xee, 0x26, 0x98, 0x16, 0x75, 0xff, 0x00, 0xca, 0x9a,
    0x3b, 0x00, 0x00, 0x00,
  ]);

  // This is the instruction to call the FAUCET PROGRAM, not mintTo
  const faucetIx = {
    programAddress: PROGRAM_ADDRESS,
    accounts: [
      // #1: The Mint
      { address: MINT_ADDRESS, isWritable: true, isSigner: false },
      // #2: Your ATA
      { address: user_ATA, isWritable: true, isSigner: false },
      // #3: Your Wallet (Fee Payer / Signer)
      { address: USER_ACCOUNT.address, isWritable: true, isSigner: true },
      // #4: Your Wallet (again, as required by the program)
      { address: USER_ACCOUNT.address, isWritable: true, isSigner: true },

      // --- USE THE HARDCODED VALUES HERE ---
      // #5: System Program
      {
        address: address("11111111111111111111111111111111"),
        isWritable: false,
        isSigner: false,
      },
      // #6: Token Program
      { address: TOKEN_PROGRAM_ADDRESS, isWritable: false, isSigner: false },
      // #7: Associated Token Account Program
      {
        address: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
        isWritable: false,
        isSigner: false,
      },
      // #8: Rent Program
      {
        address: address("SysvarRent111111111111111111111111111111111"),
        isWritable: false,
        isSigner: false,
      },
      // --- END OF CHANGE ---
    ],
    data: faucetIxData,
  };

  // -----------------------------------------------------------------
  // END: THE FIX
  // -----------------------------------------------------------------

  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(USER_ACCOUNT, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    // We send BOTH instructions. The createATAIX will be skipped if the
    // account already exists, and the faucetIx will run.
    (tx) => appendTransactionMessageInstructions([createATAIX, faucetIx], tx)
  );

  assertIsTransactionMessageWithinSizeLimit(txMessage);

  const signedTx = await signTransactionMessageWithSigners(txMessage);

  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const signature = await getSignatureFromTransaction(signedTx);

  console.log(`[Crank]:   Sending transaction: ${signature}`);

  await sendAndConfirm(signedTx, { commitment: "confirmed" });

  console.log(`[Crank]:   Transaction confirmed: ${signature}`);

  const balance = await rpc.getTokenAccountBalance(user_ATA).send();

  console.log(
    `[Crank]:   New token balance for account ${user_ATA}: ${balance.value.uiAmountString}`
  );
}

main().catch((error) => {
  console.error("[Crank]: Fatal error in crank service:", error);
  process.exit(1);
});
