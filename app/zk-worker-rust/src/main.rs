pub mod  structs;
pub mod errors;
use std::{env, str::FromStr, rc::Rc};

use anchor_client::{solana_sdk::{pubkey::{self, Pubkey}, signature::read_keypair_file, signer::Signer}, Client};
use dotenvy::dotenv;
use solana_client::rpc_client::RpcClient;
use sqlx::postgres::PgPoolOptions;
use errors::*;

use structs::*;

const END_CONTEST_QUEUE: &str = "ended-contests";
const DECIMAL_CONVERSION_FACTOR: u64 = 1_000_000_000;

// Function that convert db data into ZK Input Structs
fn prepare_zk_inputs (
    particpants_data:Vec<ParticipantWithData>,
    final_prices_data:Vec<TokenPrice>,
)->Result<ContestInputs,WorkerError>{
    let participants= particpants_data.into_iter()
        .map(|p_data|{
            let pubkey = Pubkey::from_str(&p_data.user.public_key).map_err(|e| WorkerError::PubkeyParse(e.to_string()) )?;
            let tokens:Vec<Token> = p_data.selected_tokens
                .into_iter()
                .map(|t_data|{
                    let mint = Pubkey::from_str(&t_data.mint)
                        .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?
                        .to_bytes();

                    // convert decimal to u64
                    
                    let entry_price_u64 = t_data.entry_price;

                    Ok(Token{
                        entry_price:entry_price_u64,
                        is_power_token:t_data.is_power_token,
                        mint:mint,
                        quantity:t_data.quantity
                    })
                }).collect()
        })
}   

#[tokio::main]
async fn main()->Result<(),WorkerError> {


    // Converts from `Result<T, E>` to [`Option<T>`].
    // It loads the variables into the environment         
    dotenv().ok();

    let redis_url = env::var("REDIS_URL")?;
    let database_url = env::var("DATABASE_URL")?;
    let rpc_url = env::var("RPC_URL")?;
    let host_keypair_path = env::var("HOST_WALLET_PATH")?;
    let arbitron_program_id_str = env::var("ARBITRON_PROGRM_ID")?;
    let zk_program_image_id_hex = env::var("ZK_PROGRAM_IMAGE_ID")?;
    let specific_prover_str = env::var("SPECIFIC_PROVER_KEY")?;

    // map_err is used to convert from one error to another error type
    let arbitron_program_id = Pubkey::from_str(&arbitron_program_id_str)
        .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?;

    let specific_prover_key = Pubkey::from_str(&specific_prover_str)
        .map_err(|e| WorkerError::PubkeyParse(e.to_string()))?;


    // hex to bytes
    let zk_program_image_id_bytes_vec = hex::decode(&zk_program_image_id_hex)?;

    // we need to convert bytes into something like this [u8;32] , try_into - convert in compaitable types 
    let zk_program_image_id_bytes: [u8; 32] = zk_program_image_id_bytes_vec.try_into()
        .map_err(|_| WorkerError::InvalidData("Invalid Image Id Length".into()))?;

    // This creates the client object that store the connection URL, it doesn't open the connection automatically.
    let redis_client = redis::Client::open(redis_url)?;

    let con = redis_client.get_async_pubsub().await?;

    let db_pool = PgPoolOptions::new()
        .connect(&database_url)
        .await?;

    let owner_keypair = read_keypair_file(&host_keypair_path)
        .map_err(|error| WorkerError::Io(std::io::Error::new(std::io::ErrorKind::Other, error.to_string())))?;

    let owner_pub_key = owner_keypair.pubkey();

    let rpc_client = RpcClient::new(rpc_url.clone());

    let client = Client::new(anchor_client::Cluster::Devnet, Rc::new(owner_keypair));

    Ok(())
}
