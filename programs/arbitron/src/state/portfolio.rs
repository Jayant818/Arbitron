use anchor_lang::prelude::*;

#[derive(AnchorDeserialize,AnchorSerialize,Clone,InitSpace)]
pub struct SelectedToken {
    pub mint:Pubkey,
    pub is_power_token:bool,
    pub quantity:u8,
    pub entry_price: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Portfolio{
    pub contest: Pubkey,
    
    pub user: Pubkey,

    #[max_len(200)]
    pub token_selected: Vec<SelectedToken>,

    pub bump: u8,
}