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
      let totalPnl = 0n; // Use BigInt to match zk-data-prep
      let tokenCount = 0;

      for (const token of participant.SelectedTokens) {
        const entryPrice = BigInt(token.entryPrice);
        const latestPriceData = latestPrices[token.mint];

        if (latestPriceData) {
          const currentPrice = BigInt(latestPriceData.price);
          const quantity = BigInt(token.quantity);

          // Calculate PnL same way as zk-data-prep
          let tokenPnl = (currentPrice - entryPrice) * quantity;
          if (token.isPowerToken) {
            tokenPnl = tokenPnl * 2n; // 2x multiplier for power tokens
          }

          console.log(
            `[Aggregator]: Token ${
              token.mint
            } - Entry: ${entryPrice.toString()}, Current: ${currentPrice.toString()}, Qty: ${quantity.toString()}, PowerToken: ${
              token.isPowerToken
            }, PnL: ${tokenPnl.toString()}`
          );

          totalPnl += tokenPnl;
          tokenCount++;
        }
      }

      // Convert to percentage for display (divide by entry value * quantity)
      let averagePnl = 0;
      if (tokenCount > 0 && totalPnl !== 0n) {
        // Calculate total entry value for percentage calculation
        let totalEntryValue = 0n;
        for (const token of participant.SelectedTokens) {
          const latestPriceData = latestPrices[token.mint];
          if (latestPriceData) {
            const entryPrice = BigInt(token.entryPrice);
            const quantity = BigInt(token.quantity);
            totalEntryValue += entryPrice * quantity;
          }
        }

        if (totalEntryValue > 0n) {
          // Convert to percentage: (totalPnl / totalEntryValue) * 100
          averagePnl = (Number(totalPnl) / Number(totalEntryValue)) * 100;
        }
      }

      console.log(
        `[Aggregator]: Participant ${
          participant.id
        } - Total PnL: ${totalPnl.toString()}, Average PnL: ${averagePnl.toFixed(
          2
        )}%`
      );

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
