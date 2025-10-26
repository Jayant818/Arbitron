// this crate allow to create custom error enums 
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WorkerError {
    // if any function returns redis::RedisError, Rust automatically converts it into WorkerError::Redis.
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Anchor client error: {0}")]
    AnchorClient(#[from] anchor_client::ClientError),
    #[error("Solana client error: {0}")]
    SolanaClient(#[from] solana_client::client_error::ClientError),
    #[error("Config error: {0}")]
    Config(#[from] std::env::VarError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] bincode::error::EncodeError),
    #[error("Pubkey parsing error: {0}")]
    PubkeyParse(String),
    #[error("Hex decoding error: {0}")]
    HexDecode(#[from] hex::FromHexError),
    #[error("Decimal conversion error: {0}")]
    DecimalConversion(String),
    #[error("Missing data: {0}")]
    MissingData(String),
    #[error("Invalid data: {0}")]
    InvalidData(String),
}