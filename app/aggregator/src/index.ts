import {
  getAllParticipantsOfOngoingContestsWithSelectedTokens,
  getLatestPrices,
} from "@arbitron/db";
import { publisher } from "@arbitron/shared-redis";

const PRICE_AGGREGATION_CHANNEL = "PRICE_AGGREGATION";

async function runAggregator() {
  try {
    const participants =
      await getAllParticipantsOfOngoingContestsWithSelectedTokens();

    if (participants.length === 0) {
      return;
    }

    const allMints = participants.flatMap((p) =>
      p.SelectedTokens.map((t) => t.mint)
    );
    const uniqueMints = [...new Set(allMints)];

    if (uniqueMints.length === 0) {
      return;
    }

    const latestPrices = await getLatestPrices(uniqueMints);

    const aggregatedData: Record<string, any[]> = {};

    for (const participant of participants) {
      let totalPnl = 0;
      let tokenCount = 0;

      for (const token of participant.SelectedTokens) {
        const entryPrice = Number(token.entryPrice);
        const latestPriceData = latestPrices[token.mint];

        if (latestPriceData) {
          const currentPrice = Number(latestPriceData.price);
          const pnl = ((currentPrice - entryPrice) / entryPrice) * 100;
          totalPnl += pnl;
          tokenCount++;
        }
      }

      const averagePnl = tokenCount > 0 ? totalPnl / tokenCount : 0;

      if (!aggregatedData[participant.contestId]) {
        aggregatedData[participant.contestId] = [];
      }

      aggregatedData[participant.contestId].push({
        participantId: participant.id,
        userId: participant.userId,
        averagePnl: averagePnl.toFixed(2),
      });
    }

    await publisher.publish(
      PRICE_AGGREGATION_CHANNEL,
      JSON.stringify(aggregatedData)
    );
  } catch (error) {
    console.error("Error running aggregator:", error);
  }
}

setInterval(runAggregator, 10000); // Run every 10 seconds
