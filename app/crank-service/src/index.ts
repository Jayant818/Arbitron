import "dotenv/config";
import cron from "node-cron";
import { redis } from "@arbitron/shared-redis";
import {
  getAllUpcomingContestsWhoseStartTimeIsDue,
  getAllOngoingContestsWhoseEndTimeIsDue,
  updateContestStatus,
  startContest,
  ContestStatus,
  ContestWithParticipantsCount,
} from "@arbitron/db";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createKeyPairSignerFromPrivateKeyBytes,
  airdropFactory,
  lamports,
  address,
  Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  KeyPairSigner,
  Instruction,
  assertIsTransactionMessageWithinSizeLimit,
  createKeyPairSignerFromBytes,
} from "@solana/kit";
import fs from "fs";
import { ARBITRON_PROGRAM_ADDRESS } from "../../../dist/js-client";
import {
  getStartContestInstruction,
  StartContestInput,
} from "../../../dist/js-client/instructions/startContest";

const END_CONTEST_QUEUE = "ended-contests";
const RPC_URL = process.env.RPC_URL;
const WS_RPC_URL = process.env.WS_RPC_URL;
const CRANK_KEYPAIR_PATH =
  process.env.CRANK_KEYPAIR_PATH || "./crank-wallet.json";

const rpc = createSolanaRpc(RPC_URL!);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_RPC_URL!);

async function sendInstructions(
  payer: KeyPairSigner,
  instructions: Instruction[]
) {
  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx)
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

  return signature;
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
  console.log("[Crank]: Crank service started.");

  const crankSigner = await createKeyPairSignerFromBytes(
    Uint8Array.from(JSON.parse(fs.readFileSync(CRANK_KEYPAIR_PATH, "utf-8")))
  );
  console.log(`[Crank]: Crank wallet loaded: ${crankSigner.address}`);

  // --- Cron Job to START Contests ---
  cron.schedule("*/2 * * * * *", async () => {
    // console.log("[Crank - Start]: Checking for contests to start...");
    let contests: ContestWithParticipantsCount[] = [];
    try {
      contests = await getAllUpcomingContestsWhoseStartTimeIsDue(new Date());
      // console.log(
      //   // `[Crank - Start]: Found ${contests.length} contest(s) ready to start.`
      // );
    } catch (dbError) {
      console.error(
        "[Crank - Start]: Error fetching contests from DB:",
        dbError
      );
      return; // Exit job if DB fetch fails
    }

    for (const contest of contests) {
      // Check participant count (using _count from your snippet)
      if (contest._count.participants < 2) {
        // console.log(
        //   `[Crank - Start]: Skipping contest ${contest.id} (${contest.name}) - insufficient participants (${contest._count.participants}).`
        // );
        // Optional: Update status to cancelled?
        // await updateContestStatus(contest.id, ContestStatus.CANCELLED);
        continue; // Skip to the next contest
      }

      // console.log(
      //   `[Crank - Start]: Processing contest ${contest.id} (${contest.name})...`
      // );
      try {
        const contestAddress = await getContestPDA(
          contest.name,
          address(contest.host)
        );
        const hostAddress = address(contest.host);

        const startContestInput: StartContestInput = {
          host: crankSigner, // Crank pays the fee
          contest: contestAddress,
        };

        const startContestIx = await getStartContestInstruction(
          startContestInput
        );

        // Send transaction using helper
        await sendInstructions(crankSigner, [startContestIx]);

        // console.log(
        //   `[Crank - Start]: ✅ Successfully started contest ${contest.id} on-chain.`
        // );

        // Update DB status and set start time *after* successful transaction
        const startTime = new Date();
        const updatedContest = await startContest(contest.id, startTime);

        if (updatedContest) {
          console.log(
            `[Crank - Start]: Updated contest ${
              contest.id
            } status to ONGOING and set startTime to ${startTime.toISOString()} in DB.`
          );
        } else {
          console.log(
            `[Crank - Start]: Warning: Failed to update contest ${contest.id} in DB (may not be in UPCOMING status).`
          );
        }
      } catch (error) {
        console.error(
          `[Crank - Start]: ❌ Failed to start contest ${contest.id}:`,
          error
        );
        // Optional: Implement retry logic or mark contest as failed to start
      }
    }
  });

  // --- Cron Job to Queue ENDED Contests ---
  // Runs every minute (as in your snippet)
  cron.schedule("* * * * * *", async () => {
    console.log("[Crank - End]: Checking for contests to end...");
    let contestsToEnd: Awaited<
      ReturnType<typeof getAllOngoingContestsWhoseEndTimeIsDue>
    > = [];
    try {
      contestsToEnd = await getAllOngoingContestsWhoseEndTimeIsDue(new Date());
      console.log(
        `[Crank - End]: Found ${contestsToEnd.length} contest(s) ready to end.`
      );
    } catch (dbError) {
      console.error("[Crank - End]: Error fetching contests from DB:", dbError);
      return; // Exit job if DB fetch fails
    }

    for (const contest of contestsToEnd) {
      console.log(
        `[Crank - End]: Processing contest ${contest.id} (${contest.name})...`
      );
      try {
        // Atomically update status from ONGOING to PROCESSING (as per your snippet logic)
        // Adjust statuses if your DB uses different names (e.g., Active -> Ended)
        const updatedContest = await updateContestStatus(
          contest.id,
          ContestStatus.PROCESSING, // Target status
          ContestStatus.ONGOING // Condition: Only update if currently ONGOING
        );

        // Check if the update was successful (prevent race condition)
        if (!updatedContest) {
          console.log(
            `[Crank - End]: Contest ${contest.id} was already processed or not in ONGOING state.`
          );
          continue; // Skip if already handled or in wrong state
        }

        console.log(
          `[Crank - End]: Updated contest ${contest.id} status to PROCESSING in DB.`
        );

        // Push to Redis queue for ZK proof generation
        await redis.lPush(END_CONTEST_QUEUE, contest.id.toString());
        console.log(
          `[Crank - End]: Pushed contest ${contest.id} to ${END_CONTEST_QUEUE} for ZK processing.`
        );
      } catch (error) {
        console.error(
          `[Crank - End]: ❌ Failed to queue contest ${contest.id} for ending:`,
          error
        );
        // Optional: Attempt to revert DB status? Might be complex.
        // Consider logging the failure and manual intervention.
      }
    }
  });

  console.log("[Crank]: Cron jobs scheduled.");
  // Keep the service running
  // await new Promise(() => {});
}

main().catch((err) => {
  console.error("[Crank]: Service encountered fatal error:", err);
  process.exit(1);
});
