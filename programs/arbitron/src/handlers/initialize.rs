use anchor_lang::prelude::*;
use crate::config::Config;

#[derive(Accounts)]
pub struct Initialize<'info>{
    #[account(mut)]
    pub admin:Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [
            b"config",
        ],
        bump,
        space = Config::DISCRIMINATOR.len() + Config::INIT_SPACE,
    )]
    pub config:Account<'info,Config>,

    pub system_program:Program<'info,System>,
}

pub fn initialize(context:Context<Initialize>,platform_fee_wallet:Pubkey,platform_fee_bps:u16, platform_fee_wallet_mint: Pubkey)->Result<()>{

    let config = &mut context.accounts.config;
    config.admin = context.accounts.admin.key();
    config.platform_fee_wallet = platform_fee_wallet;
    config.platform_fee_bps = platform_fee_bps;
    config.platform_fee_wallet_mint = platform_fee_wallet_mint;
    config.bump = context.bumps.config;

    Ok(())
}