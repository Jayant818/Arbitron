pub mod structs;
pub mod errors;
use std::{env, str::FromStr, rc::Rc}; // rc::Rc might not be needed if not using anchor_client::Client

// Solana/Anchor specific imports
use anchor_client::solana_sdk::{
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer},
    transaction::Transaction,
    instruction::{Instruction, AccountMeta},
    system_program // Often needed implicitly or explicitly
};
use solana_client::rpc_client::RpcClient; // For sending transactions

// Bonsol SDK for building instructions
use bonsol_sdk::{instruction as bonsol_instruction, CallbackConfig, Input};

// Standard library and utility crates
use dotenvy::dotenv;
use errors::*;
use structs::*; // Your ZK structs (ContestInputs, Participant, Token, FinalPrice)
use sha2::{Sha256, Digest};
use anchor_lang::InstructionData; // For instruction data serialization (.data())
use hex; // For decoding hex strings and encoding bytes
use bincode; // For serializing ZK inputs
use serde_json; // For deserializing JSON from Redis
use redis::AsyncCommands; // For Redis commands

// Discriminator for set_execution_account from your IDL
const SET_EXECUTION_ACCOUNT_DISC: [u8; 8] = [15, 98, 193, 203, 135, 237, 20, 157]; // <-- UPDATED
// Discriminator for receive_end_contest_proof from your IDL
const RECEIVE_END_CONTEST_PROOF_DISC: [u8; 8] = [59, 177, 66, 179, 71, 128, 115, 196]; // <-- UPDATED


// --- QUEUE NAME ---
const ZK_INPUTS_QUEUE: &str = "zk-inputs-queue";

// Get the correct Devnet/Mainnet Program ID from the Bonsol team/docs.
const BONSOL_PROGRAM_ID_STR: &str = "BoNsHRcyLLNdtnoDf8hiCNZpyehMC4FDMxs6NTxFi3ew";


// --- Structs for parsing JSON from zk-data-prep (Keep as is) ---
#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct JsonJob {
    contest_address: String,
    participants: Vec<JsonParticipant>,
    final_prices: Vec<JsonFinalPrice>,
}
#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct JsonParticipant {
    user_public_key: String,
    selected_tokens: Vec<JsonToken>,
}
#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct JsonToken {
    mint: String,
    is_power_token: bool,
    quantity: u8,
    entry_price: String, // Will parse from string
}
#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct JsonFinalPrice {
    mint: String,
    price: String, // Will parse from string
}

/// Converts the JSON payload into the Bincode-serializable ZK Input Structs (Keep as is)
/// Ensure structs.rs Token, Participant, FinalPrice, ContestInputs have #[derive(Debug)]
fn build_zk_inputs(job: &JsonJob) -> Result<ContestInputs, WorkerError> {
    // ... (implementation as provided before) ...
     let participants = job.participants.iter().map(|p_data| {
        let user_pubkey_bytes = Pubkey::from_str(&p_data.user_public_key)
            .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?
            .to_bytes();

        let tokens: Vec<Token> = p_data.selected_tokens.iter().map(|t_data| {
            let mint_bytes = Pubkey::from_str(&t_data.mint)
                .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?
                .to_bytes();

            let entry_price_u64 = u64::from_str(&t_data.entry_price)
                .map_err(|e| WorkerError::InvalidData(format!("Failed to parse entry_price: {}", e)))?;

            Ok(Token {
                mint: mint_bytes,
                is_power_token: t_data.is_power_token,
                quantity: t_data.quantity,
                entry_price: entry_price_u64,
            })
        }).collect::<Result<Vec<Token>, WorkerError>>()?;

        Ok(Participant {
            user: user_pubkey_bytes,
            tokens: tokens,
        })
    }).collect::<Result<Vec<Participant>, WorkerError>>()?;

    let final_price = job.final_prices.iter().map(|fp_data| {
        let mint_bytes = Pubkey::from_str(&fp_data.mint)
            .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?
            .to_bytes();

        let price_u64 = u64::from_str(&fp_data.price)
            .map_err(|e| WorkerError::InvalidData(format!("Failed to parse final price: {}", e)))?;

        Ok(FinalPrice {
            mint: mint_bytes,
            price: price_u64,
        })
    }).collect::<Result<Vec<FinalPrice>, WorkerError>>()?;

    Ok(ContestInputs {
        participants,
        final_price,
    })
}

#[tokio::main]
async fn main() -> Result<(), WorkerError> {
    dotenv().ok(); // Load .env file

    // --- Load Environment Variables ---
    let redis_url = env::var("REDIS_URL")?;
    let rpc_url = env::var("RPC_URL")?;
    let host_keypair_path = env::var("HOST_WALLET_PATH")?; // Path to the wallet paying fees & signing
    let arbitron_program_id_str = env::var("ARBITRON_PROGRM_ID")?; // Your Anchor program ID
    let zk_program_image_id_hex = env::var("ZK_PROGRAM_IMAGE_ID")?; // Image ID from manifest.json
    let specific_prover_str = env::var("SPECIFIC_PROVER_KEY")?; // The specific prover's Pubkey

    // --- Parse Pubkeys and Image ID ---
    let arbitron_program_id = Pubkey::from_str(&arbitron_program_id_str)?;
    let specific_prover_key = Pubkey::from_str(&specific_prover_str)?;
    let bonsol_program_id = Pubkey::from_str(BONSOL_PROGRAM_ID_STR)?;

    let zk_program_image_id_bytes_vec = hex::decode(&zk_program_image_id_hex)?;
    let zk_program_image_id_bytes: [u8; 32] = zk_program_image_id_bytes_vec.try_into()
        .map_err(|_| WorkerError::InvalidData("Invalid ZK Program Image ID Length".into()))?;

    // --- Setup Clients ---
    let mut redis_con = redis::Client::open(redis_url)?.get_async_connection().await?;
    let owner_keypair = read_keypair_file(&host_keypair_path)
        .map_err(|e| WorkerError::InvalidData(format!("Failed to read keypair file: {}", e)))?;
    let owner_pub_key = owner_keypair.pubkey();
    let rpc_client = RpcClient::new(rpc_url.clone());

    println!("[Worker]: zk-tx-submitter worker started for Arbitron Program ID: {}", arbitron_program_id);
    println!("[Worker]: Using host wallet: {}", owner_pub_key);
    println!("[Worker]: Targeting prover: {}", specific_prover_key);
    println!("[Worker]: Using ZK Image ID (hex): {}", zk_program_image_id_hex);
    println!("[Worker]: Interacting with Bonsol Program ID: {}", bonsol_program_id);

    // --- Main Loop ---
    loop {
        println!("\n[Worker]: Waiting for next job from queue '{}'...", ZK_INPUTS_QUEUE);
        // Block until a job is popped from Redis
        let popped: (String, String) = redis_con.brpop(ZK_INPUTS_QUEUE, 0).await?;
        let job_str = popped.1;
        println!("[Worker]: Received ZK job ({} bytes). Processing...", job_str.len());

        // Use a closure to handle errors gracefully within the loop
        match (|| -> Result<solana_sdk::signature::Signature, WorkerError> { // Return Signature on success
            // 1. Parse Job JSON
            let job: JsonJob = serde_json::from_str(&job_str)?;
            println!("[Worker]: Parsed Job for Contest PDA: {}", job.contest_address);

            // 2. Build ZK Input Structs & Serialize with Bincode
            let contest_inputs = build_zk_inputs(&job)?;
            let serialized_inputs = bincode::serialize(&contest_inputs)?;
            println!("[Worker]: Serialized ContestInputs: {} bytes", serialized_inputs.len());

            // 3. Derive PDAs
            let input_id_hash = *Sha256::digest(&serialized_inputs).as_ref(); // Calculate hash for PDA seed
            let contest_pda = Pubkey::from_str(&job.contest_address)?;
            let (execution_pda, _exec_bump) = Pubkey::find_program_address(
                &[
                    b"execution",
                    arbitron_program_id.as_ref(), // Your program ID
                    &zk_program_image_id_bytes,   // ZK Image ID
                    &input_id_hash,               // Hash of serialized inputs
                ],
                &bonsol_program_id,             // Bonsol Program ID
            );
            println!("[Worker]: Derived Execution PDA: {}", execution_pda);

            // --- 4. Build Instructions ---

            // --- Ix 1: set_execution_account (Your Program) ---
            let set_exec_ix = Instruction {
                program_id: arbitron_program_id,
                accounts: vec![
                    AccountMeta::new(owner_pub_key, true), // host (must sign)
                    AccountMeta::new(contest_pda, false), // contest (mutable)
                ],
                data: (
                    SET_EXECUTION_ACCOUNT_DISC, // Make sure this is correct!
                    execution_pda               // Argument: the derived execution PDA
                ).data(), // Anchor helper to serialize instruction data
            };
            println!("[Worker]: Built set_execution_account instruction.");

            // --- Ix 2: executeV1 (Bonsol Program) ---
            let callback = CallbackConfig {
                program_id: arbitron_program_id, // Your program gets called back
                instruction_prefix: RECEIVE_END_CONTEST_PROOF_DISC.to_vec(), // Correct discriminator!
                extra_accounts: vec![
                    // Accounts your receive_end_contest_proof needs (excluding execution_request)
                    AccountMeta::new(contest_pda, false), // Contest PDA (mutable in your callback)
                    // Add any other accounts needed by receive_end_contest_proof here
                ],
            };

            // Build the basic Bonsol instruction
            let mut bonsol_ix = bonsol_instruction::executeV1(
                execution_pda,              // Execution PDA derived above
                bonsol_program_id,          // Bonsol Program ID
                owner_pub_key,              // Payer (your host wallet)
                zk_program_image_id_bytes,  // Your ZK program's Image ID
                vec![Input::PublicData(serialized_inputs)], // Serialized data wrapped in Input enum
                callback,                   // Callback config defined above
                0,                          // Tip (optional)
                None                        // Expiry (optional, None means use default)
            );

            // Add the specific prover key to the instruction's accounts list
            bonsol_ix.accounts.push(AccountMeta::new_readonly(specific_prover_key, false));
            println!("[Worker]: Built Bonsol executeV1 instruction targeting specific prover.");

            // --- 5. Create and Send Transaction ---
            let latest_blockhash = rpc_client.get_latest_blockhash()?;
            let transaction = Transaction::new_signed_with_payer(
                &[set_exec_ix, bonsol_ix], // Include both instructions in order
                Some(&owner_pub_key),      // Payer
                &[&owner_keypair],         // Signers (just the host wallet)
                latest_blockhash,
            );
            println!("[Worker]: Transaction created. Sending and confirming...");

            // Send and confirm
            let signature = rpc_client.send_and_confirm_transaction(&transaction)?;

            Ok(signature) // Return signature on success

        })() { // End of error-handling closure
            Ok(signature) => {
                println!("[Worker]: Successfully processed job. Transaction Signature: {}", signature);
            },
            Err(e) => {
                println!("[Worker]: Failed to process job: {:?}", e);
                // Consider adding more robust error handling:
                // - Requeue job?
                // - Send to dead-letter queue?
                // - Log details for debugging.
            }
        }
    }
    // Loop never exits in this structure, but Ok(()) can be returned if loop condition changes
    // Ok(())
}