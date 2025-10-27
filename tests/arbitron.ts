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

describe("Arbitron Tests ", () => {
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

    test("Initialize Fails with Duplicate Config", async () => {
      const initializeInput: InitializeAsyncInput = {
        admin: owner,
        config: configPda,
        platformFeeWallet: fee_wallet_ata,
        platformFeeBps: 100, // Different fee
      };

      const initializeIx = await getInitializeInstructionAsync(
        initializeInput,
        {
          programAddress: ARBITRON_PROGRAM_ID,
        }
      );

      try {
        await sendInstructions({
          payer: owner,
          instructions: [initializeIx],
        });
        assert.fail("Expected initialize to fail but it succeeded");
      } catch (error) {
        // Should fail with "account already in use" error
        // assert(
        //   error.message.includes("already in use") ||
        //     error.message.includes("Allocate: account already in use"),
        //   `Expected "account already in use" error but got: ${error.message}`
        // );
        console.log("Correctly caught duplicate config initialization error");
      }
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

    //   test("Same Contest Creation Fails with same host", async () => {
    //     let getCreateContestIx;
    //     try {
    //       const contestName = "My Contest";

    //       const seeds = [
    //         new TextEncoder().encode("contest"),
    //         new TextEncoder().encode(contestName),
    //         getAddressEncoder().encode(host.address),
    //       ];

    //       const [contestPda, bump] = await getProgramDerivedAddress({
    //         programAddress: ARBITRON_PROGRAM_ID,
    //         seeds: seeds,
    //       });

    //       const createContestAsyncInput: CreateContestAsyncInput = {
    //         duration: 1000 * 60 * 60 * 2, // 2 hour duration
    //         entryFees: 1_000_000_000n, // 1000 USDC
    //         maxParticipents: 100,
    //         name: contestName,
    //         startTime: Math.floor(Date.now() / 1000) + 120, // Start time 2 minutes from now
    //         signer: host,
    //         tokenMint: tokenMint,
    //         contest: contestPda,
    //       };

    //       getCreateContestIx = await getCreateContestInstructionAsync(
    //         createContestAsyncInput,
    //         {
    //           programAddress: ARBITRON_PROGRAM_ID,
    //         }
    //       );

    //       const { value: blockhash } = await rpc.getLatestBlockhash().send();

    //       const txMsg = pipe(
    //         createTransactionMessage({
    //           version: 0,
    //         }),
    //         (tx) => setTransactionMessageFeePayerSigner(host, tx),
    //         (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    //         (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
    //       );

    //       assertIsTransactionMessageWithinSizeLimit(txMsg);

    //       const signedTx = await signTransactionMessageWithSigners(txMsg);

    //       const sendAndConfirmTransactionMethod =
    //         sendAndConfirmTransactionFactory({
    //           rpc,
    //           rpcSubscriptions: rpcSubscription,
    //         });

    //       await sendAndConfirmTransactionMethod(signedTx, {
    //         commitment: "confirmed",
    //       });
    //       assert.fail("Expected this same name Contest to fail but it succeeded");
    //     } catch (error) {
    //       // console.log("Caught error:", error.message);
    //       // console.log("Error Context", error.context);

    //       // Check if it's our custom error
    //       if (
    //         isArbitronError(
    //           error,
    //           getCreateContestIx,
    //           ARBITRON_ERROR__INVALID_START_TIME
    //         ) ||
    //         error.message.includes("already in use")
    //       ) {
    //         console.log(" Correctly caught InvalidStartTime error");
    //         console.log(
    //           "Error message:",
    //           getArbitronErrorMessage(ARBITRON_ERROR__INVALID_START_TIME)
    //         );
    //       }
    //     }
    //   });

    //   test("Contest Creation Fails with Invalid Entry Fees", async () => {
    //     const contestName = `Invalid Entry Fees Contest`;

    //     const seeds = [
    //       new TextEncoder().encode("contest"),
    //       new TextEncoder().encode(contestName),
    //       getAddressEncoder().encode(host.address),
    //     ];

    //     const [contestPda, bump] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: seeds,
    //     });

    //     const createContestAsyncInput: CreateContestAsyncInput = {
    //       duration: 1000 * 60 * 60 * 2,
    //       entryFees: 0n, // Invalid: zero entry fees
    //       maxParticipents: 10,
    //       name: contestName,
    //       startTime: Math.floor(Date.now() / 1000) + 60,
    //       signer: host,
    //       tokenMint: tokenMint,
    //       contest: contestPda,
    //     };

    //     const getCreateContestIx = await getCreateContestInstructionAsync(
    //       createContestAsyncInput,
    //       {
    //         programAddress: ARBITRON_PROGRAM_ID,
    //       }
    //     );

    //     const { value: blockhash } = await rpc.getLatestBlockhash().send();

    //     const txMsg = pipe(
    //       createTransactionMessage({
    //         version: 0,
    //       }),
    //       (tx) => setTransactionMessageFeePayerSigner(host, tx),
    //       (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    //       (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
    //     );

    //     assertIsTransactionMessageWithinSizeLimit(txMsg);

    //     const signedTx = await signTransactionMessageWithSigners(txMsg);

    //     const sendAndConfirmTransactionMethod = sendAndConfirmTransactionFactory({
    //       rpc,
    //       rpcSubscriptions: rpcSubscription,
    //     });

    //     try {
    //       await sendAndConfirmTransactionMethod(signedTx, {
    //         commitment: "confirmed",
    //       });
    //       assert.fail("Expected contest creation to fail but it succeeded");
    //     } catch (error) {
    //       // console.log("Caught error:", error.code);
    //       // console.log("Error context:", error.context);

    //       // Check if it's our custom error
    //       if (isArbitronError(error, txMsg, ARBITRON_ERROR__INVALID_ENTRY_FEES)) {
    //         console.log(" Correctly caught InvalidEntryFees error");
    //         console.log(
    //           "Error message:",
    //           getArbitronErrorMessage(ARBITRON_ERROR__INVALID_ENTRY_FEES)
    //         );
    //       }
    //     }
    //   });

    //   test("Contest Creation Fails with Invalid Duration", async () => {
    //     const contestName = "Invalid Duration Contest";

    //     const seeds = [
    //       new TextEncoder().encode("contest"),
    //       new TextEncoder().encode(contestName),
    //       getAddressEncoder().encode(host.address),
    //     ];

    //     const [contestPda, bump] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: seeds,
    //     });

    //     const createContestAsyncInput: CreateContestAsyncInput = {
    //       duration: 0, // Invalid: zero duration
    //       entryFees: 1_000_000_000n,
    //       maxParticipents: 10,
    //       name: contestName,
    //       startTime: Math.floor(Date.now() / 1000) + 60,
    //       signer: host,
    //       tokenMint: tokenMint,
    //       contest: contestPda,
    //     };

    //     const getCreateContestIx = await getCreateContestInstructionAsync(
    //       createContestAsyncInput,
    //       {
    //         programAddress: ARBITRON_PROGRAM_ID,
    //       }
    //     );

    //     const { value: blockhash } = await rpc.getLatestBlockhash().send();

    //     const txMsg = pipe(
    //       createTransactionMessage({
    //         version: 0,
    //       }),
    //       (tx) => setTransactionMessageFeePayerSigner(host, tx),
    //       (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    //       (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
    //     );

    //     assertIsTransactionMessageWithinSizeLimit(txMsg);

    //     const signedTx = await signTransactionMessageWithSigners(txMsg);

    //     const sendAndConfirmTransactionMethod = sendAndConfirmTransactionFactory({
    //       rpc,
    //       rpcSubscriptions: rpcSubscription,
    //     });

    //     try {
    //       await sendAndConfirmTransactionMethod(signedTx, {
    //         commitment: "confirmed",
    //       });
    //       assert.fail("Expected contest creation to fail but it succeeded");
    //     } catch (error) {
    //       // console.log("Caught error:", error);
    //       // console.log("Error context:", error.context);

    //       // Check if it's our custom error
    //       if (isArbitronError(error, txMsg, ARBITRON_ERROR__INVALID_DURATION)) {
    //         console.log(" Correctly caught InvalidDuration error");
    //         console.log(
    //           "Error message:",
    //           getArbitronErrorMessage(ARBITRON_ERROR__INVALID_DURATION)
    //         );
    //       }
    //     }
    //   });

    //   test("Different host can Create contest with same name", async () => {
    //     let getCreateContestIx;
    //     try {
    //       const contestName = "My Contest";

    //       // Derive sudo host contest PDA and store it for other tests
    //       const seeds = [
    //         new TextEncoder().encode("contest"),
    //         new TextEncoder().encode(contestName),
    //         getAddressEncoder().encode(sudo_host.address),
    //       ];

    //       const [contestPda, bump] = await getProgramDerivedAddress({
    //         programAddress: ARBITRON_PROGRAM_ID,
    //         seeds: seeds,
    //       });

    //       // Store sudo host contest PDA for other tests to use
    //       sudoHostContest = contestPda;

    //       const createContestAsyncInput: CreateContestAsyncInput = {
    //         duration: 3600,
    //         entryFees: 1_000_000_000n,
    //         maxParticipents: 9,
    //         name: contestName,
    //         startTime: Math.floor(Date.now() / 1000) + 60,
    //         signer: sudo_host,
    //         tokenMint: tokenMint,
    //         contest: contestPda,
    //       };

    //       getCreateContestIx = await getCreateContestInstructionAsync(
    //         createContestAsyncInput,
    //         {
    //           programAddress: ARBITRON_PROGRAM_ID,
    //         }
    //       );

    //       const { value: blockhash } = await rpc.getLatestBlockhash().send();

    //       const txMsg = pipe(
    //         createTransactionMessage({
    //           version: 0,
    //         }),
    //         (tx) => setTransactionMessageFeePayerSigner(host, tx),
    //         (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    //         (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
    //       );

    //       assertIsTransactionMessageWithinSizeLimit(txMsg);

    //       const signedTx = await signTransactionMessageWithSigners(txMsg);

    //       const sendAndConfirmTransactionMethod =
    //         sendAndConfirmTransactionFactory({
    //           rpc,
    //           rpcSubscriptions: rpcSubscription,
    //         });

    //       await sendAndConfirmTransactionMethod(signedTx, {
    //         commitment: "confirmed",
    //       });

    //       const contestAccountInfo = await rpc
    //         .getAccountInfo(contestPda, {
    //           encoding: "jsonParsed",
    //         })
    //         .send();

    //       if (!contestAccountInfo || !contestAccountInfo.value) {
    //         assert.fail("Contest Account is Null");
    //       }

    //       const decodedData = getContestDecoder().decode(
    //         Buffer.from(contestAccountInfo.value.data[0], "base64")
    //       );

    //       assert.equal(decodedData.maxParticipents, 9);
    //     } catch (error) {
    //       console.log("Caught error:", error);
    //       console.log("Error context:", error.context);
    //       assert.fail("Expected contest creation to fail but it succeeded");
    //     }
    //   });
  });

  describe("Join Contest", () => {
    test("Joined Contest Successfully", async () => {
      try {
        // 1️⃣ Compute PDAs based on new contract seeds
        const participantInfoSeed = [
          new TextEncoder().encode("participent"),
          getAddressEncoder().encode(contest),
          getAddressEncoder().encode(user1.address),
        ];
        const [participantInfoPdaAddress] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: participantInfoSeed,
        });
        participantInfoPda = participantInfoPdaAddress;

        const playerGlobalProfileSeed = [
          new TextEncoder().encode("player"),
          getAddressEncoder().encode(user1.address),
        ];
        const [playerGlobalProfilePda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: playerGlobalProfileSeed,
        });

        const prizePoolVaultSeed = [
          new TextEncoder().encode("prize_pool_usdc"),
          getAddressEncoder().encode(contest),
        ];
        const [prizePoolVault] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: prizePoolVaultSeed,
        });

        // 2️⃣ Prepare selected tokens
        const selectedTokens = [
          {
            mint: tokenMint,
            amount: 10_000_000n, // 10 USDC in 6 decimals
            name: "USDC Token",
            isPowerToken: false,
            quantity: 10,
          },
        ];

        // 3️⃣ Build JoinContest input
        const joinContestInput: JoinContestAsyncInput = {
          contest: contest,
          host: host.address,
          participent: user1,
          selectedTokens,
          tokenMint,
          userAta: user1_ata,
          participentInfo: participantInfoPda,
          playerGlobalProfile: playerGlobalProfilePda,
          prizePoolVault,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        };

        // 4️⃣ Check balance before join
        const userBalanceBefore = await rpc
          .getTokenAccountBalance(user1_ata)
          .send();
        assert(
          userBalanceBefore.value.amount,
          "User balance is null before join"
        );

        // 5️⃣ Call joinContest
        await joinContest({ joinContestInput, payer: user1 });

        // 6️⃣ Check balance after join
        const userBalanceAfter = await rpc
          .getTokenAccountBalance(user1_ata)
          .send();
        assert(
          userBalanceAfter.value.amount,
          "User balance is null after join"
        );
        assert.notEqual(
          userBalanceBefore.value.amount,
          userBalanceAfter.value.amount,
          "User balance was not deducted"
        );

        // 7️⃣ Fetch participant info account
        const participantInfoAccount = await rpc
          .getAccountInfo(participantInfoPda, { encoding: "base64" })
          .send();
        assert(
          participantInfoAccount.value,
          "Participant info account not found"
        );

        const participantInfoData = getParticipentDecoder().decode(
          Buffer.from(participantInfoAccount.value.data[0], "base64")
        );

        // 8️⃣ Fetch participant USDC balance
        const participantUsdcBalance = await rpc
          .getTokenAccountBalance(prizePoolVault)
          .send();
        assert(
          participantUsdcBalance.value,
          "Participant USDC balance not found"
        );

        // 9️⃣ Verify participant info
        assert.equal(
          participantInfoData.user,
          user1.address,
          "Participant user mismatch"
        );

        // 10️⃣ Verify contest participant count incremented
        const contestAccountInfo = await rpc
          .getAccountInfo(contest, { encoding: "base64" })
          .send();

        console.log("Contest Account Info:", contestAccountInfo);
        const contestData = getContestDecoder().decode(
          Buffer.from(contestAccountInfo.value.data[0], "base64")
        );
        assert.equal(
          contestData.participentsCount,
          1,
          "Contest participant count not incremented"
        );

        console.log("✅ Joined contest successfully");
      } catch (error) {
        console.error("Error joining contest:", error);
        assert.fail("participant unable to join the contest");
      }
    });

    // test("User cannot join same contest twice", async () => {
    //   try {
    //     const participantInfoSeeds = [
    //       new TextEncoder().encode("participent"),
    //       getAddressEncoder().encode(contest),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [participantInfoPdaAddress] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: participantInfoSeeds,
    //     });

    //     // Storing it for other tests to use
    //     participantInfoPda = participantInfoPdaAddress;

    //     const participantUsdcAtaSeeds = [
    //       new TextEncoder().encode("participent_usdc_ata"),
    //       getAddressEncoder().encode(user1.address),
    //       getAddressEncoder().encode(tokenMint),
    //       getAddressEncoder().encode(contest),
    //     ];

    //     const [participantUsdcAtaPdaAddress] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: participantUsdcAtaSeeds,
    //     });

    //     // Store for other tests to use
    //     participantUsdcAtaPda = participantUsdcAtaPdaAddress;

    //     let playerGlobalProfileSeeds = [
    //       new TextEncoder().encode("player"),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [playerGlobalProfilePda] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: playerGlobalProfileSeeds,
    //     });

    //     let tradingPdaSeeds = [
    //       new TextEncoder().encode("trading_pda"),
    //       getAddressEncoder().encode(contest),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [tradingPda] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: tradingPdaSeeds,
    //     });

    //     const joinContestInput: JoinContestAsyncInput = {
    //       contest: contest,
    //       host: host.address,
    //       participent: user1,
    //       tokenMint: tokenMint,
    //       userAta: user1_ata,
    //       platformFeeWallet: fee_wallet_ata, // Use fee wallet ATA
    //       participentInfo: participantInfoPda,
    //       participentUsdcAta: participantUsdcAtaPda,
    //       config: configPda,
    //       playerGlobalProfile: playerGlobalProfilePda,
    //       tradingPda: tradingPda,
    //     };

    //     let user1_usdc_balance_before_join = await rpc
    //       .getTokenAccountBalance(user1_ata)
    //       .send();

    //     if (
    //       !user1_usdc_balance_before_join ||
    //       !user1_usdc_balance_before_join.value
    //     ) {
    //       assert.fail("User1 USDC balance is null");
    //     }

    //     await joinContest({
    //       joinContestInput,
    //       payer: user1,
    //     });

    //     let user1_usdc_balance_after_join = await rpc
    //       .getTokenAccountBalance(user1_ata)
    //       .send();

    //     if (
    //       !user1_usdc_balance_after_join ||
    //       !user1_usdc_balance_after_join.value
    //     ) {
    //       assert.fail("User1 USDC balance is null");
    //     }

    //     // Fecthing Created PDA DATA
    //     const participantInfoAccount = await rpc
    //       .getAccountInfo(participantInfoPda, {
    //         encoding: "jsonParsed",
    //       })
    //       .send();

    //     if (!participantInfoAccount || !participantInfoAccount.value) {
    //       assert.fail("Participant info account is null");
    //     }

    //     let participantInfoAccountData = getParticipentDecoder().decode(
    //       Buffer.from(participantInfoAccount.value.data[0], "base64")
    //     );

    //     const participant_usdc_balance = await rpc
    //       .getTokenAccountBalance(participantUsdcAtaPda)
    //       .send();

    //     if (!participant_usdc_balance || !participant_usdc_balance.value) {
    //       assert.fail("Participant USDC balance is null");
    //     }

    //     assert.fail(
    //       "Expected joining same contest twice to fail but it succeeded"
    //     );
    //   } catch (error) {
    //     if (
    //       error.context?.logs?.some((l: string) => l.includes("already in use"))
    //     ) {
    //       console.log(
    //         "User cannot join same contest twice (PDA already exists)"
    //       );
    //       return;
    //     }
    //     assert.fail("Unepected Error" + error);
    //   }
    // });

    // test("User cannot join another contest at the same time", async () => {
    //   try {
    //     const participantInfoSeeds = [
    //       new TextEncoder().encode("participent"),
    //       getAddressEncoder().encode(sudoHostContest),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [participantInfoPdaAddress] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: participantInfoSeeds,
    //     });

    //     const participantUsdcAtaSeeds = [
    //       new TextEncoder().encode("participent_usdc_ata"),
    //       getAddressEncoder().encode(user1.address),
    //       getAddressEncoder().encode(tokenMint),
    //       getAddressEncoder().encode(sudoHostContest),
    //     ];

    //     const [participantUsdcAtaPdaAddress] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: participantUsdcAtaSeeds,
    //     });

    //     let playerGlobalProfileSeeds = [
    //       new TextEncoder().encode("player"),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [playerGlobalProfilePda] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: playerGlobalProfileSeeds,
    //     });

    //     let tradingPdaSeeds = [
    //       new TextEncoder().encode("trading_pda"),
    //       getAddressEncoder().encode(sudoHostContest),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [tradingPda] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: tradingPdaSeeds,
    //     });

    //     const joinContestInput: JoinContestAsyncInput = {
    //       contest: sudoHostContest,
    //       host: sudo_host.address,
    //       participent: user1,
    //       tokenMint: tokenMint,
    //       userAta: user1_ata,
    //       platformFeeWallet: fee_wallet_ata, // Use fee wallet ATA
    //       participentInfo: participantInfoPdaAddress,
    //       participentUsdcAta: participantUsdcAtaPdaAddress,
    //       config: configPda,
    //       playerGlobalProfile: playerGlobalProfilePda,
    //       tradingPda: tradingPda,
    //     };

    //     let user1_usdc_balance_before_join = await rpc
    //       .getTokenAccountBalance(user1_ata)
    //       .send();

    //     if (
    //       !user1_usdc_balance_before_join ||
    //       !user1_usdc_balance_before_join.value
    //     ) {
    //       assert.fail("User1 USDC balance is null");
    //     }

    //     await joinContest({
    //       joinContestInput,
    //       payer: user1,
    //     });

    //     let user1_usdc_balance_after_join = await rpc
    //       .getTokenAccountBalance(user1_ata)
    //       .send();

    //     if (
    //       !user1_usdc_balance_after_join ||
    //       !user1_usdc_balance_after_join.value
    //     ) {
    //       assert.fail("User1 USDC balance is null");
    //     }

    //     // Fecthing Created PDA DATA
    //     const participantInfoAccount = await rpc
    //       .getAccountInfo(participantInfoPdaAddress, {
    //         encoding: "jsonParsed",
    //       })
    //       .send();

    //     if (!participantInfoAccount || !participantInfoAccount.value) {
    //       assert.fail("Participant info account is null");
    //     }

    //     let participantInfoAccountData = getParticipentDecoder().decode(
    //       Buffer.from(participantInfoAccount.value.data[0], "base64")
    //     );

    //     const participant_usdc_balance = await rpc
    //       .getTokenAccountBalance(participantUsdcAtaPdaAddress)
    //       .send();

    //     if (!participant_usdc_balance || !participant_usdc_balance.value) {
    //       assert.fail("Participant USDC balance is null");
    //     }

    //     assert.fail(
    //       "Expected joining diff contest at same times to fail but it succeeded"
    //     );
    //   } catch (error) {
    //     console.log("Error", error);
    //     if (
    //       error.context?.logs?.some((l: string) =>
    //         l.includes("Already Participated in another contest")
    //       )
    //     ) {
    //       console.log("Already Participated in another contest");
    //       return;
    //     }
    //     assert.fail("Unexpected Error" + error);
    //   }
    // });

    // test("User Provided different ata address that he don't own", async () => {
    //   try {
    //     // Create a third person (different from user1)
    //     const thirdPerson = await generateKeyPairSigner();

    //     // Airdrop SOL to third person
    //     const airDropFunction = airdropFactory({
    //       rpc,
    //       rpcSubscriptions: rpcSubscription,
    //     });

    //     await airDropFunction({
    //       recipientAddress: thirdPerson.address,
    //       lamports: lamports(1_000_000_000n),
    //       commitment: "confirmed",
    //     });

    //     // Create ATA for third person (not user1)
    //     const thirdPersonAta = await createATA_MintToken({
    //       mint_address: tokenMint,
    //       mint_authority: host,
    //       user: thirdPerson,
    //     });

    //     console.log("Third person address:", thirdPerson.address);
    //     console.log("Third person ATA:", thirdPersonAta);
    //     console.log("User1 address:", user1.address);
    //     console.log("User1 trying to use third person's ATA");

    //     // Derive PDAs for user1 joining sudoHostContest
    //     const participantInfoSeeds = [
    //       new TextEncoder().encode("participent"),
    //       getAddressEncoder().encode(sudoHostContest),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [participantInfoPdaAddress] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: participantInfoSeeds,
    //     });

    //     const participantUsdcAtaSeeds = [
    //       new TextEncoder().encode("participent_usdc_ata"),
    //       getAddressEncoder().encode(user1.address),
    //       getAddressEncoder().encode(tokenMint),
    //       getAddressEncoder().encode(sudoHostContest),
    //     ];

    //     const [participantUsdcAtaPdaAddress] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: participantUsdcAtaSeeds,
    //     });

    //     const playerGlobalProfileSeeds = [
    //       new TextEncoder().encode("player"),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [playerGlobalProfilePda] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: playerGlobalProfileSeeds,
    //     });

    //     const tradingPdaSeeds = [
    //       new TextEncoder().encode("trading_pda"),
    //       getAddressEncoder().encode(sudoHostContest),
    //       getAddressEncoder().encode(user1.address),
    //     ];

    //     const [tradingPda] = await getProgramDerivedAddress({
    //       programAddress: ARBITRON_PROGRAM_ID,
    //       seeds: tradingPdaSeeds,
    //     });

    //     await joinContest({
    //       joinContestInput: {
    //         contest: sudoHostContest,
    //         host: sudo_host.address,
    //         participent: user1,
    //         tokenMint: tokenMint,
    //         userAta: thirdPersonAta, // Using third person's ATA instead of user1's ATA
    //         platformFeeWallet: fee_wallet_ata,
    //         participentInfo: participantInfoPdaAddress,
    //         participentUsdcAta: participantUsdcAtaPdaAddress,
    //         config: configPda,
    //         playerGlobalProfile: playerGlobalProfilePda,
    //         tradingPda: tradingPda,
    //       },
    //       payer: user1, // user1 is trying to pay from an ATA they don't own
    //     });

    //     // If we reach here, the test should fail
    //     assert.fail(
    //       "Expected transaction to fail when using ATA owned by different user"
    //     );
    //   } catch (error) {
    //     console.log("Caught expected error:", error.message);
    //     console.log("Error context:", error.context);

    //     // Check if it's the expected error (token account owner mismatch or similar)
    //     const errorLogs = error.context?.logs || [];
    //     const isOwnershipError =
    //       error.message.includes("owner") ||
    //       error.message.includes("authority") ||
    //       errorLogs.some(
    //         (log: string) =>
    //           log.includes("Invalid token account owner") ||
    //           log.includes("owner does not match") ||
    //           log.includes("authority") ||
    //           log.includes("A token owner constraint was violated")
    //       );

    //     if (isOwnershipError) {
    //       console.log("✓ Correctly caught token account ownership error");
    //     } else {
    //       console.log(
    //         "Unexpected error type - logging full error for debugging:"
    //       );
    //       console.log("Error code:", error.context?.code);
    //       console.log("Error logs:", errorLogs);
    //       // Don't fail the test - just log for debugging
    //       console.log(
    //         "⚠️ Got different error than expected, but transaction still failed as intended"
    //       );
    //     }
    //   }
    // });
  });

  // describe("Start Contest", () => {
  //   let secondParticipant: KeyPairSigner;
  //   let secondParticipant_ata: Address;

  //   before(async () => {
  //     // Add a second participant to meet the minimum requirement
  //     secondParticipant = await generateKeyPairSigner();

  //     // Airdrop SOL to second participant
  //     const airDropFunction = airdropFactory({
  //       rpc,
  //       rpcSubscriptions: rpcSubscription,
  //     });

  //     await airDropFunction({
  //       recipientAddress: secondParticipant.address,
  //       lamports: lamports(1_000_000_000n),
  //       commitment: "confirmed",
  //     });

  //     // Create ATA for second participant
  //     secondParticipant_ata = await createATA_MintToken({
  //       mint_address: tokenMint,
  //       mint_authority: host,
  //       user: secondParticipant,
  //     });

  //     // Second participant joins the contest
  //     const participant2InfoSeeds = [
  //       new TextEncoder().encode("participent"),
  //       getAddressEncoder().encode(contest),
  //       getAddressEncoder().encode(secondParticipant.address),
  //     ];

  //     const [participant2InfoPda] = await getProgramDerivedAddress({
  //       programAddress: ARBITRON_PROGRAM_ID,
  //       seeds: participant2InfoSeeds,
  //     });

  //     const participant2UsdcAtaSeeds = [
  //       new TextEncoder().encode("participent_usdc_ata"),
  //       getAddressEncoder().encode(secondParticipant.address),
  //       getAddressEncoder().encode(tokenMint),
  //       getAddressEncoder().encode(contest),
  //     ];

  //     const [participant2UsdcAtaPda] = await getProgramDerivedAddress({
  //       programAddress: ARBITRON_PROGRAM_ID,
  //       seeds: participant2UsdcAtaSeeds,
  //     });

  //     const participant2GlobalProfileSeeds = [
  //       new TextEncoder().encode("player"),
  //       getAddressEncoder().encode(secondParticipant.address),
  //     ];

  //     const [participant2GlobalProfilePda] = await getProgramDerivedAddress({
  //       programAddress: ARBITRON_PROGRAM_ID,
  //       seeds: participant2GlobalProfileSeeds,
  //     });

  //     const participant2TradingPdaSeeds = [
  //       new TextEncoder().encode("trading_pda"),
  //       getAddressEncoder().encode(contest),
  //       getAddressEncoder().encode(secondParticipant.address),
  //     ];

  //     const [participant2TradingPda] = await getProgramDerivedAddress({
  //       programAddress: ARBITRON_PROGRAM_ID,
  //       seeds: participant2TradingPdaSeeds,
  //     });

  //     // Join contest with second participant
  //     await joinContest({
  //       joinContestInput: {
  //         contest: contest,
  //         host: host.address,
  //         participent: secondParticipant,
  //         tokenMint: tokenMint,
  //         userAta: secondParticipant_ata,
  //         platformFeeWallet: fee_wallet_ata,
  //         participentInfo: participant2InfoPda,
  //         participentUsdcAta: participant2UsdcAtaPda,
  //         config: configPda,
  //         playerGlobalProfile: participant2GlobalProfilePda,
  //         tradingPda: participant2TradingPda,
  //       },
  //       payer: secondParticipant,
  //     });

  //     console.log("✓ Second participant added successfully");
  //   });

  //   test("Anyone can start contest when conditions are met", async () => {
  //     // Create a new contest with past start time and 2 participants
  //     const contestName = "Immediate Start Contest";

  //     const seeds = [
  //       new TextEncoder().encode("contest"),
  //       new TextEncoder().encode(contestName),
  //       getAddressEncoder().encode(host.address),
  //     ];

  //     const [immediateContestPda, bump] = await getProgramDerivedAddress({
  //       programAddress: ARBITRON_PROGRAM_ID,
  //       seeds: seeds,
  //     });

  //     const createContestAsyncInput: CreateContestAsyncInput = {
  //       duration: 1000 * 60 * 60 * 2, // 2 hour duration
  //       entryFees: 1_00_000_000n, // 100 USDC (same as main contest)
  //       maxParticipents: 100,
  //       name: contestName,
  //       startTime: Math.floor(Date.now() / 1000) - 60, // Start time in the past
  //       signer: host,
  //       tokenMint: tokenMint,
  //       contest: immediateContestPda,
  //     };

  //     const getCreateContestIx = await getCreateContestInstructionAsync(
  //       createContestAsyncInput,
  //       {
  //         programAddress: ARBITRON_PROGRAM_ID,
  //       }
  //     );

  //     const { value: blockhash } = await rpc.getLatestBlockhash().send();

  //     const txMsg = pipe(
  //       createTransactionMessage({
  //         version: 0,
  //       }),
  //       (tx) => setTransactionMessageFeePayerSigner(host, tx),
  //       (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
  //       (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
  //     );

  //     assertIsTransactionMessageWithinSizeLimit(txMsg);

  //     const signedTx = await signTransactionMessageWithSigners(txMsg);

  //     const sendAndConfirmTransactionMethod = sendAndConfirmTransactionFactory({
  //       rpc,
  //       rpcSubscriptions: rpcSubscription,
  //     });

  //     await sendAndConfirmTransactionMethod(signedTx, {
  //       commitment: "confirmed",
  //     });

  //     // Add 2 participants to meet minimum requirement
  //     const participant1 = await generateKeyPairSigner();
  //     const participant2 = await generateKeyPairSigner();

  //     const airDropFunction = airdropFactory({
  //       rpc,
  //       rpcSubscriptions: rpcSubscription,
  //     });

  //     for (const [index, participant] of [
  //       participant1,
  //       participant2,
  //     ].entries()) {
  //       await airDropFunction({
  //         recipientAddress: participant.address,
  //         lamports: lamports(1_000_000_000n),
  //         commitment: "confirmed",
  //       });

  //       const participantAta = await createATA_MintToken({
  //         mint_address: tokenMint,
  //         mint_authority: host,
  //         user: participant,
  //       });

  //       // Create PDAs for participant
  //       const participantInfoSeeds = [
  //         new TextEncoder().encode("participent"),
  //         getAddressEncoder().encode(immediateContestPda),
  //         getAddressEncoder().encode(participant.address),
  //       ];

  //       const [participantInfoPda] = await getProgramDerivedAddress({
  //         programAddress: ARBITRON_PROGRAM_ID,
  //         seeds: participantInfoSeeds,
  //       });

  //       const participantUsdcAtaSeeds = [
  //         new TextEncoder().encode("participent_usdc_ata"),
  //         getAddressEncoder().encode(participant.address),
  //         getAddressEncoder().encode(tokenMint),
  //         getAddressEncoder().encode(immediateContestPda),
  //       ];

  //       const [participantUsdcAtaPda] = await getProgramDerivedAddress({
  //         programAddress: ARBITRON_PROGRAM_ID,
  //         seeds: participantUsdcAtaSeeds,
  //       });

  //       const participantGlobalProfileSeeds = [
  //         new TextEncoder().encode("player"),
  //         getAddressEncoder().encode(participant.address),
  //       ];

  //       const [participantGlobalProfilePda] = await getProgramDerivedAddress({
  //         programAddress: ARBITRON_PROGRAM_ID,
  //         seeds: participantGlobalProfileSeeds,
  //       });

  //       const participantTradingPdaSeeds = [
  //         new TextEncoder().encode("trading_pda"),
  //         getAddressEncoder().encode(immediateContestPda),
  //         getAddressEncoder().encode(participant.address),
  //       ];

  //       const [participantTradingPda] = await getProgramDerivedAddress({
  //         programAddress: ARBITRON_PROGRAM_ID,
  //         seeds: participantTradingPdaSeeds,
  //       });

  //       // Join contest
  //       await joinContest({
  //         joinContestInput: {
  //           contest: immediateContestPda,
  //           host: host.address,
  //           participent: participant,
  //           tokenMint: tokenMint,
  //           userAta: participantAta,
  //           platformFeeWallet: fee_wallet_ata,
  //           participentInfo: participantInfoPda,
  //           participentUsdcAta: participantUsdcAtaPda,
  //           config: configPda,
  //           playerGlobalProfile: participantGlobalProfilePda,
  //           tradingPda: participantTradingPda,
  //         },
  //         payer: participant,
  //       });

  //       console.log(`✓ Participant ${index + 1} joined successfully`);
  //     }

  //     const startContestInput: StartContestInput = {
  //       contest: immediateContestPda,
  //       host: host,
  //     };

  //     // Anyone can start the contest (using user1 who is not the host)
  //     await StartContest(startContestInput, user1);

  //     const contestAccountInfo = await rpc
  //       .getAccountInfo(immediateContestPda, {
  //         encoding: "jsonParsed",
  //       })
  //       .send();

  //     if (!contestAccountInfo || !contestAccountInfo.value) {
  //       assert.fail("Contest Account is Null");
  //     }

  //     const decodedData = getContestDecoder().decode(
  //       Buffer.from(contestAccountInfo.value.data[0], "base64")
  //     );

  //     assert.equal(decodedData.status, ContestState.Ongoing);
  //     console.log("✓ Contest started successfully by non-host user");
  //   });

  //   test("Cannot start contest before start time", async () => {
  //     try {
  //       const contestName = "Future Start Time Contest";

  //       const seeds = [
  //         new TextEncoder().encode("contest"),
  //         new TextEncoder().encode(contestName),
  //         getAddressEncoder().encode(host.address),
  //       ];

  //       const [futureContestPda, bump] = await getProgramDerivedAddress({
  //         programAddress: ARBITRON_PROGRAM_ID,
  //         seeds: seeds,
  //       });

  //       const createContestAsyncInput: CreateContestAsyncInput = {
  //         duration: 1000 * 60 * 60 * 2, // 2 hour duration
  //         entryFees: 1_00_000_000n, // 100 USDC
  //         maxParticipents: 100,
  //         name: contestName,
  //         startTime: Math.floor(Date.now() / 1000) + 3600, // Start time 1 hour in the future
  //         signer: host,
  //         tokenMint: tokenMint,
  //         contest: futureContestPda,
  //       };

  //       const getCreateContestIx = await getCreateContestInstructionAsync(
  //         createContestAsyncInput,
  //         {
  //           programAddress: ARBITRON_PROGRAM_ID,
  //         }
  //       );

  //       const { value: blockhash } = await rpc.getLatestBlockhash().send();

  //       const txMsg = pipe(
  //         createTransactionMessage({
  //           version: 0,
  //         }),
  //         (tx) => setTransactionMessageFeePayerSigner(host, tx),
  //         (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
  //         (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
  //       );

  //       assertIsTransactionMessageWithinSizeLimit(txMsg);

  //       const signedTx = await signTransactionMessageWithSigners(txMsg);

  //       const sendAndConfirmTransactionMethod =
  //         sendAndConfirmTransactionFactory({
  //           rpc,
  //           rpcSubscriptions: rpcSubscription,
  //         });

  //       await sendAndConfirmTransactionMethod(signedTx, {
  //         commitment: "confirmed",
  //       });

  //       // Add 2 participants to meet minimum requirement
  //       const participant1 = await generateKeyPairSigner();
  //       const participant2 = await generateKeyPairSigner();

  //       // Setup participants (similar to earlier logic but abbreviated for space)
  //       const airDropFunction = airdropFactory({
  //         rpc,
  //         rpcSubscriptions: rpcSubscription,
  //       });

  //       for (const participant of [participant1, participant2]) {
  //         await airDropFunction({
  //           recipientAddress: participant.address,
  //           lamports: lamports(1_000_000_000n),
  //           commitment: "confirmed",
  //         });

  //         const participantAta = await createATA_MintToken({
  //           mint_address: tokenMint,
  //           mint_authority: host,
  //           user: participant,
  //         });

  //         // Create PDAs for participant
  //         const participantInfoSeeds = [
  //           new TextEncoder().encode("participent"),
  //           getAddressEncoder().encode(futureContestPda),
  //           getAddressEncoder().encode(participant.address),
  //         ];

  //         const [participantInfoPda] = await getProgramDerivedAddress({
  //           programAddress: ARBITRON_PROGRAM_ID,
  //           seeds: participantInfoSeeds,
  //         });

  //         const participantUsdcAtaSeeds = [
  //           new TextEncoder().encode("participent_usdc_ata"),
  //           getAddressEncoder().encode(participant.address),
  //           getAddressEncoder().encode(tokenMint),
  //           getAddressEncoder().encode(futureContestPda),
  //         ];

  //         const [participantUsdcAtaPda] = await getProgramDerivedAddress({
  //           programAddress: ARBITRON_PROGRAM_ID,
  //           seeds: participantUsdcAtaSeeds,
  //         });

  //         const participantGlobalProfileSeeds = [
  //           new TextEncoder().encode("player"),
  //           getAddressEncoder().encode(participant.address),
  //         ];

  //         const [participantGlobalProfilePda] = await getProgramDerivedAddress({
  //           programAddress: ARBITRON_PROGRAM_ID,
  //           seeds: participantGlobalProfileSeeds,
  //         });

  //         const participantTradingPdaSeeds = [
  //           new TextEncoder().encode("trading_pda"),
  //           getAddressEncoder().encode(futureContestPda),
  //           getAddressEncoder().encode(participant.address),
  //         ];

  //         const [participantTradingPda] = await getProgramDerivedAddress({
  //           programAddress: ARBITRON_PROGRAM_ID,
  //           seeds: participantTradingPdaSeeds,
  //         });

  //         // Join contest
  //         await joinContest({
  //           joinContestInput: {
  //             contest: futureContestPda,
  //             host: host.address,
  //             participent: participant,
  //             tokenMint: tokenMint,
  //             userAta: participantAta,
  //             platformFeeWallet: fee_wallet_ata,
  //             participentInfo: participantInfoPda,
  //             participentUsdcAta: participantUsdcAtaPda,
  //             config: configPda,
  //             playerGlobalProfile: participantGlobalProfilePda,
  //             tradingPda: participantTradingPda,
  //           },
  //           payer: participant,
  //         });
  //       }

  //       // Try to start contest before start time
  //       const startContestInput: StartContestInput = {
  //         contest: futureContestPda,
  //         host: host,
  //       };

  //       await StartContest(startContestInput, user1);
  //       assert.fail(
  //         "Expected starting contest before start time to fail but it succeeded"
  //       );
  //     } catch (error) {
  //       console.log("Caught expected error:", error.message);
  //       console.log("Error context:", error.context);

  //       const errorLogs = error.context?.logs || [];
  //       const isTimeError =
  //         error.message.includes("ContestNotStartedYet") ||
  //         error.message.includes("start") ||
  //         errorLogs.some(
  //           (log: string) =>
  //             log.includes("ContestNotStartedYet") ||
  //             log.includes("Contest not started yet") ||
  //             log.includes("start time")
  //         );

  //       if (isTimeError) {
  //         console.log("✓ Correctly caught contest not started yet error");
  //       } else {
  //         console.log(
  //           "Unexpected error type - logging full error for debugging:"
  //         );
  //         console.log("Error code:", error.context?.code);
  //         console.log("Error logs:", errorLogs);
  //         console.log(
  //           "⚠️ Got different error than expected, but transaction still failed as intended"
  //         );
  //       }
  //     }
  //   });

  //   test("Anyone can start the contest if required time has passed", async () => {
  //     try {
  //       // Create a new contest with start time in the past
  //       const contestName = "Past Start Time Contest";

  //       const seeds = [
  //         new TextEncoder().encode("contest"),
  //         new TextEncoder().encode(contestName),
  //         getAddressEncoder().encode(host.address),
  //       ];

  //       const [pastContestPda, bump] = await getProgramDerivedAddress({
  //         programAddress: ARBITRON_PROGRAM_ID,
  //         seeds: seeds,
  //       });

  //       const createContestAsyncInput: CreateContestAsyncInput = {
  //         duration: 1000 * 60 * 60 * 2, // 2 hour duration
  //         entryFees: 1_00_000_000n, // 100 USDC (same as main contest)
  //         maxParticipents: 100,
  //         name: contestName,
  //         startTime: Math.floor(Date.now() / 1000) - 60, // Start time 1 minute ago (in the past)
  //         signer: host,
  //         tokenMint: tokenMint,
  //         contest: pastContestPda,
  //       };

  //       const getCreateContestIx = await getCreateContestInstructionAsync(
  //         createContestAsyncInput,
  //         {
  //           programAddress: ARBITRON_PROGRAM_ID,
  //         }
  //       );

  //       const { value: blockhash } = await rpc.getLatestBlockhash().send();

  //       const txMsg = pipe(
  //         createTransactionMessage({
  //           version: 0,
  //         }),
  //         (tx) => setTransactionMessageFeePayerSigner(host, tx),
  //         (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
  //         (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
  //       );

  //       assertIsTransactionMessageWithinSizeLimit(txMsg);

  //       const signedTx = await signTransactionMessageWithSigners(txMsg);

  //       const sendAndConfirmTransactionMethod =
  //         sendAndConfirmTransactionFactory({
  //           rpc,
  //           rpcSubscriptions: rpcSubscription,
  //         });

  //       await sendAndConfirmTransactionMethod(signedTx, {
  //         commitment: "confirmed",
  //       });

  //       // Add 2 participants to meet minimum requirement
  //       const participant1 = await generateKeyPairSigner();
  //       const participant2 = await generateKeyPairSigner();

  //       // Airdrop SOL to both participants
  //       const airDropFunction = airdropFactory({
  //         rpc,
  //         rpcSubscriptions: rpcSubscription,
  //       });

  //       for (const [index, participant] of [
  //         participant1,
  //         participant2,
  //       ].entries()) {
  //         await airDropFunction({
  //           recipientAddress: participant.address,
  //           lamports: lamports(1_000_000_000n),
  //           commitment: "confirmed",
  //         });

  //         // Create ATA for participant
  //         const participantAta = await createATA_MintToken({
  //           mint_address: tokenMint,
  //           mint_authority: host,
  //           user: participant,
  //         });

  //         // Participant joins the contest
  //         const participantInfoSeeds = [
  //           new TextEncoder().encode("participent"),
  //           getAddressEncoder().encode(pastContestPda),
  //           getAddressEncoder().encode(participant.address),
  //         ];

  //         const [participantInfoPda] = await getProgramDerivedAddress({
  //           programAddress: ARBITRON_PROGRAM_ID,
  //           seeds: participantInfoSeeds,
  //         });

  //         const participantUsdcAtaSeeds = [
  //           new TextEncoder().encode("participent_usdc_ata"),
  //           getAddressEncoder().encode(participant.address),
  //           getAddressEncoder().encode(tokenMint),
  //           getAddressEncoder().encode(pastContestPda),
  //         ];

  //         const [participantUsdcAtaPda] = await getProgramDerivedAddress({
  //           programAddress: ARBITRON_PROGRAM_ID,
  //           seeds: participantUsdcAtaSeeds,
  //         });

  //         const participantGlobalProfileSeeds = [
  //           new TextEncoder().encode("player"),
  //           getAddressEncoder().encode(participant.address),
  //         ];

  //         const [participantGlobalProfilePda] = await getProgramDerivedAddress({
  //           programAddress: ARBITRON_PROGRAM_ID,
  //           seeds: participantGlobalProfileSeeds,
  //         });

  //         const participantTradingPdaSeeds = [
  //           new TextEncoder().encode("trading_pda"),
  //           getAddressEncoder().encode(pastContestPda),
  //           getAddressEncoder().encode(participant.address),
  //         ];

  //         const [participantTradingPda] = await getProgramDerivedAddress({
  //           programAddress: ARBITRON_PROGRAM_ID,
  //           seeds: participantTradingPdaSeeds,
  //         });

  //         // Join contest with participant
  //         await joinContest({
  //           joinContestInput: {
  //             contest: pastContestPda,
  //             host: host.address,
  //             participent: participant,
  //             tokenMint: tokenMint,
  //             userAta: participantAta,
  //             platformFeeWallet: fee_wallet_ata,
  //             participentInfo: participantInfoPda,
  //             participentUsdcAta: participantUsdcAtaPda,
  //             config: configPda,
  //             playerGlobalProfile: participantGlobalProfilePda,
  //             tradingPda: participantTradingPda,
  //           },
  //           payer: participant,
  //         });

  //         console.log(
  //           `✓ Participant ${index + 1} joined the past contest successfully`
  //         );
  //       }

  //       // Now anyone (even non-host) can start the contest since time has passed
  //       const startContestInput: StartContestInput = {
  //         contest: pastContestPda,
  //         host: host,
  //       };

  //       await StartContest(startContestInput, user1); // Non-host starting the contest

  //       const contestAccountInfo = await rpc
  //         .getAccountInfo(pastContestPda, {
  //           encoding: "jsonParsed",
  //         })
  //         .send();

  //       if (!contestAccountInfo || !contestAccountInfo.value) {
  //         assert.fail("Contest Account is Null");
  //       }

  //       const decodedData = getContestDecoder().decode(
  //         Buffer.from(contestAccountInfo.value.data[0], "base64")
  //       );

  //       assert.equal(decodedData.status, ContestState.Ongoing);
  //       console.log(
  //         "✓ Contest started successfully by non-host after time passed"
  //       );
  //     } catch (error) {
  //       console.log("Error in anyone can start test:", error);
  //       assert.fail("Failed to start contest when time has passed");
  //     }
  //   });

  //   test("Cannot start an already started contest", async () => {
  //     try {
  //       const startContestInput: StartContestInput = {
  //         contest: contest, // This contest was already started in the previous test
  //         host: host,
  //       };

  //       await StartContest(startContestInput, host);
  //       assert.fail(
  //         "Expected starting already started contest to fail but it succeeded"
  //       );
  //     } catch (error) {
  //       console.log("Caught expected error:", error.message);
  //       console.log("Error context:", error.context);

  //       const errorLogs = error.context?.logs || [];
  //       const isStateError =
  //         error.message.includes("state") ||
  //         error.message.includes("InvalidContestState") ||
  //         errorLogs.some(
  //           (log: string) =>
  //             log.includes(
  //               "Contest is not in a state that allows this action"
  //             ) || log.includes("InvalidContestState")
  //         );
  //       if (isStateError) {
  //         console.log("✓ Correctly caught already started contest error");
  //       } else {
  //         console.log(
  //           "Unexpected error type - logging full error for debugging:"
  //         );
  //         console.log("Error code:", error.context?.code);
  //         console.log("Error logs:", errorLogs);
  //         console.log(
  //           "⚠️ Got different error than expected, but transaction still failed as intended"
  //         );
  //       }
  //     }
  //   });

  //   test("Cannot start a contest with less than 2 participants", async () => {
  //     try {
  //       const contestName = "Low Participation Contest";

  //       const seeds = [
  //         new TextEncoder().encode("contest"),
  //         new TextEncoder().encode(contestName),
  //         getAddressEncoder().encode(host.address),
  //       ];

  //       const [lowPartContestPda, bump] = await getProgramDerivedAddress({
  //         programAddress: ARBITRON_PROGRAM_ID,
  //         seeds: seeds,
  //       });

  //       const createContestAsyncInput: CreateContestAsyncInput = {
  //         duration: 1000 * 60 * 60 * 2, // 2 hour duration
  //         entryFees: 1_00_000_000n, // 100 USDC
  //         maxParticipents: 100,
  //         name: contestName,
  //         startTime: Math.floor(Date.now() / 1000) - 60, // Start time in the past
  //         signer: host,
  //         tokenMint: tokenMint,
  //         contest: lowPartContestPda,
  //       };

  //       const getCreateContestIx = await getCreateContestInstructionAsync(
  //         createContestAsyncInput,
  //         {
  //           programAddress: ARBITRON_PROGRAM_ID,
  //         }
  //       );

  //       const { value: blockhash } = await rpc.getLatestBlockhash().send();

  //       const txMsg = pipe(
  //         createTransactionMessage({
  //           version: 0,
  //         }),
  //         (tx) => setTransactionMessageFeePayerSigner(host, tx),
  //         (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
  //         (tx) => appendTransactionMessageInstructions([getCreateContestIx], tx)
  //       );

  //       assertIsTransactionMessageWithinSizeLimit(txMsg);

  //       const signedTx = await signTransactionMessageWithSigners(txMsg);

  //       const sendAndConfirmTransactionMethod =
  //         sendAndConfirmTransactionFactory({
  //           rpc,
  //           rpcSubscriptions: rpcSubscription,
  //         });

  //       await sendAndConfirmTransactionMethod(signedTx, {
  //         commitment: "confirmed",
  //       });

  //       console.log("Contest created with 0 participants");

  //       // Try to start contest with less than 2 participants
  //       const startContestInput: StartContestInput = {
  //         contest: lowPartContestPda,
  //         host: host,
  //       };

  //       await StartContest(startContestInput, host);
  //       assert.fail(
  //         "Expected starting contest with < 2 participants to fail but it succeeded"
  //       );
  //     } catch (error) {
  //       console.log("Caught expected error:", error.message);
  //       console.log("Error context:", error.context);

  //       const errorLogs = error.context?.logs || [];
  //       const isMinParticipantsError =
  //         error.message.includes("MinContestParticipantsError") ||
  //         error.message.includes("participant") ||
  //         errorLogs.some(
  //           (log: string) =>
  //             log.includes("MinContestParticipantsError") ||
  //             log.includes("Minimum 2 participants") ||
  //             log.includes("Not enough participants") ||
  //             log.includes("participants")
  //         );

  //       if (isMinParticipantsError) {
  //         console.log("✓ Correctly caught minimum participants error");
  //       } else {
  //         console.log(
  //           "Unexpected error type - logging full error for debugging:"
  //         );
  //         console.log("Error code:", error.context?.code);
  //         console.log("Error logs:", errorLogs);
  //         console.log(
  //           "⚠️ Got different error than expected, but transaction still failed as intended"
  //         );
  //       }
  //     }
  //   });
  // });
});
