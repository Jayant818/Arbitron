import { prisma } from "./singletonPrisma.js";
export const createPriceHistory = async (mint, price) => {
    try {
        const tokenPrice = await prisma.priceHistory.create({
            data: {
                mint,
                price,
                timestamp: new Date(),
            },
        });
    }
    catch (error) {
        console.log("Error Creating Token Price Record", error);
    }
};
export const getLatestPrices = async (mints) => {
    const latestPrices = await prisma.priceHistory.findMany({
        where: {
            mint: {
                in: mints,
            },
        },
        orderBy: {
            timestamp: "desc",
        },
        distinct: ["mint"],
    });
    return latestPrices.reduce((acc, price) => {
        acc[price.mint] = price;
        return acc;
    }, {});
};
//# sourceMappingURL=price-history.js.map