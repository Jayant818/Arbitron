import { Router } from "express";
import { createParticipant, findOrCreateUser } from "@arbitron/db";

const userRouter = Router();

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

export { userRouter };

userRouter.post("/join-contest", async (req, res) => {
  try {
    const { contestId, userPublickey } = req.body;

    if (!contestId || !userPublickey) {
      return res.status(400).send("contestId and userPublickey are required");
    }

    const user = await findOrCreateUser(userPublickey);

    const participant = await createParticipant(contestId, user.id); // Fixed: correct parameter order

    return res.status(201).json({ participant });
  } catch (error) {
    console.error("Error in join-contest:", error);
    return res.status(500).send("Internal Server Error");
  }
});
