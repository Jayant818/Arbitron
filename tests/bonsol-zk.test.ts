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
  getAddressEncoder,
  Instruction,
  address,
} from "@solana/kit";

import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstruction,
  getInitializeMint2Instruction,
  getMintSize,
  getMintToCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { describe, before, test } from "node:test";
import assert from "node:assert";

import {
  CreateContestAsyncInput,
  getCreateContestInstructionAsync,
  getContestDecoder,
  isArbitronError,
  ARBITRON_ERROR__INVALID_ENTRY_FEES,
  ARBITRON_ERROR__INVALID_DURATION,
  ARBITRON_ERROR__INVALID_START_TIME,
  getArbitronErrorMessage,
  CreateContestInstruction,
  JoinContestAsyncInput,
  getJoinContestInstructionAsync,
  getParticipentDecoder,
  StartContestInput,
  getStartContestInstruction,
  ContestState,
} from "../dist/js-client/index";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getInitializeInstructionAsync,
  InitializeAsyncInput,
} from "../dist/js-client/instructions/initialize";
import { getConfigDecoder } from "../dist/js-client/accounts/config";

const RPC_URL = "http://127.0.0.1:8899";
const RPC_SUBSCRIPTION_URL = "ws://127.0.0.1:8900";
const ARBITRON_PROGRAM_ID =
  "C63yc2q8kZKsVfabH5A6ip5DSDAx4ryW4av8e4vXMaw2" as Address;
const rpc = createSolanaRpc("http://127.0.0.1:8899");
const rpcSubscription = createSolanaRpcSubscriptions("ws://127.0.0.1:8900");

export async function sendInstructions({
  payer,
  instructions,
}: {
  payer: KeyPairSigner;
  instructions: Instruction[];
}) {
  // Fetch latest blockhash
  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  // Build transaction message
  const txMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx)
  );

  assertIsTransactionMessageWithinSizeLimit(txMsg);

  const signedTx = await signTransactionMessageWithSigners(txMsg);

  const sendAndConfirmTransactionMethod = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions: rpcSubscription,
  });

  return await sendAndConfirmTransactionMethod(signedTx, {
    commitment: "confirmed",
  });
}

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
  return mint.address;
}

async function createATA_MintToken({
  mint_address,
  mint_authority,
  user,
}: {
  mint_address: Address;
  mint_authority: KeyPairSigner;
  user: KeyPairSigner;
}) {
  const [ataAddress] = await findAssociatedTokenPda({
    mint: mint_address,
    owner: user.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const createATAIX = getCreateAssociatedTokenInstruction({
    mint: mint_address,
    ata: ataAddress,
    owner: user.address,
    payer: user,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const mintTokenIx = getMintToCheckedInstruction({
    amount: 6_00_000_000,
    decimals: 6,
    mint: mint_address,
    mintAuthority: mint_authority,
    token: ataAddress,
  });

  await sendInstructions({
    payer: user,
    instructions: [createATAIX, mintTokenIx],
  });

  return ataAddress;
}

async function StartContest(
  startContestInput: StartContestInput,
  payer: KeyPairSigner
) {
  const StartContestIX = await getStartContestInstruction(startContestInput);

  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstructions([StartContestIX], tx)
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

  return tx_signature;
}

async function joinContest({
  joinContestInput,
  payer,
}: {
  joinContestInput: JoinContestAsyncInput;
  payer: KeyPairSigner;
}) {
  const JoinContestIX = await getJoinContestInstructionAsync(joinContestInput);

  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstructions([JoinContestIX], tx)
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
}

describe("Bonsol ZK Integration Tests", () => {
  let owner: KeyPairSigner;
  let host: KeyPairSigner;
  let sudo_host: KeyPairSigner;
  let user1: KeyPairSigner;

  let tokenMint: Address;
  let tokenMint2: Address;
  let tokenMint3: Address;

  let user1_ata: Address;
  let fee_wallet_ata: Address; // New fee wallet ATA owned by owner
  let configPda: Address;

  let contest: Address;
  let sudoHostContest: Address;

  let participantInfoPda: Address;
  let participantUsdcAtaPda: Address;

  before(async () => {
    if (!RPC_URL || !RPC_SUBSCRIPTION_URL || !ARBITRON_PROGRAM_ID) {
      throw new Error("Url is missing in the env");
    }

    assertIsAddress(ARBITRON_PROGRAM_ID);

    owner = await generateKeyPairSigner();
    host = await generateKeyPairSigner();
    sudo_host = await generateKeyPairSigner();
    user1 = await generateKeyPairSigner();

    let airDropFunction = airdropFactory({
      rpc,
      rpcSubscriptions: rpcSubscription,
    });

    await airDropFunction({
      recipientAddress: owner.address,
      lamports: lamports(2_000_000_000n),
      commitment: "confirmed",
    });

    await airDropFunction({
      recipientAddress: host.address,
      lamports: lamports(2_000_000_000n),
      commitment: "confirmed",
    });

    await airDropFunction({
      lamports: lamports(2_000_000_000n),
      recipientAddress: sudo_host.address,
      commitment: "confirmed",
    });

    await airDropFunction({
      recipientAddress: user1.address,
      lamports: lamports(2_000_000_000n),
      commitment: "confirmed",
    });

    tokenMint = await createMint({
      payer: host,
      decimals: 6,
      mintAuthority: host.address,
    });

    tokenMint2 = await createMint({
      payer: host,
      decimals: 6,
      mintAuthority: host.address,
    });

    tokenMint3 = await createMint({
      payer: host,
      decimals: 6,
      mintAuthority: host.address,
    });

    user1_ata = await createATA_MintToken({
      mint_address: tokenMint,
      mint_authority: host,
      user: user1,
    });

    fee_wallet_ata = await createATA_MintToken({
      mint_address: tokenMint,
      mint_authority: host,
      user: owner,
    });

    const configSeeds = [new TextEncoder().encode("config")];
    const [configPdaAddress, configBump] = await getProgramDerivedAddress({
      programAddress: ARBITRON_PROGRAM_ID,
      seeds: configSeeds,
    });
    configPda = configPdaAddress;

    console.log("Setup completed:");
    console.log("Token Mint:", tokenMint);
    console.log("User1 ATA:", user1_ata);
    console.log("Fee Wallet ATA:", fee_wallet_ata);
    console.log("Config PDA:", configPda);
  });

  // Merge them to create  a test for ZK IIntegration test

  describe("initialize", () => {
    test("Initialize Successfully", async () => {
      const initializeInput: InitializeAsyncInput = {
        admin: owner,
        config: configPda,
        platformFeeWallet: fee_wallet_ata,
        platformFeeBps: 50, // 0.5% fee
      };

      const initializeIx = await getInitializeInstructionAsync(
        initializeInput,
        {
          programAddress: ARBITRON_PROGRAM_ID,
        }
      );

      await sendInstructions({
        payer: owner,
        instructions: [initializeIx],
      });

      const configAccountInfo = await rpc
        .getAccountInfo(configPda, {
          encoding: "jsonParsed",
        })
        .send();

      if (!configAccountInfo || !configAccountInfo.value) {
        assert.fail("Config account not found after initialization");
      }

      const rawData = Buffer.from(configAccountInfo.value.data[0], "base64");
      const configData = getConfigDecoder().decode(rawData);

      assert.equal(configData.admin, owner.address);
      assert.equal(configData.platformFeeWallet, fee_wallet_ata);
      assert.equal(configData.platformFeeBps, 50);

      console.log(" Initialize instruction executed successfully");
      console.log("Config Admin:", configData.admin);
      console.log("Platform Fee Wallet:", configData.platformFeeWallet);
      console.log("Platform Fee BPS:", configData.platformFeeBps);
    });
  });

  describe("createContest", () => {
    test("Contest Created Successfully", async () => {
      const contestName = "My Contest";

      const contestSeeds = [
        new TextEncoder().encode("contest"),
        new TextEncoder().encode(contestName),
        getAddressEncoder().encode(host.address),
      ];

      const [contestPda, bump] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ID,
        seeds: contestSeeds,
      });

      // Store contest PDA for other tests to use
      contest = contestPda;

      const createContestAsyncInput: CreateContestAsyncInput = {
        duration: 1000 * 60 * 60 * 2, // 2 hour duration
        entryFees: 1_00_000_000n, // 100 USDC
        maxParticipents: 10,
        name: contestName,
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

      let accountInfo;
      try {
        accountInfo = await rpc
          .getAccountInfo(contestPda, {
            encoding: "jsonParsed",
          })
          .send();
      } catch (error) {
        console.error("Error fetching contest account info:", error);
      }

      if (!accountInfo || !accountInfo.value) {
        throw new Error("Account info is null");
      }

      const rawData = Buffer.from(accountInfo.value.data[0], "base64");

      const contestAccountInfo = getContestDecoder().decode(rawData);

      assert.equal(contestAccountInfo.name, contestName);
      assert.equal(contestAccountInfo.host, host.address);
      assert.equal(contestAccountInfo.entryFees, 1_00_000_000n);
      assert.equal(contestAccountInfo.maxParticipents, 10);
      assert.equal(contestAccountInfo.participentsCount, 0);
      assert.equal(contestAccountInfo.duration, 1000 * 60 * 60 * 2);
    });
  });
});
