import { prisma } from "./singletonPrisma.js";
export const updateUser = async (publicKey, username, email) => {
    const user = await prisma.user.update({
        where: { publicKey },
        data: { username, email },
    });
    return user;
};
export const findOrCreateUser = async (publicKey) => {
    let user = await prisma.user.findUnique({
        where: { publicKey },
    });
    if (!user) {
        user = await prisma.user.create({
            data: { publicKey },
        });
    }
    return {
        ...user,
        avatar: user.username ? user.username.charAt(0).toUpperCase() : "A",
        rank: 1,
        xp: 500,
        nextLevelXp: 1000,
        contestsPlayed: 10,
        winRate: 80,
        totalEarnings: 100,
    };
};
//# sourceMappingURL=user.js.map