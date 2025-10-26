import { redis } from "@arbitron/shared-redis";
import { getContestByIdWithParticipantsAndSelectedTokens } from "@arbitron/db";
import axios from "axios";
import { ARBITRON_PROGRAM_ADDRESS } from "../../../dist/js-client/index";
import {
  address,
  Address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";

const END_CONTEST_QUEUE = "ended-contests";
const ZK_INPUTS_QUEUE = "zk-inputs-queue";

// Interface for Jupiter API response
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
    // Jupiter's API is paginated, but 50 should be fine for unique tokens
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
      // Scale price to 6 decimals (1_000_000) as a BigInt
      const scaledPrice = BigInt(Math.round(priceUpdate.usdPrice * 1_000_000));
      finalPrices.set(mint, scaledPrice);
    }

    // Check if any tokens are missing prices
    for (const mint of mints) {
      if (!finalPrices.has(mint)) {
        console.warn(
          `[Worker]: Missing final price for mint ${mint}. Setting to 0.`
        );
        finalPrices.set(mint, BigInt(0)); // Handle missing price
      }
    }

    return finalPrices;
  } catch (error) {
    console.error("[Worker]: Failed to fetch Jupiter prices:", error);
    throw error; // Re-throw to be caught by main try/catch
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
  console.log("[Worker]: zk-data-prep worker started...");
  while (true) {
    const contestId = await redis.brPop(END_CONTEST_QUEUE, 0);

    if (!contestId) {
      continue;
    }

    console.log("[Worker]: Received contest ID to process:", contestId.element);

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

      // We send simple JSON to Rust; Rust will handle struct creation and serialization.
      const jobPayload = {
        contestAddress: contestPDA as string,
        participants: contest.participants.map((p) => ({
          userPublicKey: p.user.publicKey,
          selectedTokens: p.SelectedTokens.map((t) => ({
            mint: t.mint,
            isPowerToken: t.isPowerToken,
            quantity: t.quantity,
            entryPrice: t.entryPrice?.toString(), // BigInt as string
          })),
        })),
        finalPrices: Array.from(finalPricesMap.entries()).map(
          ([mint, price]) => ({
            mint: mint,
            price: price.toString(), // BigInt as string
          })
        ),
      };

      await redis.lPush(ZK_INPUTS_QUEUE, JSON.stringify(jobPayload));

      console.log(
        `[Worker]: Successfully prepared and queued ZK inputs for contest ${contestId.element}.`
      );
    } catch (error) {
      console.error(
        `[Worker]: Failed to process contest ${contestId.element}:`,
        error
      );
      // Optional: Pushing back to the queue for retry
      // await redis.lPush(END_CONTEST_QUEUE, contestId.element);
    }
  }
}

main().catch((err) => {
  console.log("Error", err);
  process.exit(1);
});
