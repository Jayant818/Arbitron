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
  createKeyPairSignerFromPrivateKeyBytes,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  airdropFactory,
  lamports,
} from "@solana/kit";

import { randomBytes } from "crypto";
import fs from "fs";
import {
  getStoreContestInputsInstructionAsync,
  StoreContestInputsAsyncInput,
} from "../../../dist/js-client/instructions/storeContestInputs";
import {
  getRequestEndContestProofInstructionAsync,
  RequestEndContestProofAsyncInput,
} from "../../../dist/js-client/instructions/requestEndContestProof";

const BONSOL_PROGRAM_ID = address(
  "BoNsHRcyLLNdtnoDf8hiCNZpyehMC4FDMxs6NTxFi3ew"
);
const ARBITRON_IMAGE_ID =
  "c3a3dc0e28f164c1925013f2e35e2daecc6c38762a5080f47956050117462ce8";
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8899";
const WS_RPC_URL = process.env.WS_RPC_URL || "ws://127.0.0.1:8900";
const PAYER_KEYPAIR_PATH =
  process.env.PAYER_KEYPAIR_PATH || "/path/to/your/wallet.json";

// --- QUEUES ---
const END_CONTEST_QUEUE = "ended-contests";

// Interface for Jupiter API response (existing)
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

async function getContestPDA(
  contestName: string,
  host: Address
): Promise<Address> {
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

async function main() {
  console.log("[Worker]: zk-tx-submitter worker started...");

  while (true) {
    const contestId = await redis.brPop(END_CONTEST_QUEUE, 0);

    if (!contestId) {
      continue;
    }

    console.log("[Worker]: Received contest ID to process:", contestId.element);

    try {
      // 1. --- Data Fetching (same as before) ---
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
      contest.participants.forEach((participant) => {
        participant.SelectedTokens.forEach((token) => {
          uniqueSelectedTokens.add(token.mint);
        });
      });

      console.log(
        "[Worker]: Unique selected tokens found:",
        uniqueSelectedTokens.size
      );

      const finalPricesMap = await getJupiterPrices(uniqueSelectedTokens);
      console.log("[Worker]: Fetched final prices from Jupiter.");

      const contestPDA = await getContestPDA(
        contest.name,
        address(contest.host)
      );

      // 2. --- Payload Creation (same as before) ---
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

      // 3. --- NEW: On-Chain Transaction Submission ---

      console.log("[Worker]: Preparing on-chain instructions...");

      const execution_id = randomBytes(16).toString("hex");
      const contestAddress = address(contestPDA);

      const rpc = createSolanaRpc(RPC_URL);
      const rpcSubscriptions = createSolanaRpcSubscriptions(WS_RPC_URL);

      const payer = await createKeyPairSignerFromPrivateKeyBytes(
        JSON.parse(fs.readFileSync(PAYER_KEYPAIR_PATH, "utf-8"))
      );

      const airdropFunction = await airdropFactory({
        rpc,
        rpcSubscriptions,
      });

      await airdropFunction({
        commitment: "confirmed",
        lamports: lamports(1_000_000n),
        recipientAddress: payer.address,
      });

      // Find PDAs
      const [contestInputsPda] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ADDRESS,
        seeds: [
          new TextEncoder().encode("contest_inputs"),
          getAddressEncoder().encode(contestAddress),
        ],
      });

      // Serialize payload for the chain
      const payloadBytes = Buffer.from(JSON.stringify(jobPayload));
      const tip = 1000_000n; // 0.001 SOL tip for the prover

      // 4. --- Build & Send Transaction (using @solana/kit) ---
      console.log("📦 Building and sending ZK request transaction...");

      const setContestInputIxInput: StoreContestInputsAsyncInput = {
        contest: contestAddress,
        contestInputs: address(contestInputsPda),
        payer: payer,
        data: payloadBytes,
      };

      const storeContestInputIx = await getStoreContestInputsInstructionAsync(
        setContestInputIxInput
      );

      const requestEndContestProof: RequestEndContestProofAsyncInput = {
        contest: contestAddress,
        contestInputs: address(contestInputsPda),
        payer: payer,
        tip: tip,
        bonsolProgram: BONSOL_PROGRAM_ID,
        executionId: execution_id,
        deploymentAccount: address(ARBITRON_IMAGE_ID),
        executionRequest: null,
      };

      const requestEndContestProofIx =
        await getRequestEndContestProofInstructionAsync(requestEndContestProof);

      const { value: blockhash } = await rpc.getLatestBlockhash().send();

      const tx = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(payer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
        (tx) =>
          appendTransactionMessageInstructions(
            [storeContestInputIx, requestEndContestProofIx],
            tx
          )
      );

      assertIsTransactionMessageWithinSizeLimit(tx);

      const signedTx = await signTransactionMessageWithSigners(tx);

      const sendAndConfirmTransaction = await sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      try {
        await sendAndConfirmTransaction(signedTx, {
          commitment: "confirmed",
        });
      } catch (error) {
        console.error(
          `[Worker]: Failed to send and confirm transaction:`,
          error
        );
      }

      const signature = await getSignatureFromTransaction(signedTx);

      console.log("Transaction Signature:", signature);

      console.log(
        `[Worker]: Successfully requested ZK proof for contest ${contestId.element}.`
      );
      // console.log(`[Worker]: Signature: ${signature}`);
    } catch (error) {
      console.error(
        `[Worker]: Failed to process contest ${contestId.element}:`,
        error
      );
    }
  }
}

main().catch((err) => {
  console.log("Error", err);
  process.exit(1);
});
