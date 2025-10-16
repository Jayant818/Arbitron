import { prisma } from "./singletonPrisma.js";

interface ISelectedToken {
  mint: string;
  quantity: number;
  isPowerToken: boolean;
  entryPrice: number;
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
      isPowerToken: token.isPowerToken,
      participantId: participant.id,
      entryPrice: token.entryPrice,
    }));

    await tx.selectedTokens.createMany({
      data: tokenData,
    });

    return participant;
  });
};
export const getParticipantsByContestId = async (contestId: string) => {
  const participants = await prisma.participant.findMany({
    where: { contestId: contestId },
    include: {
      user: true,
      SelectedTokens: true,
    },
  });

  console.log("🔍 DB Query Result - Participants count:", participants.length);

  return participants;
};

export const getAllOngoingContestUniqueSelectedTokens = async () => {
  return prisma.selectedTokens.findMany({
    distinct: ["mint"],
    where: {
      participant: {
        contest: {
          status: "ONGOING",
        },
      },
    },
  });
};
