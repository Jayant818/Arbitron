import { PrismaClient } from "@prisma/client";

const globalPrismaClient = globalThis as unknown as {
  prisma: PrismaClient | null;
};

export const prisma = globalPrismaClient.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalPrismaClient.prisma = prisma;
