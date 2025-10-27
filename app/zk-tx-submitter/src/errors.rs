// this crate allow to create custom error enums 
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WorkerError {
    // if any function returns redis::RedisError, Rust automatically converts it into WorkerError::Redis.
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
    #[error("Solana client error: {0}")]
    SolanaClient(#[from] solana_client::client_error::ClientError),
    #[error("Config error: {0}")]
    Config(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serialization(String),
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
    #[error("JSON parsing error: {0}")]
    JsonParse(#[from] serde_json::Error),
    #[error("Bonsol error: {0}")]
    Bonsol(String),
}

// Implement From for bincode errors (bincode 1.x uses Box<bincode::ErrorKind>)
impl From<Box<bincode::ErrorKind>> for WorkerError {
    fn from(e: Box<bincode::ErrorKind>) -> Self {
        WorkerError::Serialization(e.to_string())
    }
}

// Implement From for Pubkey parsing errors
impl From<solana_sdk::pubkey::ParsePubkeyError> for WorkerError {
    fn from(e: solana_sdk::pubkey::ParsePubkeyError) -> Self {
        WorkerError::PubkeyParse(e.to_string())
    }
}

// Implement From for std::num::ParseIntError
impl From<std::num::ParseIntError> for WorkerError {
    fn from(e: std::num::ParseIntError) -> Self {
        WorkerError::InvalidData(format!("Failed to parse integer: {}", e))
    }
}

// Implement From for bonsol_interface error
impl From<bonsol_interface::error::ClientError> for WorkerError {
    fn from(e: bonsol_interface::error::ClientError) -> Self {
        WorkerError::Bonsol(e.to_string())
    }
}

// Implement From for std::env::VarError
impl From<std::env::VarError> for WorkerError {
    fn from(e: std::env::VarError) -> Self {
        WorkerError::Config(e.to_string())
    }
}