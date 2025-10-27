interface ISelectedToken {
    mint: string;
    quantity: number;
    isPowerToken: boolean;
    entryPrice: number;
}
export declare const createParticipant: (contestId: string, userId: string, selectedTokens: ISelectedToken[]) => Promise<{
    id: string;
    contestId: string;
    userId: string;
    joinedAt: Date;
}>;
export declare const getParticipantsByContestId: (contestId: string) => Promise<{
    SelectedTokens: {
        entryPrice: number | null;
        id: string;
        participantId: string;
        mint: string;
        isPowerToken: boolean;
        quantity: number;
    }[];
    user: {
        id: string;
        publicKey: string;
        username: string | null;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
    id: string;
    contestId: string;
    userId: string;
    joinedAt: Date;
}[]>;
export declare const getAllOngoingContestUniqueSelectedTokens: () => Promise<{
    id: string;
    participantId: string;
    mint: string;
    isPowerToken: boolean;
    quantity: number;
    entryPrice: bigint;
}[]>;
export declare function getAllParticipantsOfOngoingContestsWithSelectedTokens(): Promise<({
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
})[]>;
export {};
//# sourceMappingURL=participant.d.ts.map