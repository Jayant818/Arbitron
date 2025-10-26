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
use errors::*;
use structs::*;

const ZK_INPUTS_QUEUE: &str = "zk-inputs-queue";
const BONSOL_PROGRAM_ID_STR: &str = "bonsol6EaVdM3eS2sYF16o8SgNqN1nKk1soBEkeyKEPC";

fn main() {
}
