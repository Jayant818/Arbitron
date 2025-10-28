use anchor_lang::prelude::*;
use bonsol_interface::callback::handle_callback;

use crate::{Contest, ContestState, IMAGE_ID, error::ErrorCode};

#[derive(Accounts)]
pub struct ReceiveEndContestProof<'info> {
    /// CHECK: Bonsol execution account
    pub execution_request: UncheckedAccount<'info>,

    #[account(
        mut,
    )]
    pub contest: Account<'info, Contest>,
}

pub fn receive_end_contest_proof(
    ctx: Context<ReceiveEndContestProof>,
    data: Vec<u8>, // Changed from fixed array to Vec - Bonsol passes variable length data
) -> Result<()> {

    msg!("Processing bonsol_callback");

    // Verify this callback is for the expected execution
    require!(
        ctx.accounts.contest.current_execution_account == Some(ctx.accounts.execution_request.key()), 
        ErrorCode::CallbackCalledUnintensionally
    );

    let output = handle_callback(
        IMAGE_ID,
        &ctx.accounts.execution_request.key(),
        &ctx.accounts.to_account_infos(),
        &data,
    )?;

    let committed = &output.committed_outputs;
    
    msg!("Committed output length: {}", committed.len());

    // 32 bytes for winner pubkey + 16 bytes for i128 PNL = 48 bytes minimum
    require!(
        committed.len() >= 48, 
        ErrorCode::InvalidProofOutput
    );

    // Extract winner pubkey (first 32 bytes)
    let winner_bytes: [u8; 32] = committed[0..32]
        .try_into()
        .map_err(|_| ErrorCode::InvalidProofOutput)?;
    let winner_pubkey = Pubkey::new_from_array(winner_bytes);

    // Extract max PNL (next 16 bytes)
    let max_pnl_bytes: [u8; 16] = committed[32..48]
        .try_into()
        .map_err(|_| ErrorCode::InvalidProofOutput)?;
    let max_pnl = i128::from_le_bytes(max_pnl_bytes);

    msg!("Winner: {}, PNL: {}", winner_pubkey, max_pnl);

    // Update contest state
    let contest = &mut ctx.accounts.contest;
    contest.winner = Some(winner_pubkey);
    contest.winner_pnl = Some(max_pnl);
    contest.status = ContestState::Completed; 
    contest.current_execution_account = None; 

    Ok(())
}