import axios from "axios";
import { publisher } from "@arbitron/shared-redis";
import { prisma } from "@arbitron/db";

export const PRICE_UPDATES = "price_updates";

export interface IPriceUpdate {
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
}

async function pollPrice() {
  const tokens = await prisma.selectedTokens.findMany({
    distinct: ["mint"],
    where: {
      participant: {
        contest: {
          status: "ONGOING",
        },
      },
    },
  });

  if (tokens.length === 0) {
    console.log("No active Contest to poll");
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

    publisher.publish(PRICE_UPDATES, JSON.stringify(data));

    const resArray: { mint: string; price: number; timestamp: Date }[] = [];

    for (let val in data) {
      resArray.push({
        mint: val,
        price: data[val].usdPrice,
        timestamp: new Date(),
      });
    }

    await prisma.priceHistory.createMany({
      data: resArray,
    });
  } catch (error) {
    console.log("Error Fetching and publishing the Token Price", error);
  }
}

setInterval(pollPrice, 5000);
