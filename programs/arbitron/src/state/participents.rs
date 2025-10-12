use anchor_lang::prelude::*;

#[derive(AnchorDeserialize,AnchorSerialize,Clone,InitSpace)]
pub struct Token{
    pub mint:Pubkey,
    pub is_power_token: bool,
    pub amount:u64,
    #[max_len(32)]
    pub name:String,
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
    #[max_len(40)]
    pub tokens_selected: Vec<Token>
}