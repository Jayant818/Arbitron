use anchor_lang::prelude::*;

#[derive(AnchorDeserialize,AnchorSerialize,PartialEq,InitSpace,Clone)]
pub enum ContestState{
    Upcoming,
    Ongoing,
    Completed,
}

#[account]
#[derive(InitSpace)]
pub struct Contest{
    #[max_len(50)]
    pub name: String,

    pub duration : u64,

    pub start_time : i64,

    pub host: Pubkey,

    pub entry_fees : u64,

    pub max_participents: u32, 

    pub participents_count: u32,

    pub status: ContestState,

    pub prize_pool_usdc_ata : Pubkey,
}