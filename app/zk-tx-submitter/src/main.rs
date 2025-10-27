pub mod structs;
pub mod errors;
use std::{env, str::FromStr};

// Solana/Anchor specific imports
use solana_sdk::{
    pubkey::Pubkey,
    signature::{read_keypair_file, Signer, Signature},
    transaction::Transaction,
    instruction::{Instruction, AccountMeta},
};
use solana_client::rpc_client::RpcClient;

// Bonsol SDK for building instructions
use bonsol_sdk::instructions::{CallbackConfig, InputRef, ExecutionConfig};

// Standard library and utility crates
use dotenvy::dotenv;
use errors::*;
use structs::{ContestInputs, Participant, Token, FinalPrice};
use sha2::{Sha256, Digest};
use hex;
use redis::AsyncCommands;

// Discriminator for set_execution_account from your IDL
const SET_EXECUTION_ACCOUNT_DISC: [u8; 8] = [15, 98, 193, 203, 135, 237, 20, 157];
// Discriminator for receive_end_contest_proof from your IDL
const RECEIVE_END_CONTEST_PROOF_DISC: [u8; 8] = [59, 177, 66, 179, 71, 128, 115, 196];

// --- QUEUE NAME ---
const ZK_INPUTS_QUEUE: &str = "zk-inputs-queue";

// Get the correct Devnet/Mainnet Program ID from the Bonsol team/docs.
const BONSOL_PROGRAM_ID_STR: &str = "BoNsHRcyLLNdtnoDf8hiCNZpyehMC4FDMxs6NTxFi3ew";

// --- Structs for parsing JSON from zk-data-prep ---
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
    let participants = job.participants.iter().map(|p_data| {
        let user_pubkey_bytes = Pubkey::from_str(&p_data.user_public_key)?
            .to_bytes();

        let tokens: Vec<Token> = p_data.selected_tokens.iter().map(|t_data| {
            let mint_bytes = Pubkey::from_str(&t_data.mint)?
                .to_bytes();

            let entry_price_u64 = u64::from_str(&t_data.entry_price)?;

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
        let mint_bytes = Pubkey::from_str(&fp_data.mint)?
            .to_bytes();

        let price_u64 = u64::from_str(&fp_data.price)?;

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

    // --- Load Environment Variables with better error messages ---
    let redis_url = env::var("REDIS_URL")
        .map_err(|_| WorkerError::Config("REDIS_URL not found in environment".into()))?;
    let rpc_url = env::var("RPC_URL")
        .map_err(|_| WorkerError::Config("RPC_URL not found in environment".into()))?;
    let host_keypair_path = env::var("HOST_WALLET_PATH")
        .map_err(|_| WorkerError::Config("HOST_WALLET_PATH not found in environment".into()))?;
    let arbitron_program_id_str = env::var("ARBITRON_PROGRM_ID")
        .map_err(|_| WorkerError::Config("ARBITRON_PROGRM_ID not found in environment".into()))?;
    let zk_program_image_id_hex = env::var("ZK_PROGRAM_IMAGE_ID")
        .map_err(|_| WorkerError::Config("ZK_PROGRAM_IMAGE_ID not found in environment".into()))?;
    let specific_prover_str = env::var("SPECIFIC_PROVER_KEY")
        .map_err(|_| WorkerError::Config("SPECIFIC_PROVER_KEY not found in environment".into()))?;

    // --- Parse Pubkeys and Image ID ---
    let arbitron_program_id = Pubkey::from_str(&arbitron_program_id_str)?;
    let specific_prover_key = Pubkey::from_str(&specific_prover_str)?;
    let bonsol_program_id = Pubkey::from_str(BONSOL_PROGRAM_ID_STR)?;

    let zk_program_image_id_bytes_vec = hex::decode(&zk_program_image_id_hex)?;
    let zk_program_image_id_bytes: [u8; 32] = zk_program_image_id_bytes_vec.try_into()
        .map_err(|_| WorkerError::InvalidData("Invalid ZK Program Image ID Length".into()))?;

    // --- Setup Clients ---
    let redis_client = redis::Client::open(redis_url)?;
    let mut redis_con = redis_client.get_multiplexed_async_connection().await?;
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
        let popped: (String, String) = redis_con.brpop(ZK_INPUTS_QUEUE, 0.0).await?;
        let job_str = popped.1;
        println!("[Worker]: Received ZK job ({} bytes). Processing...", job_str.len());

        // Use a closure to handle errors gracefully within the loop
        match (|| -> Result<Signature, WorkerError> { // Return Signature on success
            // 1. Parse Job JSON
            let job: JsonJob = serde_json::from_str(&job_str)
                .map_err(|e| WorkerError::JsonParse(e))?;
            println!("[Worker]: Parsed Job for Contest PDA: {}", job.contest_address);

            // 2. Build ZK Input Structs & Serialize with Bincode (serde-compatible)
            let contest_inputs = build_zk_inputs(&job)?;
            
            // Log the structured input before serialization
            println!("\n=== ZK INPUT DATA (Before Serialization) ===");
            println!("Contest Inputs Structure:");
            println!("  Participants count: {}", contest_inputs.participants.len());
            for (i, participant) in contest_inputs.participants.iter().enumerate() {
                println!("  Participant #{}: user={}", i + 1, hex::encode(&participant.user));
                println!("    Tokens count: {}", participant.tokens.len());
                for (j, token) in participant.tokens.iter().enumerate() {
                    println!("      Token #{}: mint={}, is_power={}, qty={}, entry_price={}", 
                        j + 1, hex::encode(&token.mint), token.is_power_token, token.quantity, token.entry_price);
                }
            }
            println!("  Final Prices count: {}", contest_inputs.final_price.len());
            for (i, fp) in contest_inputs.final_price.iter().enumerate() {
                println!("    FinalPrice #{}: mint={}, price={}", 
                    i + 1, hex::encode(&fp.mint), fp.price);
            }
            
            // Serialize with bincode v1.3 (serde-compatible)
            let serialized_inputs = bincode::serialize(&contest_inputs)
                .map_err(|e| WorkerError::Serialization(e.to_string()))?;
            
            println!("\n=== SERIALIZED INPUT ===");
            println!("Serialized ContestInputs: {} bytes", serialized_inputs.len());
            println!("Hex representation: {}", hex::encode(&serialized_inputs));
            println!("First 64 bytes (hex): {}", hex::encode(&serialized_inputs[..serialized_inputs.len().min(64)]));
            println!("=====================\n");

            // 3. Create execution ID and derive execution PDA using Bonsol's logic
            // Use only the first 16 bytes (32 hex chars) of the hash for execution_id
            let input_id_hash: [u8; 32] = Sha256::digest(&serialized_inputs).into();
            let execution_id = hex::encode(&input_id_hash[..16]); // Use first 16 bytes = 32 hex chars
            let contest_pda = Pubkey::from_str(&job.contest_address)?;
            
            // Derive execution PDA using Bonsol's derivation logic
            let (execution_pda, _exec_bump) = Pubkey::find_program_address(
                &[
                    b"execution",
                    owner_pub_key.as_ref(),      // Requester's pubkey (32 bytes)
                    execution_id.as_bytes(),     // Execution ID as string bytes (32 bytes)
                ],
                &bonsol_program_id,              // Bonsol Program ID
            );
            println!("[Worker]: Derived Execution PDA: {} (exec_id: {})", execution_pda, execution_id);

            // --- 4. Build Instructions ---

            // --- Ix 1: set_execution_account (Your Program) ---
            let mut set_exec_data = SET_EXECUTION_ACCOUNT_DISC.to_vec();
            set_exec_data.extend_from_slice(&execution_pda.to_bytes());
            
            let set_exec_ix = Instruction {
                program_id: arbitron_program_id,
                accounts: vec![
                    AccountMeta::new(owner_pub_key, true), // host (must sign)
                    AccountMeta::new(contest_pda, false), // contest (mutable)
                ],
                data: set_exec_data,
            };
            println!("[Worker]: Built set_execution_account instruction.");

            // --- Ix 2: executeV1 (Bonsol Program) ---
            let callback_config = CallbackConfig {
                program_id: arbitron_program_id, // Your program gets called back
                instruction_prefix: RECEIVE_END_CONTEST_PROOF_DISC.to_vec(), // Correct discriminator!
                extra_accounts: vec![
                    // Accounts your receive_end_contest_proof needs (excluding execution_request)
                    AccountMeta::new(contest_pda, false), // Contest PDA (mutable in your callback)
                    // Add any other accounts needed by receive_end_contest_proof here
                ],
            };

            // Convert image ID to hex string
            let image_id_hex = hex::encode(zk_program_image_id_bytes);
            
            // Build the Bonsol instruction with correct signature
            let execution_config = ExecutionConfig {
                verify_input_hash: true,
                input_hash: None,
                forward_output: true,
            };

            // Get current slot from RPC 
            let slot = rpc_client.get_slot()?;

            println!("\n=== ABOUT TO BUILD BONSOL INSTRUCTION ===");
            println!("Requester: {}", owner_pub_key);
            println!("Payer: {}", owner_pub_key);
            println!("Image ID (hex): {}", image_id_hex);
            println!("Execution ID: {}", execution_id);
            println!("Input size: {} bytes", serialized_inputs.len());
            println!("Tip: 10000");
            println!("Current slot: {}", slot);
            println!("Expiry: {}", slot + 100_000_000);
            println!("Callback program: {}", arbitron_program_id);
            println!("Target prover: {}", specific_prover_key);
            println!("==========================================\n");
            
            let bonsol_ix = bonsol_sdk::instructions::execute_v1(
                &owner_pub_key,                              // Requester
                &owner_pub_key,                              // Payer
                &image_id_hex,                               // Image ID as hex string (&str)
                &execution_id,                               // Execution ID
                vec![InputRef::public(&serialized_inputs)],  // Inputs
                10000,                                       // Tip
                slot + 100_000_000,                          // Expiry
                execution_config,                            // Execution Config
                Some(callback_config),                       // Callback Config
                None,                                        // Input Hash (None because verify_input_hash is true)
                vec![specific_prover_key],                   // Allowed Provers
            )?;
            
            println!("\n=== BONSOL INSTRUCTION DETAILS ===");
            println!("Image ID (hex): {}", image_id_hex);
            println!("Execution ID: {}", execution_id);
            println!("Execution PDA: {}", execution_pda);
            println!("Input Type: InputRef::public");
            println!("Input Size: {} bytes", serialized_inputs.len());
            println!("Tip: 10000");
            println!("Expiry: slot {} + 100_000_000", slot);
            println!("Execution Config:");
            println!("  - verify_input_hash: true");
            println!("  - forward_output: true");
            println!("Callback Program ID: {}", arbitron_program_id);
            println!("Callback Discriminator: {:?}", RECEIVE_END_CONTEST_PROOF_DISC);
            println!("Target Prover: {}", specific_prover_key);
            println!("==================================\n");
            
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
   
}