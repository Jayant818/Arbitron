import { prisma } from "./singletonPrisma.js";
export const createParticipant = async (contestId, userId, selectedTokens) => {
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
            entryPrice: BigInt(token.entryPrice),
        }));
        console.log("📝 Token data to be saved:", JSON.stringify(tokenData, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2));
        await tx.selectedTokens.createMany({
            data: tokenData,
        });
        return participant;
    });
};
export const getParticipantsByContestId = async (contestId) => {
    const participants = await prisma.participant.findMany({
        where: { contestId: contestId },
        include: {
            user: true,
            SelectedTokens: true,
        },
    });
    const participantsWithNumbers = participants.map((participant) => ({
        ...participant,
        SelectedTokens: participant.SelectedTokens?.map((token) => ({
            ...token,
            entryPrice: token.entryPrice ? Number(token.entryPrice) : null,
        })) || [],
    }));
    console.log("🔍 DB Query Result - Participants count:", participants.length);
    if (participants.length > 0 && participants[0]) {
        console.log("🔍 First participant structure:", JSON.stringify(participants[0], (key, value) => (typeof value === "bigint" ? value.toString() : value), 2));
        console.log("🔍 First participant SelectedTokens:", participants[0].SelectedTokens);
    }
    return participantsWithNumbers;
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
export async function getAllParticipantsOfOngoingContestsWithSelectedTokens() {
    return prisma.participant.findMany({
        where: {
            contest: {
                status: "ONGOING",
            },
        },
        include: {
            SelectedTokens: true,
        },
    });
}
//# sourceMappingURL=participant.js.map