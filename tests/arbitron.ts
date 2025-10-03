import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
  KeyPairSigner,
  Address,
  assertIsAddress,
  airdropFactory,
  lamports,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  assertIsTransactionMessageWithinSizeLimit,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  getProgramDerivedAddress,
  createSolanaRpcFromTransport,
  address,
  getAddressEncoder,
} from "@solana/kit";

import {
  getInitializeMint2Instruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { describe, before, test } from "node:test";
import {
  CreateContestAsyncInput,
  getCreateContestInstructionAsync,
} from "../dist/js-client/index";
import { getCreateAccountInstruction } from "@solana-program/system";

const RPC_URL = "http://127.0.0.1:8899";
const RPC_SUBSCRIPTION_URL = "ws://127.0.0.1:8900";
const ARBITRON_PROGRAM_ID =
  "ETjik8Bom7xHKv7HHawVM1igFNwJbKyWBZtnLp8jEkgD" as Address;
let USDT_TOKEN_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" as Address;

const rpc = createSolanaRpc("http://127.0.0.1:8899");
const rpcSubscription = createSolanaRpcSubscriptions("ws://127.0.0.1:8900");

async function createMint({
  payer,
  mintAuthority,
  decimals,
}: {
  payer: KeyPairSigner;
  mintAuthority: Address;
  decimals: number;
}) {
  // Create a Account for the Mint, whose owner will be the Token Program
  const mint = await generateKeyPairSigner();
  const mintSpace = BigInt(getMintSize());
  const rentExemption = await rpc
    .getMinimumBalanceForRentExemption(mintSpace)
    .send();

  const createAccountIx = getCreateAccountInstruction({
    lamports: rentExemption,
    newAccount: mint,
    payer: payer,
    space: mintSpace,
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const initializeMintIx = getInitializeMint2Instruction(
    {
      mint: mint.address,
      decimals,
      mintAuthority: mintAuthority,
    },
    {
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }
  );

  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMsg = pipe(
    createTransactionMessage({
      version: 0,
    }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [createAccountIx, initializeMintIx],
        tx
      )
  );

  assertIsTransactionMessageWithinSizeLimit(txMsg);

  const signedTx = await signTransactionMessageWithSigners(txMsg);

  const sendAndConfirmTransactionMethod = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions: rpcSubscription,
  });

  await sendAndConfirmTransactionMethod(signedTx, {
    commitment: "confirmed",
  });

  const tx_signature = await getSignatureFromTransaction(signedTx);
  console.log("Create Mint Transaction Signature: ", tx_signature);
  return mint.address;
}

describe("Arbitron Tests ", () => {
  let host: KeyPairSigner;
  let participent1: KeyPairSigner;
  let USDT_MINT: KeyPairSigner;
  // let participent2: KeyPairSigner;
  // let participent3: KeyPairSigner;

  let tokenMint: Address;

  before(async () => {
    if (
      !RPC_URL ||
      !RPC_SUBSCRIPTION_URL ||
      !ARBITRON_PROGRAM_ID ||
      !USDT_TOKEN_MINT
    ) {
      throw new Error("Url is missing in the env");
    }

    assertIsAddress(ARBITRON_PROGRAM_ID);
    assertIsAddress(USDT_TOKEN_MINT);

    host = await generateKeyPairSigner();
    participent1 = await generateKeyPairSigner();
    USDT_MINT = await generateKeyPairSigner();
    // participent2 = await generateKeyPairSigner();
    // participent3 = await generateKeyPairSigner();

    let airDropFunction = airdropFactory({
      rpc,
      rpcSubscriptions: rpcSubscription,
    });

    await airDropFunction({
      recipientAddress: host.address,
      lamports: lamports(2_000_000_000n),
      commitment: "confirmed",
    });

    await airDropFunction({
      recipientAddress: participent1.address,
      lamports: lamports(2_000_000_000n),
      commitment: "confirmed",
    });

    tokenMint = await createMint({
      payer: host,
      decimals: 6,
      mintAuthority: host.address,
    });

    console.log("Host: ", host.address);
  });

  describe("createContest", () => {
    test("Contest Created Successfully", async () => {
      const contestName = "My Contest";

      const contestSeeds = [
        new TextEncoder().encode("contest"),
        new TextEncoder().encode(contestName),
        getAddressEncoder().encode(host.address), // have to convert the address to bytes
      ];

      // This pda we are providing as codama try to add the 4 bytes length prefix to the seed which is not expected by anchor, so manually deriving it
      const [contestPda, bump] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ID,
        seeds: contestSeeds,
      });

      const createContestAsyncInput: CreateContestAsyncInput = {
        duration: 120,
        entryFees: 1_00_000_000n, // 100 USDT
        maxParticipents: 10,
        name: contestName,
        participentsCount: 0,
        startTime: Math.floor(Date.now() / 1000) + 60, // Start time 1 minute from now
        signer: host,
        tokenMint: tokenMint,
        contest: contestPda,
      };

      const getCreateContestIx = await getCreateContestInstructionAsync(
        createContestAsyncInput,
        {
          programAddress: ARBITRON_PROGRAM_ID,
        }
      );

      console.log("Create Contest Ix: ", getCreateContestIx);

      console.log("Contest PDA: ", contestPda);

      const { value: blockhash } = await rpc.getLatestBlockhash().send();

      const txMsg = pipe(
        createTransactionMessage({
          version: 0,
        }),
        (tx) => setTransactionMessageFeePayerSigner(host, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
        (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
      );

      assertIsTransactionMessageWithinSizeLimit(txMsg);

      const signedTx = await signTransactionMessageWithSigners(txMsg);

      const sendAndConfirmTransactionMethod = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions: rpcSubscription,
      });

      await sendAndConfirmTransactionMethod(signedTx, {
        commitment: "confirmed",
      });

      const tx_msg = await getSignatureFromTransaction(signedTx);
      console.log("Transaction Signature: ", tx_msg);

      console.log("Contest Creat Ix details", getCreateContestIx);

      //   // Get account info to check its status
      //   const contestAccountInfo = await rpc.getAccountInfo(contestPda).send();

      //   if (contestAccountInfo.value) {
      //     console.log("Contest account created successfully!");
      //     console.log(
      //       "Account data length: ",
      //       contestAccountInfo.value.data.length
      //     );
      //     console.log("Account owner: ", contestAccountInfo.value.owner);
      //   } else {
      //     throw new Error("Contest account not found after creation");
      //   }
      // });
    });
  });

  describe("Join Contest", () => {
    test("Joined Contest Successfully", () => {});
  });

  describe("Start Contest", () => {
    test("Contest Started Successfully", () => {});
  });
});
