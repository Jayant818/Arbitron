import { prisma } from "./singletonPrisma.js";

export const updateUser = async (
  publicKey: string,
  username: string,
  email: string
) => {
  const user = await prisma.user.update({
    where: { publicKey },
    data: { username, email },
  });
  return user;
};

export const findOrCreateUser = async (publicKey: string) => {
  let user = await prisma.user.findUnique({
    where: { publicKey },
    include: {
      participatedIn: {
        include: {
          contest: true,
        },
      },
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { publicKey },
      include: {
        participatedIn: {
          include: {
            contest: true,
          },
        },
      },
    });
  }

  if (!user) {
    return null;
  }

  const contestsPlayed = user.participatedIn.length;
  let wins = 0;
  let totalEarnings = 0;
  let xp = 0;
  let rank = null;
  const nextLevelXp = 1000;

  if (contestsPlayed > 0) {
    const recentContests = await Promise.all(
      user.participatedIn.map(async (p) => {
        let contestRank = null;
        let pnl = 0;
        let prize = 0;
        let status = "Lost";

        try {
          // For now, we'll use the DB contest data
          // TODO: Fetch from on-chain when we properly handle the RPC types
          const contestFromDb = p.contest;

          // Check if user is winner by checking participatedIn winners
          // This is a placeholder - you'll need to properly check on-chain winner
          const isWinner = false; // TODO: Check on-chain winner

          if (isWinner) {
            wins++;
            // Calculate prize after 2.5% fee deduction
            // TODO: Get actual prize pool from vault
            const estimatedPrizePool = 10; // Placeholder
            const feePercentage = 0.025; // 2.5%
            const netPrize = estimatedPrizePool * (1 - feePercentage);
            totalEarnings += netPrize;
            contestRank = 1;
            prize = netPrize;
            status = "Won";
          } else {
            contestRank = 2; // Placeholder for loser
          }
        } catch (error) {
          console.error("Error fetching contest data:", error);
        }

        return {
          id: p.contest.id,
          name: p.contest.name,
          date: p.contest.startTime,
          rank: contestRank,
          pnl,
          prize,
          status,
        };
      })
    );

    // XP calculation: wins * 100
    xp = wins * 100;
    // Total XP possible: games_played * 100
    const totalPossibleXp = contestsPlayed * 100;

    rank = 1; // TODO: Calculate overall rank based on leaderboard

    const winRate =
      contestsPlayed > 0 ? Math.round((wins / contestsPlayed) * 100) : 0;

    return {
      ...user,
      avatar: user.username ? user.username.charAt(0).toUpperCase() : "A",
      rank,
      xp,
      nextLevelXp: totalPossibleXp,
      contestsPlayed,
      winRate,
      totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
      recentContests,
      nfts: [], // TODO: Replace with actual NFTs
      badges: [], // TODO: Replace with actual badges
    };
  }

  return {
    ...user,
    avatar: user.username ? user.username.charAt(0).toUpperCase() : "A",
    rank: null,
    xp: 0,
    nextLevelXp: 100,
    contestsPlayed: 0,
    winRate: 0,
    totalEarnings: 0,
    recentContests: [],
    nfts: [],
    badges: [],
  };
};
