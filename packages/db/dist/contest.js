import { prisma } from "./singletonPrisma.js";
import { ContestStatus } from "@prisma/client";
export { ContestStatus };
export const createContest = async (data) => {
    return await prisma.contest.create({
        data: {
            id: data.id,
            name: data.name,
            host: data.host,
            entryFees: data.entryFee,
            maxParticipents: data.maxParticipants,
            scheduledStartTime: data.scheduledStartTime,
            startTime: null, // Will be set when crank service starts the contest
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
// Function to start a contest (update status to ONGOING and set startTime)
export const startContest = async (id, startTime = new Date()) => {
    try {
        return await prisma.contest.update({
            where: {
                id,
                status: ContestStatus.UPCOMING, // Only start if currently UPCOMING
            },
            data: {
                status: ContestStatus.ONGOING,
                startTime: startTime, // Set the actual start time when contest is started
            },
        });
    }
    catch (error) {
        // If the contest is not found or not in UPCOMING status, return null
        return null;
    }
};
export const getAllUpcomingContestsWhoseStartTimeIsDue = async (currentTime) => {
    return await prisma.contest.findMany({
        where: {
            scheduledStartTime: {
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
    return contests.filter((contest) => {
        // Only check contests that have a startTime set
        if (!contest.startTime)
            return false;
        return (contest.startTime.getTime() + contest.duration * 60 * 1000 <=
            currentTime.getTime());
    });
};
//# sourceMappingURL=contest.js.map