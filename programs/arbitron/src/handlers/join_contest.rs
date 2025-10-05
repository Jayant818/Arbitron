use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount,TokenInterface};

use anchor_lang::account;

use crate::{ error::ErrorCode, transfer_token, Config, Contest, ContestState, Participent, Player};

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

    // will be USDT mint address : This is the token we are using for entry fees
    pub token_mint : InterfaceAccount<'info,Mint>,

    #[account(
        mut,
        // address = Pubkey::from_str(PLATFORM_FEE_WALLET).unwrap() @ErrorCode::InvalidPlatformFeeWallet,
        constraint = platform_fee_wallet.key() == config.platform_fee_wallet @ErrorCode::InvalidPlatformFeeWallet,
    )]
    pub platform_fee_wallet:InterfaceAccount<'info,TokenAccount>,

    #[account(
        init_if_needed,
        payer = participent,
        space = Player::DISCRIMINATOR.len() + Player::INIT_SPACE,
        seeds = [
            b"player",
            participent.key().as_ref()
        ],
        bump
    )]
    pub player_global_profile:Account<'info,Player>,

    #[account(
        seeds = [
            b"config"
        ],
        bump = config.bump,
    )]
    pub config:Account<'info,Config>,

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
        has_one = host @ErrorCode::UnauthorizedHost,
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

    // This is a empty account/PDA, we just need its PDA
    #[account(
        seeds = [
            b"trading_pda",
            contest.key().as_ref(),
            participent.key().as_ref()
        ],
        bump
    )]
    /// CHECK:
    pub trading_pda : UncheckedAccount<'info>,

    #[account(
        init,
        payer = participent,
        seeds = [
            b"participent_usdt_ata",
            participent.key().as_ref(),
            token_mint.key().as_ref(),
            contest.key().as_ref()
        ],
        bump,
        token::mint = token_mint,
        token::authority = trading_pda,
    )]
    pub participent_usdt_ata : InterfaceAccount<'info,TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

pub fn join_contest(context: Context<JoinContest>) -> Result<()> {

    let contest = &mut context.accounts.contest;
    let config = &context.accounts.config;
    let platform_fee = contest.entry_fees.checked_mul(config.platform_fee_bps as u64).ok_or(ErrorCode::Overflow)? / 10000; // BPS calculation
    let player_global_profile = &mut context.accounts.player_global_profile;
    // verifications
    
    require!(player_global_profile.active_contest.is_none(), ErrorCode::AlreadyInContest);
    require!(contest.status == ContestState::Upcoming, ErrorCode::ContestNotUpcoming);
    require!(contest.participents_count < contest.max_participents, ErrorCode::ContestFull);
    require!(context.accounts.user_ata.amount >= contest.entry_fees+platform_fee, ErrorCode::InvalidEntryFees);

    //  we need to somehow check if the user has already joined the contest or not, when we try to initialize the PDA it will fail if already exists

    let participent_info: &mut Account<'_, Participent> = &mut context.accounts.participent_info;

    participent_info.user = context.accounts.participent.key();
    participent_info.contest = contest.key();
    participent_info.has_claimed = false;
    participent_info.bump = context.bumps.participent_info;
    participent_info.rank = 0;
    participent_info.score = 0;
    contest.participents_count = contest.participents_count.checked_add(1).unwrap();

    player_global_profile.user = context.accounts.participent.key();
    player_global_profile.active_contest = Some(contest.key());
    player_global_profile.bump = context.bumps.player_global_profile;

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
        platform_fee,
        &token_mint, 
        &authority.to_account_info(), 
        &token_program, 
        None
    )?;

    Ok(())
}