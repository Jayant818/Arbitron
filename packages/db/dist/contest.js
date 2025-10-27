import { prisma } from "./singletonPrisma.js";
import { ContestStatus } from "@prisma/client";
export const createContest = async (data) => {
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
export const getContestById = async (id) => {
    return await prisma.contest.findUnique({
        where: { id },
    });
};
export const getContestByIdWithParticipantsAndSelectedTokens = async (id) => {
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
export const updateContestStatus = async (id, status, expectedCurrentStatus) => {
    try {
        return await prisma.contest.update({
            where: {
                id,
                // Only update if the contest is in the expected status (if provided)
                ...(expectedCurrentStatus && { status: expectedCurrentStatus }),
            },
            data: { status },
        });
    }
    catch (error) {
        // If the contest is not found or not in the expected status, return null
        return null;
    }
};
export const getAllUpcomingContestsWhoseStartTimeIsDue = async (currentTime) => {
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
export const getAllOngoingContestsWhoseEndTimeIsDue = async (currentTime) => {
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
    return contests.filter((contest) => contest.startTime.getTime() + contest.duration * 60 * 1000 <=
        currentTime.getTime());
};
//# sourceMappingURL=contest.js.map