use serde::{Deserialize,Serialize};
// FromRow tells sqlx, how to convert a database row into the Rust struct 
use sqlx::FromRow;
use uuid::{Uuid};
use anchor_lang::prelude::Pubkey;

// Mirroring DB and ZK Program

// 1) ZK Program

#[derive(Serialize,Deserialize,Clone)]
pub struct Token{
    pub mint : [u8;32],
    pub is_power_token: bool,
    pub quantity: u8,
    pub entry_price : u64,
}

#[derive(Serialize,Deserialize,Clone)]
pub struct Participant{
    pub user : [u8;32],
    pub tokens: Vec<Token>,
}

#[derive(Serialize,Deserialize,Clone)]
pub struct FinalPrice{
    pub mint : [u8;32],
    pub price: u64,
}

#[derive(Serialize,Deserialize,Clone)]
pub struct ContestInputs{
    pub participants : Vec<Participant>,
    pub final_price : Vec<FinalPrice>,
}

// 2) DB
#[derive(FromRow,Debug)]
pub struct DbUser{
    pub id: Uuid,
    // This is not default, so while inserting or reading, while querying data convert this in the string type
    #[sqlx(rename = "publicKey")]
    pub public_key : Pubkey,
}


#[derive(FromRow,Debug)]
pub struct SelectedToken{
    pub id: Uuid,
    #[sqlx(rename = "participantId")]
    pub participant_id : String,
    pub mint: String,
    #[sqlx(rename = "isPowerToken")]
    pub is_power_token: bool,
    pub quantity: u8,
    #[sqlx(rename = "entryPrice")]
    pub entry_price: u64,
}

#[derive(FromRow,Debug)]
pub struct DbParticipant{
    pub id: Uuid,
    #[sqlx(rename = "contestId")]
    pub contest_id: String,
    #[sqlx(rename = "userId")]
    pub user_id : String,
}

// Custom Structs to Combine Participant Data
#[derive(Debug)]
pub struct ParticipantWithData{
    pub user: DbUser,
    pub participant:DbParticipant,
    pub selected_tokens:Vec<SelectedToken>,
}

#[derive(FromRow, Debug)]
pub struct TokenPrice {
    pub mint: String,
    pub price: u64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(FromRow,Debug)]
pub struct DbContest{
    id: Uuid,
    host: Pubkey,
}
