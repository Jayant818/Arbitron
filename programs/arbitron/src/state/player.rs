
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Player{
    pub user: Pubkey,
    pub active_contest : Option<Pubkey>,
    pub bump: u8,
}