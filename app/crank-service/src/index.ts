import cron from "node-cron";
import {
  getAllUpcomingContestsWhoseStartTimeIsDue,
  getAllOngoingContestsWhoseEndTimeIsDue,
  updateContestStatus,
} from "@arbitron/db";
import { redis } from "@arbitron/shared-redis";
import { ContestStatus } from "@prisma/client";

const END_CONTEST_QUEUE = "ended-contests";

// START Contest
cron.schedule("*/30 * * * * *", async () => {
  console.log("Running a task every 30 seconds");
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const contests = await getAllUpcomingContestsWhoseStartTimeIsDue(new Date());

  contests.forEach((contest) => {
    if (contest._count.participants < 2) {
      return;
    }

    try {
    } catch (error) {
      console.error(`[Starter]: Failed to start contest ${contest.id}:`, error);
    }
  });
});

// Queue ENDED Contest
cron.schedule("* * * * *", async () => {
  console.log("Running a task every minute to queue ended contests");
  const contests = await getAllOngoingContestsWhoseEndTimeIsDue(new Date());

  for (const contest of contests) {
    try {
      // Use a transaction to atomically update status and check if it was already updated
      // This prevents race conditions where multiple cron jobs try to process the same contest
      // Only update if the contest is still in ONGOING status
      const updatedContest = await updateContestStatus(
        contest.id,
        ContestStatus.PROCESSING,
        ContestStatus.ONGOING // Only update if currently ONGOING
      );

      // Check if the update actually happened (the function should return the updated contest or null if already processed)
      if (!updatedContest) {
        console.log(
          `[Ender]: Contest ${contest.id} was already processed by another worker.`
        );
        continue;
      }

      console.log(
        "[Ender]: Updated contest status to PROCESSING for contest",
        contest.id
      );

      await redis.lPush(END_CONTEST_QUEUE, contest.id.toString());
      console.log(`[Ender]: Queued contest ${contest.id} for ending.`);
    } catch (error) {
      console.error(`[Ender]: Failed to end contest ${contest.id}:`, error);
    }
  }
});
