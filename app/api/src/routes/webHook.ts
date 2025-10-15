import { Router } from "express";
import bs58 from "bs58";
import {
  ARBITRON_PROGRAM_ADDRESS,
  ArbitronInstruction,
  identifyArbitronInstruction,
  parseCreateContestInstruction,
  parseJoinContestInstruction,
  parseStartContestInstruction,
  parseExecuteSwapInstruction,
  parseInitializeInstruction,
  ParsedArbitronInstruction,
} from "../../../../dist/js-client";
import type { Address } from "@solana/kit";
import { publisher } from "@arbitron/shared-redis";
import {
  createContest,
  findOrCreateUser,
  createParticipant,
  updateContestStatus,
} from "@arbitron/db";

export const webHookRouter = Router();

// Helper to convert webhook instruction format to Solana instruction format
function convertWebhookInstruction(rawIx: any) {
  return {
    programAddress: rawIx.programId as Address,
    accounts: rawIx.accounts.map((pubkey: string) => ({
      address: pubkey as Address,
      role: 0, // Default role
    })),
    data: bs58.decode(rawIx.data), // Decode base58 to Uint8Array
  };
}

function parseInstruction(ix: ParsedArbitronInstruction) {
  switch (ix.instructionType) {
    case ArbitronInstruction.CreateContest:
      break;
    case ArbitronInstruction.ExecuteSwap:
      break;
    case ArbitronInstruction.Initialize:
      break;
    case ArbitronInstruction.JoinContest:
      break;
    case ArbitronInstruction.StartContest:
      break;
    default:
  }
}

webHookRouter.post("/", async (req, res) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body, null, 3));

    const secret = req.headers["authorization"];
    const mysecret = process.env.WEBHOOK_SECRET;
    if (secret !== `Bearer ${mysecret}`) {
      console.log("Unauthorized webhook request");
      return res.status(401).send("Unauthorized");
    }

    const event = req.body[0]; // Assuming the first element is the transaction
    const message = event.transaction.message;

    // Map programIdIndex to actual programId
    const getProgramId = (index: number) => message.accountKeys[index];

    // Convert instruction accounts from indices to actual pubkeys
    const normalizeInstruction = (ix: any, index: number) => ({
      accounts: ix.accounts.map((i: number) => message.accountKeys[i]),
      data: ix.data,
      programId: getProgramId(ix.programIdIndex),
      innerInstructions: event.meta?.innerInstructions.filter(
        (ini) => ini.index === index
      )[0]?.instructions,
    });

    // Filter for Arbitron instructions
    const instructions = message.instructions.map(normalizeInstruction);
    const filteredIx = instructions.filter(
      (ix: any) => ix.programId === ARBITRON_PROGRAM_ADDRESS
    );

    if (filteredIx.length === 0) {
      console.log("No Arbitron instructions found");
      return res.status(200).send("Webhook received");
    }

    const rawIx = filteredIx[0];
    const ixBytes = bs58.decode(rawIx.data);
    const ixType = identifyArbitronInstruction(ixBytes);
    console.log("Instruction Type:", ArbitronInstruction[ixType]);
    console.log("Raw Instruction  :", rawIx);

    switch (ixType) {
      case ArbitronInstruction.CreateContest:
        try {
          console.log("instruction detected");
          const convertedIx = convertWebhookInstruction(rawIx);
          const parsedData = parseCreateContestInstruction(convertedIx);
          console.log("Parsed CreateContest Data:");
          console.log("Contest Name:", parsedData.data.name);
          console.log("Duration:", parsedData.data.duration.toString());
          console.log("Start Time:", parsedData.data.startTime.toString());
          console.log("Entry Fees:", parsedData.data.entryFees.toString());
          console.log("Max Participants:", parsedData.data.maxParticipents);
          console.log("Signer:", parsedData.accounts.signer.address);
          console.log("Token Mint:", parsedData.accounts.tokenMint.address);
          console.log("Contest Address:", parsedData.accounts.contest.address);

          // Save contest to database
          // await createContest({
          //   id: parsedData.accounts.contest.address, // Use on-chain address as ID
          //   name: parsedData.data.name,
          //   host: parsedData.accounts.signer.address,
          //   entryFee: parsedData.data.entryFees,
          //   maxParticipants: parsedData.data.maxParticipents,
          //   startTime: new Date(Number(parsedData.data.startTime) * 1000),
          //   duration: Number(parsedData.data.duration),
          //   decimals: 6, // USDT decimals
          // });
          // console.log("✅ Contest saved to database");
        } catch (parseError) {
          console.error("Error parsing CreateContest instruction:", parseError);
        }
        break;

      case ArbitronInstruction.JoinContest:
        try {
          const convertedIx = convertWebhookInstruction(rawIx);
          const parsedData = parseJoinContestInstruction(convertedIx);
          console.log("Parsed JoinContest Data:");
          console.log("Participant:", parsedData.accounts.participent.address);
          console.log("Contest:", parsedData.accounts.contest.address);

          // Find or create user and create participant record
          // const user = await findOrCreateUser(parsedData.accounts.participent.address);
          // await createParticipant(
          //   parsedData.accounts.contest.address, // contestId (on-chain address)
          //   user.id // userId (database ID)
          // );
          // console.log("✅ Participant saved to database");
        } catch (parseError) {
          console.error("Error parsing JoinContest instruction:", parseError);
        }
        break;

      case ArbitronInstruction.StartContest:
        try {
          const convertedIx = convertWebhookInstruction(rawIx);
          const parsedData = parseStartContestInstruction(convertedIx);
          console.log("Parsed StartContest Data:");
          console.log("Host:", parsedData.accounts.host.address);
          console.log(" Contest:", parsedData.accounts.contest.address);
          const contestAddress = parsedData.accounts.contest.address;

          await updateContestStatus(contestAddress, "ONGOING");

          publisher.publish(
            `contest-${contestAddress}`,
            JSON.stringify({
              contestId: contestAddress,
              host: parsedData.accounts.host.address,
              type: "contest-started",
              timestamp: Date.now(),
            })
          );

          console.log("Published 'contest-started' event to Pubsub");
        } catch (parseError) {
          console.error("Error parsing StartContest instruction:", parseError);
        }
        break;

      case ArbitronInstruction.ExecuteSwap:
        try {
          const convertedIx = convertWebhookInstruction(rawIx);
          const parsedData = parseExecuteSwapInstruction(convertedIx);
          console.log("Parsed ExecuteSwap Data:");
          console.log("Program:", parsedData.programAddress);
          console.log("Accounts:", rawIx.accounts);

          // TODO: Update user score/portfolio in database
          // await recordSwapInDatabase(parsedData, rawIx.accounts);
        } catch (parseError) {
          console.error("Error parsing ExecuteSwap instruction:", parseError);
        }
        break;

      case ArbitronInstruction.Initialize:
        try {
          const convertedIx = convertWebhookInstruction(rawIx);
          const parsedData = parseInitializeInstruction(convertedIx);
          console.log("Parsed Initialize Data:");
          console.log("Admin:", parsedData.accounts.admin.address);
          console.log("Config:", parsedData.accounts.config.address);

          // TODO: Save config to database
          // await saveConfigToDatabase(parsedData);
        } catch (parseError) {
          console.error("Error parsing Initialize instruction:", parseError);
        }
        break;

      default:
        console.log("Unknown Instruction Type:", ixType);
    }

    if (event.meta?.err === null && event.type === "CREATE") {
      console.log("New account created:", event.data);
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.log("Error while handling webhook requests", error);
  }
});
