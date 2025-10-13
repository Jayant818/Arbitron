import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
