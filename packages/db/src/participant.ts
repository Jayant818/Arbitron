import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

export const createParticipant = async (contestId: string, userId: string) => {
  return await prisma.participant.create({
    data: {
      contestId: contestId,
      userId: userId,
    },
  });
};

export const getParticipantsByContestId = async (contestId: string) => {
  return await prisma.participant.findMany({
    where: { contestId: contestId },
    include: { user: true },
  });
};
