import { PrismaClient } from "@prisma/client";
const globalPrismaClient = globalThis;
export const prisma = globalPrismaClient.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production")
    globalPrismaClient.prisma = prisma;
//# sourceMappingURL=singletonPrisma.js.map