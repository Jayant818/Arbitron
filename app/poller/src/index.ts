import axios from "axios";
import { publisher } from "@arbitron/shared-redis";
import { prisma, getAllOngoingContestUniqueSelectedTokens } from "@arbitron/db";
export const PRICE_UPDATES = "price_updates";

export interface IPriceUpdate {
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
}

async function pollPrice() {
  console.log("Fetching Token Prices...");
  const tokens = await getAllOngoingContestUniqueSelectedTokens();

  if (tokens.length === 0) {
    console.log("No active Contest to poll");
    return; // Return early if no tokens to process
  }

  const tokenMints = tokens.map((token) => token.mint);
  const data: Record<string, IPriceUpdate> = {};

  try {
    for (let i = 0; i < tokenMints.length; i = i + 50) {
      const res = await axios.get<Record<string, IPriceUpdate>>(
        `https://lite-api.jup.ag/price/v3?ids=${tokenMints
          .slice(i, i + 50)
          .join(",")}`
      );
      Object.assign(data, res.data);
    }

    // Create a new object for scaled prices
    const scaledData: Record<string, { scaledPrice: string; blockId: number }> =
      {};
    const resArray: { mint: string; price: bigint; timestamp: Date }[] = [];

    for (const mint in data) {
      const priceUpdate = data[mint];
      const scaledPrice = BigInt(Math.round(priceUpdate.usdPrice * 1_000_000));

      // Prepare for Redis (BigInt to string)
      scaledData[mint] = {
        scaledPrice: scaledPrice.toString(),
        blockId: priceUpdate.blockId,
      };

      // Prepare for Prisma (use BigInt directly)
      resArray.push({
        mint: mint,
        price: scaledPrice,
        timestamp: new Date(),
      });
    }

    // Publish scaled data to Redis
    publisher.publish(PRICE_UPDATES, JSON.stringify(scaledData));

    // Save scaled data to the database
    await prisma.priceHistory.createMany({
      data: resArray,
    });

    console.log(
      `Successfully polled and stored prices for ${resArray.length} tokens.`
    );
  } catch (error) {
    console.log("Error Fetching and publishing the Token Price", error);
  }
}

setInterval(pollPrice, 5000);
