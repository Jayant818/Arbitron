import { Router } from "express";
import {
  fetchAllContest,
  ARBITRON_PROGRAM_ADDRESS,
  CONTEST_DISCRIMINATOR,
  getContestDecoder,
  fetchContest,
  fetchAllMaybePlayer,
  fetchAllParticipent,
} from "../../../../dist/js-client/index.js";
import { rpc } from "../config/solana.js";
import { address, Address, Base58EncodedBytes } from "@solana/kit";
import bs58 from "bs58";
import {
  createContest,
  getParticipantsByContestId,
  updateContestStatus,
} from "@arbitron/db";
import { ContestStatus } from "@prisma/client";

export const ContestRouter = Router();

ContestRouter.post("/", async (req, res) => {
  try {
    const contestData = req.body;

    if (!contestData.id || !contestData.name) {
      return res.status(400).json({ message: "Missing required contest data" });
    }

    const newContest = await createContest({
      ...contestData,
      entryFee: BigInt(contestData.entryFee),
      scheduledStartTime: new Date(contestData.startTime),
    });

    // Convert BigInt to string for JSON serialization
    const contestResponse = {
      ...newContest,
      entryFees: newContest.entryFees.toString(),
      prizePool: newContest.prizePool.toString(),
    };

    res.status(201).json(contestResponse);
  } catch (error) {
    console.error("Failed to create contest in DB:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

ContestRouter.get("/all", async (req, res) => {
  try {
    const contestFilter = bs58.encode(CONTEST_DISCRIMINATOR);

    const allAccounts = await rpc
      .getProgramAccounts(ARBITRON_PROGRAM_ADDRESS, {
        encoding: "base64",
        filters: [
          {
            memcmp: {
              offset: 0n,
              bytes: contestFilter as Base58EncodedBytes,
              encoding: "base58",
            },
          },
        ],
      })
      .send();

    const decoder = getContestDecoder();

    const allContests = allAccounts.map(({ pubkey, account }) => {
      const decoded = decoder.decode(Buffer.from(account.data[0], "base64"));
      return {
        id: pubkey,
        title: decoded.name,
        entryFee: Number(decoded.entryFees),
        currentPlayers: Number(decoded.participentsCount),
        maxPlayers: Number(decoded.maxParticipents),
        duration: Number(decoded.duration),
        status: decoded.status,
        host: decoded.host,
        prizePoolAccount: decoded.prizePoolVaultUsdc,
        decimals: 6, // USDC has 6 decimals
        startTime: Number(decoded.startTime),
      };
    });

    // Have to filter out the accounts that are not contests

    // const allContestAddresses: Address[] = [];

    // const allContests = await fetchAllContest(rpc, allContestAddresses);

    res.send(allContests);
  } catch (error) {
    console.error("Error Fetching Contests", error);
    res.status(500).send({ message: "Error Fetching Contests" });
  }
});

ContestRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contest = await fetchContest(rpc, address(id));
    const contestResult = {
      id: contest.address,
      title: contest.data.name,
      entryFee: Number(contest.data.entryFees),
      currentPlayers: Number(contest.data.participentsCount),
      maxPlayers: Number(contest.data.maxParticipents),
      duration: Number(contest.data.duration),
      status: contest.data.status,
      host: contest.data.host,
      startTime: Number(contest.data.startTime),
      prizePoolAccount: contest.data.prizePoolVaultUsdc,
      decimals: 6,
    };

    res.send(contestResult);
  } catch (error) {
    console.error("Error Fetching Contest by ID", error);
    res.status(500).send({ message: "Error Fetching Contest by ID" });
  }
});

ContestRouter.get("/:id/participents/all", async (req, res) => {
  try {
    const { id } = req.params;

    const participants = await getParticipantsByContestId(id);

    // Convert BigInt fields to numbers for JSON serialization

    // console.log(
    //   "🔍 First participant data:",
    //   JSON.stringify(participantsWithNumbers?.[0], null, 2)
    // );

    res.status(200).json({ participants });
  } catch (error: any) {
    console.error("Error Fetching all Participant", error);
    res.status(500).send({ message: "Error Fecthing all participant" });
  }
});

ContestRouter.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(ContestStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedContest = await updateContestStatus(id, status);

    const response = {
      ...updatedContest,
      entryFees: updatedContest.entryFees.toString(),
      prizePool: updatedContest.prizePool.toString(),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Failed to update contest status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
