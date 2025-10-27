import { ContestStatus } from "@prisma/client";
export declare const createContest: (data: {
    id: string;
    name: string;
    host: string;
    entryFee: bigint;
    maxParticipants: number;
    startTime: Date;
    duration: number;
    decimals: number;
}) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    host: string;
    entryFees: bigint;
    maxParticipents: number;
    status: import("@prisma/client").$Enums.ContestStatus;
    startTime: Date;
    duration: number;
    prizePool: bigint;
    decimals: number;
}>;
export declare const getAllContest: () => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    host: string;
    entryFees: bigint;
    maxParticipents: number;
    status: import("@prisma/client").$Enums.ContestStatus;
    startTime: Date;
    duration: number;
    prizePool: bigint;
    decimals: number;
}[]>;
export declare const getContestById: (id: string) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    host: string;
    entryFees: bigint;
    maxParticipents: number;
    status: import("@prisma/client").$Enums.ContestStatus;
    startTime: Date;
    duration: number;
    prizePool: bigint;
    decimals: number;
} | null>;
export declare const getContestByIdWithParticipantsAndSelectedTokens: (id: string) => Promise<({
    participants: ({
        user: {
            id: string;
            publicKey: string;
            username: string | null;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        SelectedTokens: {
            id: string;
            participantId: string;
            mint: string;
            isPowerToken: boolean;
            quantity: number;
            entryPrice: bigint;
        }[];
    } & {
        id: string;
        contestId: string;
        userId: string;
        joinedAt: Date;
    })[];
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    host: string;
    entryFees: bigint;
    maxParticipents: number;
    status: import("@prisma/client").$Enums.ContestStatus;
    startTime: Date;
    duration: number;
    prizePool: bigint;
    decimals: number;
}) | null>;
export declare const updateContestStatus: (id: string, status: ContestStatus, expectedCurrentStatus?: ContestStatus) => Promise<{
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    host: string;
    entryFees: bigint;
    maxParticipents: number;
    status: import("@prisma/client").$Enums.ContestStatus;
    startTime: Date;
    duration: number;
    prizePool: bigint;
    decimals: number;
} | null>;
export declare const getAllUpcomingContestsWhoseStartTimeIsDue: (currentTime: Date) => Promise<({
    _count: {
        participants: number;
    };
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    host: string;
    entryFees: bigint;
    maxParticipents: number;
    status: import("@prisma/client").$Enums.ContestStatus;
    startTime: Date;
    duration: number;
    prizePool: bigint;
    decimals: number;
})[]>;
export declare const getAllOngoingContestsWhoseEndTimeIsDue: (currentTime: Date) => Promise<({
    _count: {
        participants: number;
    };
} & {
    name: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    host: string;
    entryFees: bigint;
    maxParticipents: number;
    status: import("@prisma/client").$Enums.ContestStatus;
    startTime: Date;
    duration: number;
    prizePool: bigint;
    decimals: number;
})[]>;
//# sourceMappingURL=contest.d.ts.map