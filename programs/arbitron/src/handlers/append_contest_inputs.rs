use anchor_lang::prelude::*;

use crate::{Contest, ContestInput, error::ErrorCode};

#[derive(Accounts)]
pub struct AppendContestInputs<'info>{
    #[account(mut)]
    pub payer : Signer<'info>,

    #[account(
        mut, 
        seeds = [b"contest_inputs", contest.key().as_ref()],
        bump = contest_inputs.bump 
    )]
    pub contest_inputs: Account<'info, ContestInput>,
    // Include contest to derive seeds, though not strictly needed in handler
    pub contest: Account<'info, Contest>,
}

pub fn append_contest_inputs(context:Context<AppendContestInputs>,offset:u32,chunk:Vec<u8>)->Result<()>{

    let contest_inputs = &mut context.accounts.contest_inputs;
    let offset = offset as usize;
    let chunk_len = chunk.len();
    let required_len = offset + chunk_len;

    // Ensure the data Vec is large enough to accommodate the new chunk
    if contest_inputs.data.len() < required_len {
        contest_inputs.data.resize(required_len, 0);
    }

    // Verify we're not exceeding maximum allowed size
    require!(required_len <= ContestInput::MAX_DATA_LEN, ErrorCode::OffsetOutOfRange);

    // Copy the chunk data at the specified offset
    contest_inputs.data[offset..offset+chunk_len].copy_from_slice(&chunk);

    Ok(())
}