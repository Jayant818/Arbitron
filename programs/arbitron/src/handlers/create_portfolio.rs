use anchor_lang::prelude::*;

use crate::{Contest, ContestState, Portfolio, SelectedToken};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct CreatePortfolio<'info>{
    #[account(mut)]
    pub user:Signer<'info>,

    /// CHECK:
    pub host:UncheckedAccount<'info>,

    #[account(
        seeds=[
            b"contest",
            contest.name.as_bytes(),
            host.key().as_ref()
        ],
        bump = contest.bump
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [
            b"portfolio",
            user.key().as_ref(),
            contest.key().as_ref()
        ],
        bump,
        space = Portfolio::DISCRIMINATOR.len() + Portfolio::INIT_SPACE
    )]
    pub participant_portfolio: Account<'info,Portfolio>,

    pub system_program : Program<'info,System>,
}

pub fn create_portfolio(context:Context<CreatePortfolio>, token_selected:Vec<SelectedToken>)->Result<()>{

    // Initial Checks 

    let is_power_token_count = token_selected.iter().filter(|t| t.is_power_token).count();
    let contest = &context.accounts.contest;
    require!(is_power_token_count==1, ErrorCode::InvalidLeverageSelection);
    require!(contest.status == ContestState::Upcoming, ErrorCode::InvalidContestState);

    let participant_portfolio = &mut context.accounts.participant_portfolio;
    let user = &context.accounts.user;

    participant_portfolio.user = user.key();
    participant_portfolio.bump = context.bumps.participant_portfolio;
    participant_portfolio.contest = context.accounts.contest.key();
    participant_portfolio.token_selected = token_selected;

    Ok(())
}