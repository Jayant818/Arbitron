import { Router } from "express";
import { createParticipant, findOrCreateUser, updateUser } from "@arbitron/db";

const userRouter = Router();

userRouter.put("/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { username, email } = req.body;

    if (!walletAddress) {
      return res.status(400).send("walletAddress is required");
    }

    const user = await updateUser(walletAddress, username, email);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in update user:", error);
    return res.status(500).send("Internal Server Error");
  }
});

userRouter.post("/find-or-create", async (req, res) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).send("publicKey is required");
    }

    const user = await findOrCreateUser(publicKey);

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error in find-or-create user:", error);
    return res.status(500).send("Internal Server Error");
  }
});

userRouter.get("/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).send("walletAddress is required");
    }

    const user = await findOrCreateUser(walletAddress);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error in get user:", error);
    return res.status(500).send("Internal Server Error");
  }
});

userRouter.get("/:walletAddress/contests", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).send("walletAddress is required");
    }

    const userData: any = await findOrCreateUser(walletAddress);

    return res.status(200).json({
      contests: userData.recentContests || [],
      stats: {
        contestsPlayed: userData.contestsPlayed || 0,
        winRate: userData.winRate || 0,
        totalEarnings: userData.totalEarnings || 0,
        xp: userData.xp || 0,
      },
    });
  } catch (error) {
    console.error("Error in get user contest history:", error);
    return res.status(500).send("Internal Server Error");
  }
});

export { userRouter };

userRouter.post("/join-contest", async (req, res) => {
  try {
    const { contestId, userPublickey, tokens } = req.body;

    if (!contestId || !userPublickey) {
      return res.status(400).send("contestId and userPublickey are required");
    }

    const user = await findOrCreateUser(userPublickey);

    console.log("User found or created:", user);
    console.log("Contest ID:", contestId);
    console.log("Tokens:", tokens);
    const participant = await createParticipant(contestId, user.id, tokens);

    return res.status(201).json({ participant });
  } catch (error) {
    console.error("Error in join-contest:", error);
    if (error.message.includes("Invalid mint address")) {
      return res.status(400).send(error.message);
    }
    return res.status(500).send("Internal Server Error");
  }
});
