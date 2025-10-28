import { prisma } from "./singletonPrisma.js";


export const updateUser = async (publicKey: string, username: string, email: string) => {
    const user = await prisma.user.update({
        where: { publicKey },
        data: { username, email },
    });
    return user;
};

import { prisma } from "./singletonPrisma.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { fetchMaybeContest } from "../../../dist/js-client/accounts/contest";
import { address } from "@solana/kit";

const solanaConnection = new Connection(process.env.RPC_URL || "https://api.devnet.solana.com", "confirmed");

export const updateUser = async (publicKey: string, username: string, email: string) => {
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
    const recentContests = await Promise.all(user.participatedIn.map(async (p) => {
      const contestAddress = address(p.contest.id);
      const onChainContest = await fetchMaybeContest(solanaConnection, contestAddress);

      let contestRank = null;
      let pnl = 0;
      let prize = 0;

      if (onChainContest.exists && onChainContest.data.winner) {
        if (onChainContest.data.winner.toString() === user.publicKey) {
          wins++;
          totalEarnings += Number(onChainContest.data.prizePool);
          contestRank = 1;
          prize = Number(onChainContest.data.prizePool);
        }
      }

      // TODO: Get actual PNL

      return {
        id: p.contest.id,
        name: p.contest.name,
        date: p.contest.startTime,
        rank: contestRank,
        pnl,
        prize,
      };
    }));

    xp = 500; // TODO: Calculate XP
    rank = 1; // TODO: Calculate overall rank

    const winRate = (wins / contestsPlayed) * 100;

    return {
      ...user,
      avatar: user.username ? user.username.charAt(0).toUpperCase() : "A",
      rank,
      xp,
      nextLevelXp,
      contestsPlayed,
      winRate,
      totalEarnings,
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
