use std::str::FromStr;

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount,TokenInterface};

use anchor_lang::account;

use crate::{contest, error::ErrorCode, transfer_token, Contest, ContestState, Participent, PLATFORM_FEE, PLATFORM_FEE_WALLET};

// Task
// 1) Join the Contest : PDA will be created for user to store his details in the contest
// 2) Create the user PDA for the token_mint(USDC), it will not exist before hand
// 3) Transfer the entry fees from user_ata to the contest_user_ata
// 4) The owner of this is the User_pda
#[derive(Accounts)]
pub struct JoinContest<'info>{
    #[account(mut)]
    pub participent: Signer<'info>,

    pub host: SystemAccount<'info>,

    // will be USDT mint address
    pub token_mint : InterfaceAccount<'info,Mint>,

    #[account(
        mut,
        address = Pubkey::from_str(PLATFORM_FEE_WALLET).unwrap() @ErrorCode::InvalidPlatformFeeWallet,
    )]
    pub platform_fee_wallet:InterfaceAccount<'info,TokenAccount>,

    #[account(
        mut,
        constraint = user_ata.mint == token_mint.key() @ErrorCode::InvalidTokenAccountMint,
        constraint = user_ata.owner == participent.key() @ErrorCode::InvalidTokenAccountOwner,
    )]
    pub user_ata : InterfaceAccount<'info,TokenAccount>,

    #[account(
        mut,
        seeds = [
            b"contest",
            contest.name.as_bytes(),
            host.key().as_ref()
        ],
        bump = contest.bump,
    )]
    pub contest : Account<'info,Contest>,

    #[account(
        init,
        payer = participent,
        space = Participent::DISCRIMINATOR.len() + Participent::INIT_SPACE,
        seeds = [
            b"participent",
            contest.key().as_ref(),
            participent.key().as_ref()
        ],
        bump,
    )]
    pub participent_info : Account<'info,Participent>,

    #[account(
        init,
        payer = participent,
        seeds = [
            b"participent_usdt_ata",
            participent.key().as_ref(),
            token_mint.key().as_ref()
        ],
        bump,
        token::mint = token_mint,
        token::authority = participent_info,
    )]
    pub participent_usdt_ata : InterfaceAccount<'info,TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

pub fn join_contest(context: Context<JoinContest>) -> Result<()> {

    let contest = &context.accounts.contest;
    // verifications
    require!(contest.status == ContestState::Upcoming, ErrorCode::ContestNotUpcoming);
    require!(contest.participents_count < contest.max_participents, ErrorCode::ContestFull);

    //  we need to somehow check if the user has already joined the contest or not, when we try to initialize the PDA it will fail if already exists

    let participent_info = &mut context.accounts.participent_info;

    participent_info.user = context.accounts.participent.key();
    participent_info.contest = context.accounts.contest.key();
    participent_info.has_claimed = false;
    participent_info.bump = context.bumps.participent_info;
    participent_info.rank = 0;
    participent_info.score = 0;

    // Transfer the token from user_ata to our pda
    let user_usdt_ata = &context.accounts.user_ata;
    let participent_ata  = &context.accounts.participent_usdt_ata;
    let token_mint = &context.accounts.token_mint;
    let authority = &context.accounts.participent;
    let token_program = &context.accounts.token_program;

    transfer_token(
        &user_usdt_ata, 
        &participent_ata, 
        contest.entry_fees, 
        &token_mint, 
        &authority.to_account_info(), 
        &token_program, 
        None
    )?;

    transfer_token(
        &user_usdt_ata, 
        &context.accounts.platform_fee_wallet, 
        PLATFORM_FEE as u64 * contest.entry_fees as u64 / 1000u64, 
        &token_mint, 
        &authority.to_account_info(), 
        &token_program, 
        None
    )?;

    Ok(())
}