import { prisma } from "./singletonPrisma.js";
import { ContestStatus } from "@prisma/client";

export const createContest = async (data: {
  id: string; // on-chain-address
  name: string;
  host: string;
  entryFee: bigint;
  maxParticipants: number;
  startTime: Date;
  duration: number;
  decimals: number;
}) => {
  return await prisma.contest.create({
    data: {
      id: data.id,
      name: data.name,
      host: data.host,
      entryFees: data.entryFee,
      maxParticipents: data.maxParticipants,
      startTime: data.startTime,
      duration: data.duration,
      decimals: data.decimals,
    },
  });
};

// Function to get all contests
export const getAllContest = async () => {
  return await prisma.contest.findMany();
};

// Function to get a contest by its ID
export const getContestById = async (id: string) => {
  return await prisma.contest.findUnique({
    where: { id },
  });
};

export const getContestByIdWithParticipantsAndSelectedTokens = async (
  id: string
) => {
  return await prisma.contest.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: true,
          SelectedTokens: true,
        },
      },
    },
  });
};

export const updateContestStatus = async (
  id: string,
  status: ContestStatus
) => {
  return await prisma.contest.update({
    where: { id },
    data: { status },
  });
};

export const getAllUpcomingContestsWhoseStartTimeIsDue = async (
  currentTime: Date
) => {
  return await prisma.contest.findMany({
    where: {
      startTime: {
        lte: currentTime,
      },
      status: ContestStatus.UPCOMING,
    },
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });
};

export const getAllOngoingContestsWhoseEndTimeIsDue = async (
  currentTime: Date
) => {
  const contests = await prisma.contest.findMany({
    where: {
      status: ContestStatus.ONGOING,
    },
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  return contests.filter(
    (contest) =>
      contest.startTime.getTime() + contest.duration * 60 * 1000 <=
      currentTime.getTime()
  );
};
