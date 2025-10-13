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
import { getParticipantsByContestId } from "@arbitron/db";

export const ContestRouter = Router();

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
        waitingTime: Number(decoded.startTime),
        prizePoolAccount: decoded.prizePoolVaultUsdt,
        decimals: 6, // USDT has 6 decimals
        startTime: Number(decoded.startTime),
      };
    });

    // Have to filter out the accounts that are not contests

    // const allContestAddresses: Address[] = [];

    // const allContests = await fetchAllContest(rpc, allContestAddresses);

    console.log("All Contests:", allContests);
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
    console.log("Fetched Contest by ID:", contest);
    const contestResult = {
      id: contest.address,
      title: contest.data.name,
      entryFee: Number(contest.data.entryFees),
      currentPlayers: Number(contest.data.participentsCount),
      maxPlayers: Number(contest.data.maxParticipents),
      duration: Number(contest.data.duration),
      status: contest.data.status,
      host: contest.data.host,
      waitingTime: Number(contest.data.startTime),
      prizePoolAccount: contest.data.prizePoolVaultUsdt,
      decimals: 6,
    };

    console.log("Contest by ID:", contestResult);
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
    res.status(200).json({ participants });
  } catch (error: any) {
    console.error("Error Fetching all Participant", error);
    res.status(500).send({ message: "Error Fecthing all participant" });
  }
});
