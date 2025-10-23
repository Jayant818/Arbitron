use anchor_lang::prelude::*;
use crate::Contest;

#[derive(Accounts)]
pub struct EndAccount<'info>{
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK:
    pub host: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            b"contest",
            contest.name.as_bytes(),
            host.key().as_ref()
        ],
        bump = contest.bump
    )]
    pub contest: Account<'info,Contest>,
}

pub fn end_account(context:Context<EndAccount>)->Result<()>{

    let contest = &mut context.accounts.contest;

    // 1. Calculate the P&L of each Participent's tokens
    // 2. Transfer the money to the winner
    // 3. Close the pda
    contest.status = crate::ContestState::Completed;


    Ok(())
}