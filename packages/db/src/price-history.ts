import { prisma } from "./singletonPrisma.js";

export const createPriceHistory = async (mint: string, price: number) => {
  try {
    const tokenPrice = await prisma.priceHistory.create({
      data: {
        mint,
        price,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.log("Error Creating Token Price Record", error);
  }
};

export const getLatestPrices = async (mints: string[]) => {
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
    }, {} as Record<string, (typeof latestPrices)[0]>);
  };