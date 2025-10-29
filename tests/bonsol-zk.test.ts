import {
  address,
  Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  assertIsTransactionMessageWithinSizeLimit,
  pipe,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createKeyPairSignerFromPrivateKeyBytes,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  airdropFactory,
  lamports,
  fetchEncodedAccount,
  generateKeyPairSigner, // Needed for mint account
  KeyPairSigner, // Type for mint account
  Instruction, // Type for instructions array
} from "@solana/kit";
import { randomBytes } from "crypto";
import fs from "fs";
import { keccak_256 } from "@noble/hashes/sha3";
import { describe, before, test } from "node:test";
import assert from "node:assert";

// --- NEW: Imports for SPL Token ---
import {
  getCreateAccountInstruction,
  SYSTEM_PROGRAM_ADDRESS, // Needed for createAccount Ix
} from "@solana-program/system";
import {
  getInitializeMint2Instruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
  // Other token instructions like createATA, mintTo can be added if needed
} from "@solana-program/token";

import { ARBITRON_PROGRAM_ADDRESS } from "../dist/js-client";
import {
  getInitializeInstructionAsync,
  InitializeAsyncInput,
} from "../dist/js-client/instructions/initialize";
import {
  getStoreContestInputsInstructionAsync,
  StoreContestInputsAsyncInput,
} from "../dist/js-client/instructions/storeContestInputs";
import {
  getRequestEndContestProofInstructionAsync,
  RequestEndContestProofAsyncInput,
} from "../dist/js-client/instructions/requestEndContestProof";
import { Contest, fetchMaybeContest } from "../dist/js-client/accounts/contest";
import { ContestState } from "../dist/js-client";

// --- Constants ---
const BONSOL_PROGRAM_ID = address(
  "BoNsHRcyLLNdtnoDf8hiCNZpyehMC4FDMxs6NTxFi3ew"
);
const ARBITRON_IMAGE_ID =
  "679cc01fe324f755ed1df22e46df03ed84f40101c46e9cd452ec306b88951749";
const RPC_URL =
  "https://devnet.helius-rpc.com/?api-key=a6b64cf0-fa26-47ba-82a9-b876ec658ac9";
const WS_RPC_URL =
  "wss://devnet.helius-rpc.com/?api-key=a6b64cf0-fa26-47ba-82a9-b876ec658ac9";
const PAYER_KEYPAIR_PATH =
  process.env.PAYER_KEYPAIR_PATH || "./host-arbitron-wallet.json";

const rpc = createSolanaRpc(RPC_URL);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_RPC_URL);

async function sendInstructions(
  payer: KeyPairSigner,
  instructions: Instruction[]
) {
  const { value: blockhash } = await rpc.getLatestBlockhash().send();
  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx)
  );
  assertIsTransactionMessageWithinSizeLimit(txMessage);
  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });
  const signature = await getSignatureFromTransaction(signedTx);
  console.log(`  Sending transaction: ${signature}`);
  await sendAndConfirm(signedTx, { commitment: "confirmed" });
  console.log(`  Transaction confirmed: ${signature}`);
  return signature;
}

async function createMockMint(
  payer: KeyPairSigner,
  mintAuthority: Address,
  decimals: number = 6 // Default to 6 decimals like USDC
): Promise<Address> {
  console.log("  Creating mock SPL mint...");
  const mintSigner = await generateKeyPairSigner();
  const mintSpace = BigInt(getMintSize());
  const rentExemption = await rpc
    .getMinimumBalanceForRentExemption(mintSpace)
    .send();

  const createAccountIx = getCreateAccountInstruction({
    lamports: rentExemption,
    newAccount: mintSigner, // Pass address here
    payer: payer, // Pass address here
    space: mintSpace,
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const initializeMintIx = getInitializeMint2Instruction({
    mint: mintSigner.address,
    decimals,
    mintAuthority: mintAuthority,
  });

  // Need to sign with both payer and the new mint account signer
  const { value: blockhash } = await rpc.getLatestBlockhash().send();
  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [createAccountIx, initializeMintIx],
        tx
      )
  );
  assertIsTransactionMessageWithinSizeLimit(txMessage);
  // Sign with both payer and the mint's keypair
  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });
  const signature = await getSignatureFromTransaction(signedTx);

  console.log(`    Sending create mint transaction: ${signature}`);
  await sendAndConfirm(signedTx, { commitment: "confirmed" });
  console.log(`    Create mint transaction confirmed: ${signature}`);
  console.log(`  Mock mint created: ${mintSigner.address}`);
  return mintSigner.address;
}

// --- Test Suite ---
describe("Arbitron Bonsol ZK Proof Request", () => {
  const rpc = createSolanaRpc(RPC_URL);
  const rpcSubscriptions = createSolanaRpcSubscriptions(WS_RPC_URL);
  let payer: KeyPairSigner;
  let configPda: Address;
  let mockMintAddress: Address; // Store the created mint address

  before(async () => {
    // Load payer keypair from file instead of generating new one
    const fullKeypair = Uint8Array.from(
      JSON.parse(fs.readFileSync(PAYER_KEYPAIR_PATH, "utf-8"))
    );
    const privateKey = fullKeypair.slice(0, 32); // Take only the private key part
    payer = await createKeyPairSignerFromPrivateKeyBytes(privateKey);

    [configPda] = await getProgramDerivedAddress({
      programAddress: ARBITRON_PROGRAM_ADDRESS,
      seeds: [new TextEncoder().encode("config")],
    });
    console.log(`Config PDA: ${configPda}`);
    console.log(`Payer Address: ${payer.address}`);

    // --- Create Mock Mint ---
    // We create the mint here so it's available for initialize
    mockMintAddress = await createMockMint(payer, payer.address); // Payer is mint authority

    // --- Initialize Config Account if needed ---
    const configAccountInfo = await fetchEncodedAccount(rpc, configPda);
    if (!configAccountInfo.exists) {
      console.log("Config account not found. Initializing...");

      const initializeInput: InitializeAsyncInput = {
        admin: payer,
        config: configPda,
        platformFeeWallet: payer.address, // Using payer's main wallet as fee wallet for simplicity
        platformFeeBps: 100,
      };

      const initializeIx = await getInitializeInstructionAsync(initializeInput);

      // Use the sendInstructions helper
      await sendInstructions(payer, [initializeIx]);
      console.log(`✅ Initialize transaction sent and confirmed!`);
    } else {
      console.log("Config account already initialized.");
      // Optional: Verify the existing config uses the expected mint or re-initialize if needed
    }
  });

  describe("ZK Proof Request Flow", () => {
    test("should successfully store inputs and request a ZK proof", async () => {
      // Assume contest exists and is Ended (same as before)
      const contestName = "TestContestForZK";
      const host = payer;

      const [contestAddress] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ADDRESS,
        seeds: [
          new TextEncoder().encode("contest"),
          new TextEncoder().encode(contestName),
          getAddressEncoder().encode(host.address),
        ],
      });
      console.log(`Using Contest PDA: ${contestAddress}`);

      // Derive PDAs
      const execution_id = randomBytes(16).toString("hex");
      console.log(`Generated Execution ID: ${execution_id}`);

      const [contestInputsPda] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ADDRESS,
        seeds: [
          new TextEncoder().encode("contest_inputs"),
          getAddressEncoder().encode(contestAddress),
        ],
      });

      const [executionRequestAccountPda] = await getProgramDerivedAddress({
        programAddress: BONSOL_PROGRAM_ID,
        seeds: [
          new TextEncoder().encode("execution"),
          getAddressEncoder().encode(payer.address),
          new TextEncoder().encode(execution_id),
        ],
      });

      const [deploymentAccountPda] = await getProgramDerivedAddress({
        programAddress: BONSOL_PROGRAM_ID,
        seeds: [
          new TextEncoder().encode("deployment"),
          keccak_256(ARBITRON_IMAGE_ID),
        ],
      });

      console.log(`Contest Inputs PDA: ${contestInputsPda}`);
      console.log(`Execution Request PDA: ${executionRequestAccountPda}`);
      console.log(`Deployment PDA: ${deploymentAccountPda}`);

      // Prepare Dummy Payload
      const dummyPayload = {
        contestAddress: contestAddress,
        participants: [{ userPublicKey: payer.address, selectedTokens: [] }],
        finalPrices: [
          {
            mint: "So11111111111111111111111111111111111111112",
            price: "150000000",
          },
        ],
      };
      const payloadBytes = Buffer.from(JSON.stringify(dummyPayload));
      const tip = 100_000n;

      // Build Instructions
      const storeContestInputs: StoreContestInputsAsyncInput = {
        payer: payer,
        contest: contestAddress,
        contestInputs: address(contestInputsPda),
        data: payloadBytes,
      };
      const storeContestIx = await getStoreContestInputsInstructionAsync(
        storeContestInputs
      );

      const requestEndContestProof: RequestEndContestProofAsyncInput = {
        payer: payer,
        contest: contestAddress,
        contestInputs: address(contestInputsPda),
        executionRequest: address(executionRequestAccountPda),
        deploymentAccount: address(deploymentAccountPda),
        bonsolProgram: BONSOL_PROGRAM_ID,
        executionId: execution_id,
        tip: tip,
      };
      const requestEndContestIx =
        await getRequestEndContestProofInstructionAsync(requestEndContestProof);

      // Build, Sign, Send, and Confirm Transaction
      console.log("📦 Building and sending ZK request transaction...");
      // Use the sendInstructions helper
      const signature = await sendInstructions(payer, [
        storeContestIx,
        requestEndContestIx,
      ]);

      console.log(
        `✅ ZK Request Transaction Confirmed! Signature: ${signature}`
      );
      console.log(
        `🔍 Inspect on Explorer: https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${encodeURIComponent(
          RPC_URL
        )}`
      );
    });
  });
});
