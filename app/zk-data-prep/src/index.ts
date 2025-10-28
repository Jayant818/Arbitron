import "dotenv/config";
import { redis } from "@arbitron/shared-redis";
import { getContestByIdWithParticipantsAndSelectedTokens } from "@arbitron/db";
import axios from "axios";
import { ARBITRON_PROGRAM_ADDRESS } from "../../../dist/js-client/index";
import {
  address,
  Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  assertIsTransactionMessageWithinSizeLimit,
  pipe,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  airdropFactory,
  lamports,
  createKeyPairSignerFromBytes,
  KeyPairSigner,
  Instruction,
  devnet,
} from "@solana/kit";
import { keccak_256 } from "@noble/hashes/sha3";
import { randomBytes } from "crypto";
import fs from "fs";

// Import BOTH instruction builders
import {
  getStoreContestInputsInstructionAsync,
  StoreContestInputsAsyncInput,
} from "../../../dist/js-client/instructions/storeContestInputs";
// --- NEW: Import the append instruction (assuming you generated it) ---
import {
  getAppendContestInputsInstructionAsync, // You'll need to generate this
  AppendContestInputsAsyncInput, // You'll need to generate this
} from "../../../dist/js-client/instructions/appendContestInputs"; // Adjust path
import {
  getRequestEndContestProofInstructionAsync,
  RequestEndContestProofAsyncInput,
} from "../../../dist/js-client/instructions/requestEndContestProof";

// --- Constants ---
const BONSOL_PROGRAM_ID = address(
  "BoNsHRcyLLNdtnoDf8hiCNZpyehMC4FDMxs6NTxFi3ew"
);
const ARBITRON_IMAGE_ID =
  "c3a3dc0e28f164c1925013f2e35e2daecc6c38762a5080f47956050117462ce8";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8899";
const WS_RPC_URL = process.env.WS_RPC_URL || "ws://127.0.0.1:8900";
const PAYER_KEYPAIR_PATH =
  process.env.PAYER_KEYPAIR_PATH || "./host-arbitron-wallet.json"; // Adjusted relative path

// --- Transaction Constants ---
const TRANSACTION_OVERHEAD = 200; // Estimated bytes for signatures, accounts, etc. Adjust as needed.
const MAX_CHUNK_SIZE = 1232 - TRANSACTION_OVERHEAD; // Max data per append tx
const END_CONTEST_QUEUE = "ended-contests";

// --- Helper Functions (getJupiterPrices, getContestPDA - No changes needed) ---
interface IPriceUpdate {
  usdPrice: number;
  blockId: number;
}
async function getJupiterPrices(
  tokenMints: Set<string>
): Promise<Map<string, bigint>> {
  /* ... (same as before) ... */
  const mints = Array.from(tokenMints);
  const data: Record<string, IPriceUpdate> = {};
  const finalPrices = new Map<string, bigint>();
  try {
    for (let i = 0; i < mints.length; i = i + 50) {
      const res = await axios.get<Record<string, IPriceUpdate>>(
        `https://lite-api.jup.ag/price/v3?ids=${mints
          .slice(i, i + 50)
          .join(",")}`
      );
      Object.assign(data, res.data);
    }
    for (const mint in data) {
      const priceUpdate = data[mint];
      const scaledPrice = BigInt(Math.round(priceUpdate.usdPrice * 1_000_000));
      finalPrices.set(mint, scaledPrice);
    }
    for (const mint of mints) {
      if (!finalPrices.has(mint)) {
        console.warn(
          `[Worker]: Missing final price for mint ${mint}. Setting to 0.`
        );
        finalPrices.set(mint, BigInt(0));
      }
    }
    return finalPrices;
  } catch (error) {
    console.error("[Worker]: Failed to fetch Jupiter prices:", error);
    throw error;
  }
}
async function getContestPDA(
  contestName: string,
  host: Address
): Promise<Address> {
  /* ... (same as before) ... */
  const [contestPDA] = await getProgramDerivedAddress({
    programAddress: address(ARBITRON_PROGRAM_ADDRESS),
    seeds: [
      new TextEncoder().encode("contest"),
      new TextEncoder().encode(contestName),
      getAddressEncoder().encode(host),
    ],
  });
  return contestPDA;
}

async function sendAndConfirmSingleInstruction(
  instruction: Instruction,
  payer: KeyPairSigner,
  rpc: any,
  rpcSubscriptions: any
): Promise<string> {
  const { value: blockhash } = await rpc.getLatestBlockhash().send();
  const tx = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstructions([instruction], tx)
  );
  assertIsTransactionMessageWithinSizeLimit(tx); // Should pass if chunk size is right
  const signedTx = await signTransactionMessageWithSigners(tx);
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });
  const signature = await getSignatureFromTransaction(signedTx);
  console.log(`[Worker]:   Sending Tx... Signature: ${signature}`);
  await sendAndConfirmTransaction(signedTx, { commitment: "confirmed" });
  console.log(`[Worker]:   Tx Confirmed!`);
  return signature;
}

async function main() {
  console.log("[Worker]: zk-tx-submitter worker started...");

  const rpc = createSolanaRpc(devnet(RPC_URL));
  const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(WS_RPC_URL));
  const payer = await createKeyPairSignerFromBytes(
    Uint8Array.from(JSON.parse(fs.readFileSync(PAYER_KEYPAIR_PATH, "utf-8")))
  );

  while (true) {
    const contestId = await redis.brPop(END_CONTEST_QUEUE, 0);
    if (!contestId) continue;
    console.log(
      `[Worker]: Received contest ID to process: ${contestId.element}`
    );

    try {
      const contest = await getContestByIdWithParticipantsAndSelectedTokens(
        contestId.element
      );
      if (!contest) {
        console.error(
          `[Worker]: Contest with ID ${contestId.element} not found. Skipping.`
        );
        continue;
      }
      const uniqueSelectedTokens = new Set<string>();
      contest.participants.forEach((p) => {
        p.SelectedTokens.forEach((t) => uniqueSelectedTokens.add(t.mint));
      });
      const finalPricesMap = await getJupiterPrices(uniqueSelectedTokens);
      const contestPDA = await getContestPDA(
        contest.name,
        address(contest.host)
      );

      // --- 2. Payload Creation ---
      const jobPayload = {
        contestAddress: contestPDA as string,
        participants: contest.participants.map((p) => ({
          userPublicKey: p.user.publicKey,
          selectedTokens: p.SelectedTokens.map((t) => ({
            mint: t.mint,
            isPowerToken: t.isPowerToken,
            quantity: t.quantity,
            entryPrice: t.entryPrice?.toString(),
          })),
        })),
        finalPrices: Array.from(finalPricesMap.entries()).map(
          ([mint, price]) => ({
            mint: mint,
            price: price.toString(),
          })
        ),
      };
      const payloadBytes = Buffer.from(JSON.stringify(jobPayload));
      const tip = 100_000n;
      const execution_id = randomBytes(16).toString("hex");
      const contestAddress = address(contestPDA);

      // --- 3. Derive PDAs ---
      const [contestInputsPda] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ADDRESS,
        seeds: [
          new TextEncoder().encode("contest_inputs"),
          getAddressEncoder().encode(contestAddress),
        ],
      });
      const [executionRequestAccountPda] = await getProgramDerivedAddress({
        programAddress: BONSOL_PROGRAM_ID,
        seeds: [
          new TextEncoder().encode("execution"),
          getAddressEncoder().encode(payer.address),
          new TextEncoder().encode(execution_id),
        ],
      });
      const [deploymentAccountPda] = await getProgramDerivedAddress({
        programAddress: BONSOL_PROGRAM_ID,
        seeds: [
          new TextEncoder().encode("deployment"),
          keccak_256(ARBITRON_IMAGE_ID),
        ],
      });
      console.log(`[Worker]: Contest Inputs PDA: ${contestInputsPda}`);

      // --- 4. Send Data in Chunks ---
      console.log(
        `[Worker]: Preparing to send ${payloadBytes.length} bytes of data in chunks...`
      );

      // Send Initial Chunk (using storeContestInputs for init)
      const firstChunk = payloadBytes.subarray(
        0,
        Math.min(MAX_CHUNK_SIZE, payloadBytes.length)
      );
      console.log(
        `[Worker]: Sending first chunk (${firstChunk.length} bytes)...`
      );
      const storeIxInput: StoreContestInputsAsyncInput = {
        contest: contestAddress,
        contestInputs: address(contestInputsPda),
        payer: payer,
        firstChunk: firstChunk,
      };
      const storeIx = await getStoreContestInputsInstructionAsync(storeIxInput);
      await sendAndConfirmSingleInstruction(
        storeIx,
        payer,
        rpc,
        rpcSubscriptions
      );

      // Send Remaining Chunks (using appendContestInputs)
      let offset = firstChunk.length;
      while (offset < payloadBytes.length) {
        const end = Math.min(offset + MAX_CHUNK_SIZE, payloadBytes.length);
        const chunk = payloadBytes.subarray(offset, end);
        console.log(
          `[Worker]: Sending chunk at offset ${offset} (${chunk.length} bytes)...`
        );

        const appendIxInput: AppendContestInputsAsyncInput = {
          contest: contestAddress, // Needed for PDA derivation in instruction builder
          contestInputs: address(contestInputsPda),
          payer: payer,
          offset: offset, // Pass the offset
          chunk: chunk, // Pass the data chunk
        };
        const appendIx = await getAppendContestInputsInstructionAsync(
          appendIxInput
        );
        await sendAndConfirmSingleInstruction(
          appendIx,
          payer,
          rpc,
          rpcSubscriptions
        );

        offset += chunk.length;
      }
      console.log(`[Worker]: ✅ All data chunks sent successfully.`);

      // --- 5. Transaction FINAL: Request Proof ---
      console.log(`[Worker]: Building final transaction: Request Proof...`);
      const requestProofInput: RequestEndContestProofAsyncInput = {
        contest: contestAddress,
        contestInputs: address(contestInputsPda), // Reference the PDA
        payer: payer,
        tip: tip,
        bonsolProgram: BONSOL_PROGRAM_ID,
        executionId: execution_id,
        deploymentAccount: address(deploymentAccountPda),
        executionRequest: address(executionRequestAccountPda),
      };
      const requestProofIx = await getRequestEndContestProofInstructionAsync(
        requestProofInput
      );

      await sendAndConfirmSingleInstruction(
        requestProofIx,
        payer,
        rpc,
        rpcSubscriptions
      );
      console.log(
        `[Worker]: ✅ Final transaction confirmed! ZK proof requested.`
      );
      console.log(
        `[Worker]: Successfully processed contest ${contestId.element}.`
      );
    } catch (error) {
      console.error(
        `[Worker]: Failed to process contest ${contestId.element}:`,
        error
      );
      // Optional: Add retry logic or push back to queue if needed
      // await redis.lPush(END_CONTEST_QUEUE, contestId.element);
    }
  }
}

main().catch((err) => {
  console.log("[Worker]: Error in main loop:", err);
  process.exit(1);
});
