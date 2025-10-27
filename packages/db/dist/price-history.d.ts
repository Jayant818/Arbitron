export declare const createPriceHistory: (mint: string, price: number) => Promise<void>;
export declare const getLatestPrices: (mints: string[]) => Promise<Record<string, {
    id: string;
    createdAt: Date;
    mint: string;
    price: bigint;
    timestamp: Date;
}>>;
//# sourceMappingURL=price-history.d.ts.map