pub mod errors;
pub mod structs;


use std::{env, str::FromStr, rc::Rc};
use anchor_client::{solana_sdk::{
    pubkey::Pubkey, 
    signature::{read_keypair_file, Signer}, 
    transaction::Transaction, 
    instruction::{Instruction, AccountMeta}, 
    system_program
}, Client, Cluster};
use bonsol_sdk::{instruction as bonsol_instruction, CallbackConfig}; // Import Bonsol SDK components
use dotenvy::dotenv;
use solana_client::rpc_client::RpcClient;
use sqlx::postgres::PgPoolOptions;
use errors::*;
use structs::*; // Your ZK structs (ContestInputs, Participant, Token, FinalPrice)
use sha2::{Sha256, Digest};
use anchor_lang::InstructionData;
use serde::{Deserialize};
use bincode::config;

const ZK_INPUTS_QUEUE: &str = "zk-inputs-queue";
const BONSOL_PROGRAM_ID_STR: &str = "bonsol6EaVdM3eS2sYF16o8SgNqN1nKk1soBEkeyKEPC";

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct JsonPayload {
    contest_address: String,
    participants: Vec<JsonParticipant>,
    final_prices: Vec<JsonFinalPrice>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct JsonParticipant {
    user_public_key: String,
    selected_tokens: Vec<JsonToken>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct JsonToken {
    mint: String,
    is_power_token: bool,
    quantity: u8,
    entry_price: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct JsonFinalPrice {
    mint: String,
    price: String,
}

// converts JSON Data into Bincode-serializable ZK Input Struct 
// bincode - binary serialization format for rust, it allows to convert rust data structure into compact binary bytes, It is used in ZK-projects
fn build_zk_input(json_payload: JsonPayload) -> Result<ContestInputs, WorkerError> {
    let participants = json_payload
        .participants
        .iter()
        .map(|participant| {
            let user_pubkey_bytes = Pubkey::from_str(&participant.user_public_key)
                .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?
                .to_bytes();

            let tokens = participant
                .selected_tokens
                .iter()
                .map(|t_data| {
                    let mint_bytes = Pubkey::from_str(&t_data.mint)
                        .map_err(|err| WorkerError::PubkeyParse(err.to_string()))?
                        .to_bytes();

                    let entry_price = u64::from_str(&t_data.entry_price)
                        .map_err(|err| WorkerError::InvalidData(err.to_string()))?;

                    Ok(Token {
                        mint: mint_bytes,
                        entry_price,
                        is_power_token: t_data.is_power_token,
                        quantity: t_data.quantity,
                    })
                })
                .collect::<Result<Vec<Token>, WorkerError>>()?;

            Ok(Participant {
                tokens,
                user: user_pubkey_bytes,
            })
        })
        .collect::<Result<Vec<Participant>, WorkerError>>()?;

    let final_price = json_payload
        .final_prices
        .iter()
        .map(|fp_data| {
            let mint_bytes = Pubkey::from_str(&fp_data.mint)
                .map_err(|err| WorkerError::PubkeyParse(err.to_string()))?
                .to_bytes();

            let price_u64 = u64::from_str(&fp_data.price)
                .map_err(|err| WorkerError::InvalidData(err.to_string()))?;

            Ok(FinalPrice {
                mint: mint_bytes,
                price: price_u64,
            })
        })
        .collect::<Result<Vec<FinalPrice>, WorkerError>>()?;

    Ok(ContestInputs {
        participants,
        final_price,
    })
}

#[tokio::main]
async fn main() -> Result<(), WorkerError> {
    dotenv().ok();

    let redis_url = env::var("REDIS_URL")?;
    let rpc_url = env::var("RPC_URL")?;
    let host_keypair_path = env::var("HOST_WALLET_PATH")?;
    let arbitron_program_id_str = env::var("ARBITRON_PROGRAM_ID")?;
    let zk_program_image_id_hex = env::var("ZK_PROGRAM_IMAGE_ID")?;
    let specific_prover_str = env::var("SPECIFIC_PROVER_KEY")?;

    let arbitron_program_id = Pubkey::from_str(&arbitron_program_id_str)
        .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?;
    let specific_prover_key = Pubkey::from_str(&specific_prover_str)
        .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?;
    let bonsol_program_id = Pubkey::from_str(BONSOL_PROGRAM_ID_STR)
        .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?;

    let zk_program_image_id_bytes_vec = hex::decode(&zk_program_image_id_hex)?;
    let zk_program_image_id_bytes: [u8; 32] = zk_program_image_id_bytes_vec
        .try_into()
        .map_err(|_| WorkerError::InvalidData("Invalid Image Id Length".into()))?;

    let mut redis_con = redis::Client::open(redis_url)?.get_multiplexed_async_connection().await?;

    let owner_keypair = read_keypair_file(&host_keypair_path)
        .map_err(|error| WorkerError::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            error.to_string(),
        )))?;

    let rpc_client = RpcClient::new(rpc_url.clone());

    println!("[Worker]: zk-tx-submitter worker started (Data Verification Mode)...");

    loop {
        let data: Result<(String, String), _> = redis::cmd("BRPOP")
            .arg(ZK_INPUTS_QUEUE)
            .arg(0)
            .query_async(&mut redis_con)
            .await;

        let json_payload = match data {
            Ok((_queue, job_data)) => {
                println!("[Worker]: Received job string from queue: {} bytes", job_data.len());
                job_data
            }
            Err(e) => {
                eprintln!("[Worker]: Error popping job from Redis: {:?}", e);
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                continue;
            }
        };

        if let Err(e) = process_job(json_payload).await {
            eprintln!("[Worker]: Error processing job: {:?}", e);
        }
    }
}

async fn process_job(json_payload: String) -> Result<(), WorkerError> {
    println!("[Worker]: Attempting to parse JSON...");
    let json_struct: JsonPayload = serde_json::from_str(&json_payload)?;
    println!("[Worker]: Successfully parsed JSON:");
    println!("{:#?}", json_struct);

    let contest_inputs = build_zk_input(json_struct)?;
    println!("{:#?}", contest_inputs);

    println!("\n[Worker]: Attempting to serialize structs with bincode...");
    let config = config::standard();
    let serialized_inputs = bincode::serde::encode_to_vec(&contest_inputs, config)?;
    println!(
        "[Worker]: Successfully serialized inputs. Size: {} bytes",
        serialized_inputs.len()
    );

    println!("Serialized (hex): {}", hex::encode(&serialized_inputs));

    Ok(())
}