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
    id: string;
    publicKey: string;
    username: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=user.d.ts.map