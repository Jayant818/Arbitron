import { prisma } from "./singletonPrisma.js";

export const findOrCreateUser = async (publicKey: string) => {
  let user = await prisma.user.findUnique({
    where: { publicKey },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { publicKey },
    });
  }
  return user;
};
