import { Router } from "express";
import bs58 from "bs58";
import {
  ARBITRON_PROGRAM_ADDRESS,
  ArbitronInstruction,
  identifyArbitronInstruction,
  parseCreateContestInstruction,
  ParsedArbitronInstruction,
} from "../../../../dist/js-client";

export const webHookRouter = Router();

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

webHookRouter.post("/", (req, res) => {
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
    const normalizeInstruction = (ix: any) => ({
      accounts: ix.accounts.map((i: number) => message.accountKeys[i]),
      data: ix.data,
      programId: getProgramId(ix.programIdIndex),
      innerInstructions: ix.innerInstructions || [],
    });

    const instructions = message.instructions.map(normalizeInstruction);

    // Filter for Arbitron instructions
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

    switch (ixType) {
      case ArbitronInstruction.CreateContest:
        const parsedData = parseCreateContestInstruction(rawIx);
        console.log("Parsed CreateContest Data:", parsedData);
        break;
      case ArbitronInstruction.ExecuteSwap:
        console.log("Instruction Type: ExecuteSwap");
        break;
      case ArbitronInstruction.Initialize:
        console.log("Instruction Type: Initialize");
        break;
      case ArbitronInstruction.JoinContest:
        console.log("Instruction Type: JoinContest");
        break;
      case ArbitronInstruction.StartContest:
        console.log("Instruction Type: StartContest");
        break;
      default:
        console.log("Unknown Instruction Type");
    }

    if (event.meta?.err === null && event.type === "CREATE") {
      console.log("New account created:", event.data);
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.log("Error while handling webhook requests", error);
  }
});
