use anchor_lang::prelude::*;
use anchor_spl::{token::{Mint, TokenAccount}, token_interface::TokenInterface};

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
            b"prize_pool_usdc_ata",
            contest.key().as_ref()
        ],
        bump,
        token::mint = token_mint,
        token::authority = contest,
    )]
    pub prize_pool_usdc_ata : InterfaceAccount<'info,TokenAccount>,

    pub system_program : Program<'info,System>,

    pub token_program : Interface<'info, TokenInterface>,
}

pub fn create_contest(context:Context<CreateContest>,name:String, start_time: i64, duration:u64, entry_fees:u64, max_participents:u32,participents_count:u32)->Result<()>{

    require!(!name.is_empty() && name.len()<=50,ErrorCode::MaxNameLengthExcedded);

    let contest = &mut context.accounts.contest;
    let host = &context.accounts.signer;

    contest.name = name;
    contest.start_time = start_time;
    contest.duration = duration;
    contest.host = host.key();
    contest.max_participents = max_participents;
    contest.participents_count = participents_count;
    contest.status = ContestState::Upcoming;
    contest.entry_fees = entry_fees;
    contest.prize_pool_usdc_ata = context.accounts.prize_pool_usdc_ata.key();

    Ok(())
}