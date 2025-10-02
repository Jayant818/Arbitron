use anchor_lang::prelude::*;

use crate::{Contest,ContestState, error::ErrorCode};

// unsure, In web2 it should happen automatically but in web3, let say host want to start the contest, with the current number of players only.

#[derive(Accounts)]
pub struct StartContest<'info>{
    #[account(mut)]
    pub host:Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"contest",
            contest.name.as_bytes(),
            host.key().as_ref()
        ],
        bump = contest.bump,
        constraint = contest.host == host.key() @ErrorCode::UnauthorizedHost,
        constraint = contest.status == ContestState::Upcoming @ErrorCode::InvalidContestState,
    )]
    pub contest: Account<'info, Contest>,
}

pub fn start_contest(ctx:Context<StartContest>)->Result<()>{

    let contest = &mut ctx.accounts.contest;
    contest.status = ContestState::Ongoing;
    Ok(())
}