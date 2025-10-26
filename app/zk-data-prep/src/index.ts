import { redis } from "@arbitron/shared-redis";
import { getContestByIdWithParticipantsAndSelectedTokens } from "@arbitron/db";

const END_CONTEST_QUEUE = "ended-contests";

async function main() {
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

      //   Get the Unique selected tokens for all participants in the contest
      const uniqueSelectedTokens = new Set<string>();
      contest.participants.forEach((participant) => {
        participant.SelectedTokens.forEach((token) => {
          uniqueSelectedTokens.add(token.mint);
        });
      });

      console.log(
        "[Worker]: Unique selected tokens found:",
        uniqueSelectedTokens
      );

      const contestEndTime = new Date(
        contest.startTime.getTime() + contest.duration * 60 * 1000
      );

      // 1)  Getting relevent Pyth price accounts for these tokens
      // 2)  Fetching the latest Price data from Pyth Network
      // 3) Creating ZK circuit and providing all the required inputs, to get the result/winner with the p&L
      // 4) Generating the ZK proof
      // 5) making an on-chain transaction to finalize the contest with the proof and the results
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
