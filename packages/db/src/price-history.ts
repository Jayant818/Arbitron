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
