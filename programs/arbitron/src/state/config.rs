use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config{
    pub platform_fee_wallet:Pubkey,
    pub platform_fee_bps:u16, 
    pub admin:Pubkey,
    pub bump:u8,
    pub platform_fee_wallet_mint: Pubkey,
}