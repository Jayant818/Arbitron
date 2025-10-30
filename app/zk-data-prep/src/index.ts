import "dotenv/config";
import { redis } from "@arbitron/shared-redis";
import { getContestByIdWithParticipantsAndSelectedTokens } from "@arbitron/db";
import axios from "axios";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { keccak_256 } from "@noble/hashes/sha3";
import { randomBytes } from "crypto";
import fs from "fs";
import BN from "bn.js";

// Import the IDL
import idl from "../../../target/idl/arbitron.json";
import type { Arbitron } from "../../../target/types/arbitron";

// --- Constants ---
const BONSOL_PROGRAM_ID = new PublicKey(
  "BoNsHRcyLLNdtnoDf8hiCNZpyehMC4FDMxs6NTxFi3ew"
);
const ARBITRON_IMAGE_ID =
  "99335b36ecc5af75e07959a6cee135735aa21cd77ade7bfbd78779f5ae0af05a";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8899";
const PAYER_KEYPAIR_PATH =
  process.env.PAYER_KEYPAIR_PATH || "./host-arbitron-wallet.json";
const MAX_CHUNK_SIZE = 832; // Conservative chunk size
const END_CONTEST_QUEUE = "ended-contests";

// --- Helper Functions ---
interface IPriceUpdate {
  usdPrice: number;
  blockId: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function calculatePnl(
  finalPrice: bigint,
  entryPrice: bigint,
  quantity: bigint,
  isPowerToken: boolean
): bigint {
  try {
    let pnl = (finalPrice - entryPrice) * quantity;
    if (isPowerToken) {
      pnl = pnl * 2n; // 2n is BigInt for 2
    }
    return pnl;
  } catch (e) {
    console.error("Error in PNL calculation:", e);
    return 0n; // Return 0 as a BigInt
  }
}

async function getJupiterPrices(
  tokenMints: Set<string>
): Promise<Map<string, bigint>> {
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

function getContestPDA(
  contestName: string,
  host: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("contest"), Buffer.from(contestName), host.toBuffer()],
    programId
  );
  return pda;
}

function getContestInputsPDA(
  contest: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("contest_inputs"), contest.toBuffer()],
    programId
  );
  return pda;
}

function getExecutionRequestPDA(
  payer: PublicKey,
  executionId: string
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("execution"), payer.toBuffer(), Buffer.from(executionId)],
    BONSOL_PROGRAM_ID
  );
  return pda;
}

function getDeploymentPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("deployment"), Buffer.from(keccak_256(ARBITRON_IMAGE_ID))],
    BONSOL_PROGRAM_ID
  );
  return pda;
}

async function main() {
  console.log("[Worker]: 🚀 zk-data-prep worker starting (Anchor version)...");

  // Test Redis connection
  try {
    console.log("[Worker]: Testing Redis connection...");
    await redis.ping();
    console.log("[Worker]: ✅ Redis connection successful");

    const queueLength = await redis.lLen(END_CONTEST_QUEUE);
    console.log(
      `[Worker]: Current queue "${END_CONTEST_QUEUE}" length: ${queueLength}`
    );
  } catch (error) {
    console.error("[Worker]: ❌ Failed to connect to Redis:", error);
    process.exit(1);
  }

  // Setup Anchor
  console.log("[Worker]: Initializing Anchor provider...");
  const connection = new Connection(RPC_URL, "confirmed");

  console.log("[Worker]: Loading payer keypair from:", PAYER_KEYPAIR_PATH);
  const payerKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(PAYER_KEYPAIR_PATH, "utf-8")))
  );
  console.log(
    "[Worker]: Payer wallet loaded:",
    payerKeypair.publicKey.toString()
  );

  const wallet = new Wallet(payerKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const program = new Program(idl as Arbitron, provider);
  console.log("[Worker]: Program ID:", program.programId.toString());

  console.log(`[Worker]: ✅ All systems ready!`);
  console.log(`[Worker]: 👂 Listening on Redis queue: "${END_CONTEST_QUEUE}"`);
  console.log("[Worker]: Waiting for contests to process...\n");

  while (true) {
    console.log(
      `[Worker]: [${new Date().toISOString()}] Blocking on queue "${END_CONTEST_QUEUE}"...`
    );
    const contestId = await redis.brPop(END_CONTEST_QUEUE, 0);
    if (!contestId) continue;

    console.log(
      `[Worker]: Received contest ID to process: ${contestId.element}`
    );

    try {
      // Fetch contest data
      const contest = await getContestByIdWithParticipantsAndSelectedTokens(
        contestId.element
      );
      if (!contest) {
        console.error(
          `[Worker]: Contest with ID ${contestId.element} not found. Skipping.`
        );
        continue;
      }

      // Get unique tokens and fetch prices
      const uniqueSelectedTokens = new Set<string>();
      contest.participants.forEach((p) => {
        p.SelectedTokens.forEach((t) => uniqueSelectedTokens.add(t.mint));
      });
      const finalPricesMap = await getJupiterPrices(uniqueSelectedTokens);

      // Derive PDAs
      const contestPDA = getContestPDA(
        contest.name,
        new PublicKey(contest.host),
        program.programId
      );
      const contestInputsPDA = getContestInputsPDA(
        contestPDA,
        program.programId
      );

      console.log(`[Worker]: Contest PDA: ${contestPDA.toString()}`);
      console.log(
        `[Worker]: Contest Inputs PDA: ${contestInputsPDA.toString()}`
      );

      // Create payload
      const jobPayload = {
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
      console.log(
        `[Worker]: Preparing to send ${payloadBytes.length} bytes of data in chunks...`
      );

      // --- Send First Chunk (storeContestInputs) ---
      const firstChunk = payloadBytes.subarray(
        0,
        Math.min(MAX_CHUNK_SIZE, payloadBytes.length)
      );
      console.log(
        `[Worker]: Sending first chunk (${firstChunk.length} bytes)...`
      );

      const storeIx = await program.methods
        .storeContestInputs(Buffer.from(firstChunk))
        .accounts({
          contest: contestPDA,
          contestInputs: contestInputsPDA,
          payer: payerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const storeTx = new anchor.web3.Transaction().add(storeIx);
      const storeSig = await provider.sendAndConfirm(storeTx);
      console.log(`[Worker]:   Tx Confirmed! Signature: ${storeSig}`);

      // --- Send Remaining Chunks (appendContestInputs) ---
      let offset = firstChunk.length;
      while (offset < payloadBytes.length) {
        const end = Math.min(offset + MAX_CHUNK_SIZE, payloadBytes.length);
        const chunk = payloadBytes.subarray(offset, end);
        console.log(
          `[Worker]: Sending chunk at offset ${offset} (${chunk.length} bytes)...`
        );

        const appendIx = await program.methods
          .appendContestInputs(offset, Buffer.from(chunk))
          .accounts({
            contest: contestPDA,
            contestInputs: contestInputsPDA,
            payer: payerKeypair.publicKey,
          })
          .instruction();

        const appendTx = new anchor.web3.Transaction().add(appendIx);
        const appendSig = await provider.sendAndConfirm(appendTx);
        console.log(`[Worker]:   Tx Confirmed! Signature: ${appendSig}`);

        offset += chunk.length;
      }
      console.log(`[Worker]: ✅ All data chunks sent successfully.`);

      // --- ADD THIS DELAY ---
      console.log(`[Worker]: Waiting 10 seconds for RPC nodes to sync...`);
      await sleep(10000); // 10-second delay
      console.log(`[Worker]: Resuming proof request.`);
      // --- END OF ADDED DELAY ---

      console.log(
        `[Worker]: Verifying account data on-chain to prevent 0x26 error...`
      );
      const expectedDataLength = payloadBytes.length;
      let onChainDataLength = 0;

      while (onChainDataLength < expectedDataLength) {
        try {
          const contestInputsAccount = await connection.getAccountInfo(
            contestInputsPDA
          );
          if (contestInputsAccount && contestInputsAccount.data) {
            // Read actual data length from the Anchor account
            // 8 (disc) + 32 (pubkey) = 40. Length is at byte 40.
            const dataVecLength = contestInputsAccount.data.readUInt32LE(40);
            onChainDataLength = dataVecLength;
          }
        } catch (e) {
          console.warn("[Worker]: Polling... account not found yet.");
        }

        if (onChainDataLength < expectedDataLength) {
          console.log(
            `[Worker]: Polling... On-chain data ${onChainDataLength} bytes. Waiting for ${expectedDataLength} bytes.`
          );
          await sleep(2000); // Wait 2 seconds
        }
      }
      console.log(
        `[Worker]: ✅ RPC node is synced! On-chain data ${onChainDataLength} bytes.`
      );

      // --- Request Proof ---
      console.log(`[Worker]: Building final transaction: Request Proof...`);
      const executionId = randomBytes(16).toString("hex");

      const tip = new BN(100_000_0);

      const executionRequestPDA = getExecutionRequestPDA(
        payerKeypair.publicKey,
        executionId
      );

      const deploymentPDA = getDeploymentPDA();

      console.log(
        `[Worker]: Execution Request PDA: ${executionRequestPDA.toString()}`
      );
      console.log(`[Worker]: Deployment PDA: ${deploymentPDA.toString()}`);

      const requestProofIx = await program.methods
        .requestEndContestProof(executionId, tip)
        .accounts({
          payer: payerKeypair.publicKey,
          contest: contestPDA,
          contestInputs: contestInputsPDA,
          executionRequest: executionRequestPDA,
          deploymentAccount: deploymentPDA,
          arbitronProgram: program.programId,
          bonsolProgram: BONSOL_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const proofTx = new anchor.web3.Transaction().add(requestProofIx);
      const proofSig = await provider.sendAndConfirm(proofTx);
      console.log(
        `[Worker]: ✅ Final transaction confirmed! Signature: ${proofSig}`
      );
      console.log(
        `[Worker]: Successfully processed contest ${contestId.element}.`
      );

      // --- Calculate Winner Off-Chain ---
      console.log(`[Worker]: Calculating winner off-chain...`);

      let maxPnl = -Infinity; // Use regular number for comparison
      let winnerPublicKey = SystemProgram.programId; // Default to system program

      // Convert prices map to BigInt
      const finalPricesBigInt = new Map<string, bigint>();
      for (const [mint, priceStr] of finalPricesMap.entries()) {
        finalPricesBigInt.set(mint, BigInt(priceStr));
      }

      for (const participant of jobPayload.participants) {
        let participantPnl = 0n; // Use BigInt for calculation

        for (const token of participant.selectedTokens) {
          const finalPrice = finalPricesBigInt.get(token.mint);
          if (finalPrice === undefined) {
            console.warn(
              `Missing final price for ${token.mint}, skipping token.`
            );
            continue;
          }

          const entryPrice = BigInt(token.entryPrice || 0);
          const quantity = BigInt(token.quantity);

          const tokenPnl = calculatePnl(
            finalPrice,
            entryPrice,
            quantity,
            token.isPowerToken
          );

          participantPnl += tokenPnl;
        }

        console.log(
          `[Worker]: Participant ${
            participant.userPublicKey
          } PNL: ${participantPnl.toString()}`
        );

        // Compare using BigInt
        if (
          maxPnl === -Infinity ||
          participantPnl > BigInt(maxPnl.toString())
        ) {
          maxPnl = Number(participantPnl.toString()); // Store as number for easy comparison
          winnerPublicKey = new PublicKey(participant.userPublicKey);
        }
      }

      // Handle case where no participants or all PNLs are negative
      if (maxPnl === -Infinity) {
        maxPnl = 0;
      }

      const maxPnlBN = new BN(maxPnl.toString());

      console.log(
        `[Worker]: Off-chain winner determined: ${winnerPublicKey.toString()}`
      );
      console.log(`[Worker]: Off-chain Max PNL: ${maxPnlBN.toString()}`);

      // --- Call new 'setContestWinner' instruction ---
      console.log(
        `[Worker]: Building final transaction: Set Contest Winner...`
      );

      const setWinnerIx = await program.methods
        .setContestWinner(winnerPublicKey, maxPnlBN)
        .accounts({
          host: payerKeypair.publicKey, // The signer
          contest: contestPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const proof_Tx = new anchor.web3.Transaction().add(setWinnerIx);
      const proof_Sig = await provider.sendAndConfirm(proof_Tx);

      console.log(
        `[Worker]: ✅ Final transaction confirmed! Signature: ${proof_Sig}`
      );
      console.log(
        `[Worker]: Successfully processed contest ${contestId.element}.`
      );
    } catch (error) {
      console.error(
        `[Worker]: Failed to process contest ${contestId.element}:`,
        error
      );
      if (error instanceof anchor.AnchorError) {
        console.error(
          `[Worker]: Anchor Error Code: ${error.error.errorCode.code}`
        );
        console.error(
          `[Worker]: Anchor Error Message: ${error.error.errorMessage}`
        );
        console.error(`[Worker]: Program Logs:`, error.logs);
      }
    }
  }
}

main().catch((err) => {
  console.log("[Worker]: Error in main loop:", err);
  process.exit(1);
});
