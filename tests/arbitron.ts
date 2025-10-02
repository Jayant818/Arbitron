import { createSolanaRpcApi, KeyPairSigner } from "@solana/kit";
import { describe, it, assert, before, test } from "node:test";

describe("Arbitron Tests ", () => {
  let connection: any;
  let host: KeyPairSigner;
  let participent1: KeyPairSigner;
  let participent2: KeyPairSigner;
  let participent3: KeyPairSigner;

  before(() => {
    const rpc = createSolanaRpcApi({});
  });
  /*
    export type CreateContestInstructionDataArgs = {
    name: string;
    startTime: number | bigint;
    duration: number | bigint;
    entryFees: number | bigint;
    maxParticipents: number;
    participentsCount: number;
    };
  */
  describe("createContest", () => {
    test("Contest Created Successfully", () => {});
  });

  describe("Join Contest", () => {
    test("Joined Contest Successfully", () => {});
  });

  describe("Start Contest", () => {
    test("Contest Started Successfully", () => {});
  });
});
