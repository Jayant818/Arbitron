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
    #[max_len(60)]
    pub name: String,

    pub duration : u64,

    pub start_time : i64,

    pub host: Pubkey,

    pub entry_fees : u64,

    pub max_participents: u32, 

    pub participents_count: u32,

    pub status: ContestState,

    pub bump: u8,

    pub prize_pool_vault_usdc: Pubkey,

    pub current_execution_account: Option<Pubkey>,

    pub winner : Option<Pubkey>,

    pub winner_pnl : Option<i128>,

    pub is_prize_claimed : bool,
}