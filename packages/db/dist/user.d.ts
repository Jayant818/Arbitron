export declare const updateUser: (publicKey: string, username: string, email: string) => Promise<{
    id: string;
    publicKey: string;
    username: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const findOrCreateUser: (publicKey: string) => Promise<{
    avatar: string;
    rank: number;
    xp: number;
    nextLevelXp: number;
    contestsPlayed: number;
    winRate: number;
    totalEarnings: number;
    recentContests: {
        id: string;
        name: string;
        date: Date | null;
        rank: number | null;
        pnl: number;
        prize: number;
        status: string;
    }[];
    nfts: never[];
    badges: never[];
    participatedIn: ({
        contest: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            host: string;
            entryFees: bigint;
            maxParticipents: number;
            status: import("@prisma/client").$Enums.ContestStatus;
            scheduledStartTime: Date;
            startTime: Date | null;
            duration: number;
            prizePool: bigint;
            decimals: number;
        };
    } & {
        id: string;
        contestId: string;
        userId: string;
        joinedAt: Date;
    })[];
    id: string;
    publicKey: string;
    username: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
} | {
    avatar: string;
    rank: null;
    xp: number;
    nextLevelXp: number;
    contestsPlayed: number;
    winRate: number;
    totalEarnings: number;
    recentContests: never[];
    nfts: never[];
    badges: never[];
    participatedIn: ({
        contest: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            host: string;
            entryFees: bigint;
            maxParticipents: number;
            status: import("@prisma/client").$Enums.ContestStatus;
            scheduledStartTime: Date;
            startTime: Date | null;
            duration: number;
            prizePool: bigint;
            decimals: number;
        };
    } & {
        id: string;
        contestId: string;
        userId: string;
        joinedAt: Date;
    })[];
    id: string;
    publicKey: string;
    username: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
//# sourceMappingURL=user.d.ts.map