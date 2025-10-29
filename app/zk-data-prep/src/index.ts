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
  "679cc01fe324f755ed1df22e46df03ed84f40101c46e9cd452ec306b88951749";
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
        contestAddress: contestPDA.toString(),
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

      // --- Request Proof ---
      console.log(`[Worker]: Building final transaction: Request Proof...`);
      const executionId = randomBytes(16).toString("hex");

      const tip = new BN(100_000);

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
