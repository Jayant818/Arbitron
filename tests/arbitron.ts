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
  sendAndConfirmDurableNonceTransactionFactory,
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

const RPC_URL = "http://127.0.0.1:8899";
const RPC_SUBSCRIPTION_URL = "ws://127.0.0.1:8900";
const ARBITRON_PROGRAM_ID =
  "ETjik8Bom7xHKv7HHawVM1igFNwJbKyWBZtnLp8jEkgD" as Address;
const PLATFORM_FEE_WALLET = address(
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
);
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
    amount: 2_00_000_000,
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

async function JoinContest({
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
  let host: KeyPairSigner;
  let sudo_host: KeyPairSigner;
  let contest: Address;
  let fee_wallet: Address;
  let participent1: KeyPairSigner;
  let participent1_ata: Address;

  let tokenMint: Address;

  before(async () => {
    if (
      !RPC_URL ||
      !RPC_SUBSCRIPTION_URL ||
      !ARBITRON_PROGRAM_ID ||
    ) {
      throw new Error("Url is missing in the env");
    }

    assertIsAddress(ARBITRON_PROGRAM_ID);

    host = await generateKeyPairSigner();
    sudo_host = await generateKeyPairSigner();
    participent1 = await generateKeyPairSigner();

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
      lamports: lamports(2_000_000_000n),
      recipientAddress: sudo_host.address,
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

    participent1_ata = await createATA_MintToken({
      mint_address: tokenMint,
      mint_authority: host,
      user: participent1,
    });

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

    contest = contestPda;

    const feeWalletSeeds = [];
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

      // Get account info to check its status
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
          console.log("✓ Correctly caught InvalidStartTime error");
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
          console.log("✓ Correctly caught InvalidEntryFees error");
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
          console.log("✓ Correctly caught InvalidDuration error");
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

        const seeds = [
          new TextEncoder().encode("contest"),
          new TextEncoder().encode(contestName),
          getAddressEncoder().encode(sudo_host.address),
        ];

        const [contestPda, bump] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: seeds,
        });

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

        const userInfoSeeds = [
          new TextEncoder().encode("participent"),
          new TextEncoder().encode(contest),
          getAddressEncoder().encode(participent1.address),
        ]

        const [userInfoPda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: userInfoSeeds,
        })

        const userUsdtAtaSeeds = [
          new TextEncoder().encode("participent_usdt_ata"),
          getAddressEncoder().encode(participent1.address),
          getAddressEncoder().encode(tokenMint),
        ]

        const [userUsdtAtaPda] = await getProgramDerivedAddress({
          programAddress: ARBITRON_PROGRAM_ID,
          seeds: userUsdtAtaSeeds,
        })

        const joinContestInput: JoinContestAsyncInput = {
          contest: contest,
          host: host.address,
          participent: participent1,
          tokenMint: tokenMint,
          userAta: participent1_ata,
          platformFeeWallet: PLATFORM_FEE_WALLET,
          participentInfo: userInfoPda,
          participentUsdtAta: userUsdtAtaPda,
        };

        let userAtaAccountInfo = await rpc
          .getAccountInfo(participent1_ata)
          .send();

        if (!userAtaAccountInfo || !userAtaAccountInfo.value) {
          assert.fail("User Ata account is null");
        }

        const userAtaBalanceBefore = userAtaAccountInfo.value.lamports;

        await JoinContest({
          joinContestInput,
          payer: participent1,
        });

        userAtaAccountInfo = await rpc.getAccountInfo(participent1_ata).send();

        if (!userAtaAccountInfo || !userAtaAccountInfo.value) {
          assert.fail("User Ata account is null");
        }

        const userAtaBalanceAfter = userAtaAccountInfo.value.lamports;

        const userInfoAccount = await rpc.getAccountInfo(userInfoPda).send();

        if (!userInfoAccount || !userInfoAccount.value) {
          assert.fail("User info account is null");
        }

        let userInfoAccountData = getParticipentDecoder().decode(
          Buffer.from(userAtaAccountInfo.value.data[0], "base64")
        );

        assert.notEqual(
          userAtaBalanceBefore,
          userAtaBalanceAfter,
          "User Balance not deducted"
        );
        assert.equal(userInfoAccountData.user, participent1.address.toString());

        // Check user ATA Balance before and after
      } catch (error) {
        console.log("Error", error.context);
        assert.fail("participent unable to join the contest");
      }
    });
  });

  describe("Start Contest", () => {
    test("Contest Started Successfully", () => {});
  });
});
