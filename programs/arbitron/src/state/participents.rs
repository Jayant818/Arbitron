use anchor_lang::prelude::*;

#[derive(AnchorDeserialize,AnchorSerialize,Clone,InitSpace)]
struct Token{
    pub mint:Pubkey,
    pub amount:u64,
    #[max_len(32)]
    pub name:String
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
    #[max_len(10)]
    pub tokens_selected: Vec<Token>
}