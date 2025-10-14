use anchor_lang::prelude::*;

#[derive(AnchorDeserialize,AnchorSerialize,Clone,InitSpace)]
pub struct Token{
    pub mint:Pubkey,
    pub is_power_token: bool,
    pub quantity: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Participent{
    pub user: Pubkey,
    pub contest: Pubkey,
    pub bump: u8,
    pub has_claimed: bool,
    pub score:u32,
    pub rank:u32,
    pub portfolio:Pubkey,
}