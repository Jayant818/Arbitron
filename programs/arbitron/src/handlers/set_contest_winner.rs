use std::str::FromStr;

use anchor_lang::prelude::*;
use crate::{Contest, ContestState, SIGNER, error::ErrorCode};

#[derive(Accounts)]
pub struct SetContestWinner<'info> {
    #[account(
        mut,
        constraint = host.key() == Pubkey::from_str(SIGNER).unwrap() @ ErrorCode::Unauthorized
    )]
    pub host: Signer<'info>,

    #[account(mut)]
    pub contest: Account<'info, Contest>,

    pub system_program: Program<'info, System>,
}

pub fn set_contest_winner(
    ctx: Context<SetContestWinner>,
    winner_pubkey: Pubkey,
    max_pnl: i128,
) -> Result<()> {
    
    let contest = &mut ctx.accounts.contest;

    // Set the winner and PNL
    contest.winner = Some(winner_pubkey);
    contest.winner_pnl = Some(max_pnl);
    
    // Move contest to completed state
    contest.status = ContestState::Completed;

    msg!("Contest winner set by host");
    msg!("Winner: {}", winner_pubkey);
    msg!("Max PNL: {}", max_pnl);

    Ok(())
}