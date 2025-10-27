use serde::{Deserialize, Serialize};

// ZK Program Structs - These are used for serialization with bincode v1.3
// Only using serde derives for compatibility with RISC Zero guest code

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Token {
    pub mint: [u8; 32],
    pub is_power_token: bool,
    pub quantity: u8,
    pub entry_price: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Participant {
    pub user: [u8; 32],
    pub tokens: Vec<Token>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FinalPrice {
    pub mint: [u8; 32],
    pub price: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ContestInputs {
    pub participants: Vec<Participant>,
    pub final_price: Vec<FinalPrice>,
}
