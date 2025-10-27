use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ContestInput{
    pub contest : Pubkey,
    pub data:Vec<u8>,
    pub bump :u8,    
}

impl ContestInput{
    // 8 + 32 + 4(vec prefix) + data_len + 1(bump)
    pub const MAX_DATA_LEN:usize = 5120;  // 5 kb
    pub const SPACE :usize = 8+32+(4 + Self::MAX_DATA_LEN) +1;
}
