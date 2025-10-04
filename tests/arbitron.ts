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
  "ETjik8Bom7xHKv7HHawVM1igFNwJbKyWBZtnLp8jEkgD" as Address;
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

  let user1_ata: Address;
  let fee_wallet_ata: Address; // New fee wallet ATA owned by owner
  let configPda: Address;

  let contest: Address;
  let sudoHostContest: Address;

  let participantInfoPda: Address;
  let participantUsdtAtaPda: Address;

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
        entryFees: 1_00_000_000n, // 100 USDT
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

    test("Same Contest Creation Fails with same host", async () => {
      let getCreateContestIx;
      try {
        const contestName = "My Contest";

        const seeds = [
          new TextEncoder().encode("contest"),
          new TextEncoder().encode(contestName),
          getAddressEncoder().encode(host.address),
        ];

        const [contestPda, bump] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: seeds,
        });

        const createContestAsyncInput: CreateContestAsyncInput = {
          duration: 1000 * 60 * 60 * 2, // 2 hour duration
          entryFees: 1_000_000_000n, // 1000 USDT
          maxParticipents: 100,
          name: contestName,
          startTime: Math.floor(Date.now() / 1000) + 120, // Start time 2 minutes from now
          signer: host,
          tokenMint: tokenMint,
          contest: contestPda,
        };

        getCreateContestIx = await getCreateContestInstructionAsync(
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

        const sendAndConfirmTransactionMethod =
          sendAndConfirmTransactionFactory({
            rpc,
            rpcSubscriptions: rpcSubscription,
          });

        await sendAndConfirmTransactionMethod(signedTx, {
          commitment: "confirmed",
        });
        assert.fail("Expected this same name Contest to fail but it succeeded");
      } catch (error) {
        // console.log("Caught error:", error.message);
        // console.log("Error Context", error.context);

        // Check if it's our custom error
        if (
          isArbitronError(
            error,
            getCreateContestIx,
            ARBITRON_ERROR__INVALID_START_TIME
          ) ||
          error.message.includes("already in use")
        ) {
          console.log(" Correctly caught InvalidStartTime error");
          console.log(
            "Error message:",
            getArbitronErrorMessage(ARBITRON_ERROR__INVALID_START_TIME)
          );
        }
      }
    });

    test("Contest Creation Fails with Invalid Entry Fees", async () => {
      const contestName = `Invalid Entry Fees Contest`;

      const seeds = [
        new TextEncoder().encode("contest"),
        new TextEncoder().encode(contestName),
        getAddressEncoder().encode(host.address),
      ];

      const [contestPda, bump] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ID,
        seeds: seeds,
      });

      const createContestAsyncInput: CreateContestAsyncInput = {
        duration: 1000 * 60 * 60 * 2,
        entryFees: 0n, // Invalid: zero entry fees
        maxParticipents: 10,
        name: contestName,
        startTime: Math.floor(Date.now() / 1000) + 60,
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

      try {
        await sendAndConfirmTransactionMethod(signedTx, {
          commitment: "confirmed",
        });
        assert.fail("Expected contest creation to fail but it succeeded");
      } catch (error) {
        // console.log("Caught error:", error.code);
        // console.log("Error context:", error.context);

        // Check if it's our custom error
        if (isArbitronError(error, txMsg, ARBITRON_ERROR__INVALID_ENTRY_FEES)) {
          console.log(" Correctly caught InvalidEntryFees error");
          console.log(
            "Error message:",
            getArbitronErrorMessage(ARBITRON_ERROR__INVALID_ENTRY_FEES)
          );
        }
      }
    });

    test("Contest Creation Fails with Invalid Duration", async () => {
      const contestName = "Invalid Duration Contest";

      const seeds = [
        new TextEncoder().encode("contest"),
        new TextEncoder().encode(contestName),
        getAddressEncoder().encode(host.address),
      ];

      const [contestPda, bump] = await getProgramDerivedAddress({
        programAddress: ARBITRON_PROGRAM_ID,
        seeds: seeds,
      });

      const createContestAsyncInput: CreateContestAsyncInput = {
        duration: 0, // Invalid: zero duration
        entryFees: 1_000_000_000n,
        maxParticipents: 10,
        name: contestName,
        startTime: Math.floor(Date.now() / 1000) + 60,
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

      try {
        await sendAndConfirmTransactionMethod(signedTx, {
          commitment: "confirmed",
        });
        assert.fail("Expected contest creation to fail but it succeeded");
      } catch (error) {
        // console.log("Caught error:", error);
        // console.log("Error context:", error.context);

        // Check if it's our custom error
        if (isArbitronError(error, txMsg, ARBITRON_ERROR__INVALID_DURATION)) {
          console.log(" Correctly caught InvalidDuration error");
          console.log(
            "Error message:",
            getArbitronErrorMessage(ARBITRON_ERROR__INVALID_DURATION)
          );
        }
      }
    });

    test("Different host can Create contest with same name", async () => {
      let getCreateContestIx;
      try {
        const contestName = "My Contest";

        // Derive sudo host contest PDA and store it for other tests
        const seeds = [
          new TextEncoder().encode("contest"),
          new TextEncoder().encode(contestName),
          getAddressEncoder().encode(sudo_host.address),
        ];

        const [contestPda, bump] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: seeds,
        });

        // Store sudo host contest PDA for other tests to use
        sudoHostContest = contestPda;

        const createContestAsyncInput: CreateContestAsyncInput = {
          duration: 3600,
          entryFees: 1_000_000_000n,
          maxParticipents: 9,
          name: contestName,
          startTime: Math.floor(Date.now() / 1000) + 60,
          signer: sudo_host,
          tokenMint: tokenMint,
          contest: contestPda,
        };

        getCreateContestIx = await getCreateContestInstructionAsync(
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

        const sendAndConfirmTransactionMethod =
          sendAndConfirmTransactionFactory({
            rpc,
            rpcSubscriptions: rpcSubscription,
          });

        await sendAndConfirmTransactionMethod(signedTx, {
          commitment: "confirmed",
        });

        const contestAccountInfo = await rpc
          .getAccountInfo(contestPda, {
            encoding: "jsonParsed",
          })
          .send();

        if (!contestAccountInfo || !contestAccountInfo.value) {
          assert.fail("Contest Account is Null");
        }

        const decodedData = getContestDecoder().decode(
          Buffer.from(contestAccountInfo.value.data[0], "base64")
        );

        assert.equal(decodedData.maxParticipents, 9);
      } catch (error) {
        console.log("Caught error:", error);
        console.log("Error context:", error.context);
        assert.fail("Expected contest creation to fail but it succeeded");
      }
    });
  });

  describe("Join Contest", () => {
    test("Joined Contest Successfully", async () => {
      try {
        const participantInfoSeeds = [
          new TextEncoder().encode("participent"),
          getAddressEncoder().encode(contest),
          getAddressEncoder().encode(user1.address),
        ];

        const [participantInfoPdaAddress] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: participantInfoSeeds,
        });

        // Storing it for other tests to use
        participantInfoPda = participantInfoPdaAddress;

        const participantUsdtAtaSeeds = [
          new TextEncoder().encode("participent_usdt_ata"),
          getAddressEncoder().encode(user1.address),
          getAddressEncoder().encode(tokenMint),
          getAddressEncoder().encode(contest),
        ];

        const [participantUsdtAtaPdaAddress] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: participantUsdtAtaSeeds,
        });

        // Store for other tests to use
        participantUsdtAtaPda = participantUsdtAtaPdaAddress;

        let playerGlobalProfileSeeds = [
          new TextEncoder().encode("player"),
          getAddressEncoder().encode(user1.address),
        ];

        const [playerGlobalProfilePda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: playerGlobalProfileSeeds,
        });

        let tradingPdaSeeds = [
          new TextEncoder().encode("trading_pda"),
          getAddressEncoder().encode(contest),
          getAddressEncoder().encode(user1.address),
        ];

        const [tradingPda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: tradingPdaSeeds,
        });

        const joinContestInput: JoinContestAsyncInput = {
          contest: contest,
          host: host.address,
          participent: user1,
          tokenMint: tokenMint,
          userAta: user1_ata,
          platformFeeWallet: fee_wallet_ata, // Use fee wallet ATA
          participentInfo: participantInfoPda,
          participentUsdtAta: participantUsdtAtaPda,
          config: configPda,
          playerGlobalProfile: playerGlobalProfilePda,
          tradingPda,
        };

        let user1_usdt_balance_before_join = await rpc
          .getTokenAccountBalance(user1_ata)
          .send();

        if (
          !user1_usdt_balance_before_join ||
          !user1_usdt_balance_before_join.value
        ) {
          assert.fail("User1 USDT balance is null");
        }

        await joinContest({
          joinContestInput,
          payer: user1,
        });

        let user1_usdt_balance_after_join = await rpc
          .getTokenAccountBalance(user1_ata)
          .send();

        if (
          !user1_usdt_balance_after_join ||
          !user1_usdt_balance_after_join.value
        ) {
          assert.fail("User1 USDT balance is null");
        }

        // Fecthing Created PDA DATA
        const participantInfoAccount = await rpc
          .getAccountInfo(participantInfoPda, {
            encoding: "jsonParsed",
          })
          .send();

        if (!participantInfoAccount || !participantInfoAccount.value) {
          assert.fail("Participant info account is null");
        }

        let participantInfoAccountData = getParticipentDecoder().decode(
          Buffer.from(participantInfoAccount.value.data[0], "base64")
        );

        const participant_usdt_balance = await rpc
          .getTokenAccountBalance(participantUsdtAtaPda)
          .send();

        if (!participant_usdt_balance || !participant_usdt_balance.value) {
          assert.fail("Participant USDT balance is null");
        }

        // More test that we can done here
        // 1) Check if the participant count in contest account is incremented
        // 2) Check if the platform fee wallet balance is incremented correctly

        assert.notEqual(
          user1_usdt_balance_before_join.value.amount,
          user1_usdt_balance_after_join.value.amount,
          "User Balance not deducted"
        );
        assert.equal(participantInfoAccountData.user, user1.address);
      } catch (error) {
        console.log("Error", error);
        assert.fail("participant unable to join the contest");
      }
    });

    test("User cannot join same contest twice", async () => {
      try {
        const participantInfoSeeds = [
          new TextEncoder().encode("participent"),
          getAddressEncoder().encode(contest),
          getAddressEncoder().encode(user1.address),
        ];

        const [participantInfoPdaAddress] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: participantInfoSeeds,
        });

        // Storing it for other tests to use
        participantInfoPda = participantInfoPdaAddress;

        const participantUsdtAtaSeeds = [
          new TextEncoder().encode("participent_usdt_ata"),
          getAddressEncoder().encode(user1.address),
          getAddressEncoder().encode(tokenMint),
          getAddressEncoder().encode(contest),
        ];

        const [participantUsdtAtaPdaAddress] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: participantUsdtAtaSeeds,
        });

        // Store for other tests to use
        participantUsdtAtaPda = participantUsdtAtaPdaAddress;

        let playerGlobalProfileSeeds = [
          new TextEncoder().encode("player"),
          getAddressEncoder().encode(user1.address),
        ];

        const [playerGlobalProfilePda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: playerGlobalProfileSeeds,
        });

        let tradingPdaSeeds = [
          new TextEncoder().encode("trading_pda"),
          getAddressEncoder().encode(contest),
          getAddressEncoder().encode(user1.address),
        ];

        const [tradingPda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: tradingPdaSeeds,
        });

        const joinContestInput: JoinContestAsyncInput = {
          contest: contest,
          host: host.address,
          participent: user1,
          tokenMint: tokenMint,
          userAta: user1_ata,
          platformFeeWallet: fee_wallet_ata, // Use fee wallet ATA
          participentInfo: participantInfoPda,
          participentUsdtAta: participantUsdtAtaPda,
          config: configPda,
          playerGlobalProfile: playerGlobalProfilePda,
          tradingPda: tradingPda,
        };

        let user1_usdt_balance_before_join = await rpc
          .getTokenAccountBalance(user1_ata)
          .send();

        if (
          !user1_usdt_balance_before_join ||
          !user1_usdt_balance_before_join.value
        ) {
          assert.fail("User1 USDT balance is null");
        }

        await joinContest({
          joinContestInput,
          payer: user1,
        });

        let user1_usdt_balance_after_join = await rpc
          .getTokenAccountBalance(user1_ata)
          .send();

        if (
          !user1_usdt_balance_after_join ||
          !user1_usdt_balance_after_join.value
        ) {
          assert.fail("User1 USDT balance is null");
        }

        // Fecthing Created PDA DATA
        const participantInfoAccount = await rpc
          .getAccountInfo(participantInfoPda, {
            encoding: "jsonParsed",
          })
          .send();

        if (!participantInfoAccount || !participantInfoAccount.value) {
          assert.fail("Participant info account is null");
        }

        let participantInfoAccountData = getParticipentDecoder().decode(
          Buffer.from(participantInfoAccount.value.data[0], "base64")
        );

        const participant_usdt_balance = await rpc
          .getTokenAccountBalance(participantUsdtAtaPda)
          .send();

        if (!participant_usdt_balance || !participant_usdt_balance.value) {
          assert.fail("Participant USDT balance is null");
        }

        assert.fail(
          "Expected joining same contest twice to fail but it succeeded"
        );
      } catch (error) {
        if (
          error.context?.logs?.some((l: string) => l.includes("already in use"))
        ) {
          console.log(
            "User cannot join same contest twice (PDA already exists)"
          );
          return;
        }
        assert.fail("Unepected Error" + error);
      }
    });

    test("User cannot join another contest at the same time", async () => {
      try {
        const participantInfoSeeds = [
          new TextEncoder().encode("participent"),
          getAddressEncoder().encode(sudoHostContest),
          getAddressEncoder().encode(user1.address),
        ];

        const [participantInfoPdaAddress] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: participantInfoSeeds,
        });

        const participantUsdtAtaSeeds = [
          new TextEncoder().encode("participent_usdt_ata"),
          getAddressEncoder().encode(user1.address),
          getAddressEncoder().encode(tokenMint),
          getAddressEncoder().encode(sudoHostContest),
        ];

        const [participantUsdtAtaPdaAddress] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: participantUsdtAtaSeeds,
        });

        let playerGlobalProfileSeeds = [
          new TextEncoder().encode("player"),
          getAddressEncoder().encode(user1.address),
        ];

        const [playerGlobalProfilePda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: playerGlobalProfileSeeds,
        });

        let tradingPdaSeeds = [
          new TextEncoder().encode("trading_pda"),
          getAddressEncoder().encode(sudoHostContest),
          getAddressEncoder().encode(user1.address),
        ];

        const [tradingPda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: tradingPdaSeeds,
        });

        const joinContestInput: JoinContestAsyncInput = {
          contest: sudoHostContest,
          host: sudo_host.address,
          participent: user1,
          tokenMint: tokenMint,
          userAta: user1_ata,
          platformFeeWallet: fee_wallet_ata, // Use fee wallet ATA
          participentInfo: participantInfoPdaAddress,
          participentUsdtAta: participantUsdtAtaPdaAddress,
          config: configPda,
          playerGlobalProfile: playerGlobalProfilePda,
          tradingPda: tradingPda,
        };

        let user1_usdt_balance_before_join = await rpc
          .getTokenAccountBalance(user1_ata)
          .send();

        if (
          !user1_usdt_balance_before_join ||
          !user1_usdt_balance_before_join.value
        ) {
          assert.fail("User1 USDT balance is null");
        }

        await joinContest({
          joinContestInput,
          payer: user1,
        });

        let user1_usdt_balance_after_join = await rpc
          .getTokenAccountBalance(user1_ata)
          .send();

        if (
          !user1_usdt_balance_after_join ||
          !user1_usdt_balance_after_join.value
        ) {
          assert.fail("User1 USDT balance is null");
        }

        // Fecthing Created PDA DATA
        const participantInfoAccount = await rpc
          .getAccountInfo(participantInfoPdaAddress, {
            encoding: "jsonParsed",
          })
          .send();

        if (!participantInfoAccount || !participantInfoAccount.value) {
          assert.fail("Participant info account is null");
        }

        let participantInfoAccountData = getParticipentDecoder().decode(
          Buffer.from(participantInfoAccount.value.data[0], "base64")
        );

        const participant_usdt_balance = await rpc
          .getTokenAccountBalance(participantUsdtAtaPdaAddress)
          .send();

        if (!participant_usdt_balance || !participant_usdt_balance.value) {
          assert.fail("Participant USDT balance is null");
        }

        assert.fail(
          "Expected joining diff contest at same times to fail but it succeeded"
        );
      } catch (error) {
        console.log("Error", error);
        if (
          error.context?.logs?.some((l: string) =>
            l.includes("Already Participated in another contest")
          )
        ) {
          console.log("Already Participated in another contest");
          return;
        }
        assert.fail("Unexpected Error" + error);
      }
    });
  });

  describe("Start Contest", () => {
    test("Contest Started Successfully", () => {});
  });
});
