use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Participent{
    pub user: Pubkey,
    pub contest: Pubkey,
    pub bump: u8,
    pub has_claimed: bool,
    pub score:u32,
    pub rank:u32,
}