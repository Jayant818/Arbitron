use anchor_lang::prelude::*;
use crate::{
    Contest, ContestInput,
    error::ErrorCode
};

#[derive(Accounts)]
pub struct StoreContestInput<'info>{
    #[account(mut)]
    pub payer: Signer<'info>,

    pub contest: Account<'info,Contest>,

    #[account(
        init,
        payer = payer,
        space = ContestInput::SPACE,
        seeds = [
            b"contest_inputs",
            contest.key().as_ref()
        ],
        bump
    )]
    pub contest_inputs : Account<'info,ContestInput>,

    pub system_program: Program<'info, System>,
}

pub fn store_contest_inputs(
    ctx: Context<StoreContestInput>,
    data: Vec<u8>,
) -> Result<()> {
    require!(data.len() <= ContestInput::MAX_DATA_LEN, ErrorCode::InputDataTooLarge);

    let contest_inputs = &mut ctx.accounts.contest_inputs;
    contest_inputs.contest = ctx.accounts.contest.key();
    contest_inputs.data = data;
    contest_inputs.bump = ctx.bumps.contest_inputs;

    Ok(())
}