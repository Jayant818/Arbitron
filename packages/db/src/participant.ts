import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ISelectedToken {
  mint: string;
  quantity: number;
  isPowerToken: boolean;
}

export const createParticipant = async (
  contestId: string,
  userId: string,
  selectedTokens: ISelectedToken[]
) => {
  return await prisma.$transaction(async (tx) => {
    const participant = await tx.participant.create({
      data: {
        contestId: contestId,
        userId: userId,
      },
    });

    const tokenData = selectedTokens.map((token) => ({
      mint: token.mint,
      quantity: token.quantity,
      isPowerToken: token.isPowerToken.toString(),
      participantId: participant.id,
    }));

    await tx.selectedTokens.createMany({
      data: tokenData,
    });

    return participant;
  });
};
export const getParticipantsByContestId = async (contestId: string) => {
  return await prisma.participant.findMany({
    where: { contestId: contestId },
    include: { user: true },
  });
};
