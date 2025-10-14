use anchor_lang::prelude::*;
use crate::{Contest, ContestState, Portfolio, SelectedToken};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct UpdatePortfolio<'info>{
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: 
    pub host: UncheckedAccount<'info>,

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
        mut,
        seeds = [
            b"portfolio",
            signer.key().as_ref(),
            contest.key().as_ref()
        ],
        bump = participent_portfolio.bump,
    )]
    pub participent_portfolio: Account<'info,Portfolio>,

    pub system_program : Program<'info,System>

}

pub fn update_portfolio(context:Context<UpdatePortfolio>, mut token_selected:Vec<SelectedToken>)->Result<()>{
    let contest = &context.accounts.contest;

    require!(contest.status == ContestState::Upcoming, ErrorCode::InvalidContestState);

    let participant_portfolio = &mut context.accounts.participent_portfolio;

    participant_portfolio.token_selected.append(&mut token_selected);

    Ok(())
}