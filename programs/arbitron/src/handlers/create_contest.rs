use anchor_lang::prelude::*;
use anchor_spl::{token_interface::{TokenInterface,TokenAccount,Mint}};

use crate::{error::ErrorCode, Contest, ContestState};

// const USDT_TOKEN_MINT_ADDRESS:&str = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

#[derive(Accounts)]
#[instruction(name:String)]
pub struct CreateContest<'info>{
    #[account(mut)]
    pub signer : Signer<'info>,

    pub token_mint : InterfaceAccount<'info,Mint>,

    #[account(
        init,
        space = Contest::DISCRIMINATOR.len() + Contest::INIT_SPACE,
        payer = signer,
        seeds = [
            b"contest",
            name.as_bytes(),
            signer.key().as_ref()
        ],
        bump,
    )]
    pub contest : Account<'info,Contest>,

    #[account(
        init,
        payer = signer,
        seeds = [
            b"prize_pool_usdt",
            contest.key().as_ref()
        ],
        bump,
        token::mint = token_mint,
        token::authority = contest,
    )]
    pub prize_pool_vault_usdt : InterfaceAccount<'info,TokenAccount>,

    pub system_program : Program<'info,System>,

    pub token_program : Interface<'info, TokenInterface>,
}

pub fn create_contest(context:Context<CreateContest>,name:String, start_time: i64, duration:u64, entry_fees:u64, max_participents:u32)->Result<()>{

    require!(!name.is_empty() && name.len()<=50,ErrorCode::MaxNameLengthExcedded);
    
    require!(entry_fees > 0, ErrorCode::InvalidEntryFees);
    
    require!(duration > 0, ErrorCode::InvalidDuration);
    
    require!(start_time > 0, ErrorCode::InvalidStartTime);
    
    require!(max_participents > 0, ErrorCode::InvalidMaxParticipants);

    let contest = &mut context.accounts.contest;
    let host = &context.accounts.signer;

    contest.name = name;
    contest.start_time = start_time;
    contest.duration = duration;
    contest.host = host.key();
    contest.max_participents = max_participents;
    contest.participents_count = 0;
    contest.status = ContestState::Upcoming;
    contest.entry_fees = entry_fees;
    contest.prize_pool_vault_usdt = context.accounts.prize_pool_vault_usdt.key();
    contest.bump = context.bumps.contest;

    Ok(())
}