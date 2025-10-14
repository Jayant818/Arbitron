use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount,TokenInterface};

use anchor_lang::account;

use crate::{ error::ErrorCode, transfer_token, Contest, ContestState, Participent, Player};

use crate::{Portfolio, Token};

// Task
// 1) Join the Contest : PDA will be created for user to store his details in the contest
// 3) Transfer the entry fees from user_ata to the contest_user_ata
#[derive(Accounts)]
pub struct JoinContest<'info>{
    #[account(mut)]
    pub participent: Signer<'info>,

    pub host: SystemAccount<'info>,

    // will be USDT mint address : This is the token we are using for entry fees
    pub token_mint : InterfaceAccount<'info,Mint>,

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
        mut,
        seeds = [
            b"prize_pool_usdt",
            contest.key().as_ref()
        ],
        bump,
        constraint = prize_pool_vault.mint == token_mint.key() @ErrorCode::InvalidTokenAccountMint
    )]
    pub prize_pool_vault: InterfaceAccount<'info,TokenAccount>,

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
        mut,
        constraint = user_ata.mint == token_mint.key() @ErrorCode::InvalidTokenAccountMint,
        constraint = user_ata.owner == participent.key() @ErrorCode::InvalidTokenAccountOwner,
    )]
    pub user_ata : InterfaceAccount<'info,TokenAccount>,

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
        seeds = [
            b"portfolio",
            participent.key().as_ref(),
            contest.key().as_ref()
        ],
        bump = portfolio.bump,
    )]
    pub portfolio: Account<'info ,Portfolio>,

    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

pub fn join_contest(context: Context<JoinContest>) -> Result<()> {

    let contest = &mut context.accounts.contest;
    let player_global_profile = &mut context.accounts.player_global_profile;
    // verifications
    
    // require!(player_global_profile.active_contest.is_none(), ErrorCode::AlreadyInContest);
    require!(contest.status == ContestState::Upcoming, ErrorCode::ContestNotUpcoming);
    require!(contest.participents_count < contest.max_participents, ErrorCode::ContestFull);
    require!(context.accounts.user_ata.amount >= contest.entry_fees, ErrorCode::InvalidEntryFees);

    let participent_info: &mut Account<'_, Participent> = &mut context.accounts.participent_info;
    let portfolio = &mut context.accounts.portfolio;

    participent_info.user = context.accounts.participent.key();
    participent_info.contest = contest.key();
    participent_info.has_claimed = false;
    participent_info.bump = context.bumps.participent_info;
    participent_info.rank = 0;
    participent_info.score = 0;
    participent_info.portfolio = portfolio.key();
    contest.participents_count = contest.participents_count.checked_add(1).unwrap();

    player_global_profile.user = context.accounts.participent.key();
    player_global_profile.active_contest = Some(contest.key());
    player_global_profile.bump = context.bumps.player_global_profile;

    // Transfer the token from user_ata to our pda
    let user_usdt_ata = &context.accounts.user_ata;
    let prize_pool_usdt_ata = &context.accounts.prize_pool_vault;
    let token_mint = &context.accounts.token_mint;
    let authority = &context.accounts.participent;
    let token_program = &context.accounts.token_program;


    transfer_token(
        user_usdt_ata, 
        prize_pool_usdt_ata, 
        contest.entry_fees, 
        token_mint, 
        &authority.to_account_info(), 
        token_program, 
        None
    )?;

    Ok(())
}