use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Contest{
    #[max_len(50)]
    pub name: String,

    pub duration : u64,

    pub start_time : i64,

    pub end_time: i64,

    host: Pubkey,

    #[max_len(30)]
    participents : Vec<Pubkey>
}