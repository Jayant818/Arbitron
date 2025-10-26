use anchor_lang::prelude::*;
use bonsol_anchor_interface::callback::handle_callback;
use crate::{Contest, IMAGE_ID, error::ErrorCode, ContestState}; // Import ContestState

#[derive(Accounts)]
pub struct ReceiveEndContestProof<'info> {
    /// CHECK: Bonsol execution account
    pub execution_request: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = contest.current_execution_account == Some(execution_request.key())
    )]
    pub contest: Account<'info, Contest>,
}

pub fn receive_end_contest_proof(
    ctx: Context<ReceiveEndContestProof>,
    data: Vec<u8>,
) -> Result<()> {
    let output = handle_callback(
        IMAGE_ID,
        &ctx.accounts.execution_request.key(),
        &ctx.accounts.to_account_infos(),
        &data,
    )?;

    let committed = output.committed_outputs;

    // 32 bytes for winner pubkey + 16 bytes for i128 PNL
    if committed.len() < 48 { 
        return Err(ErrorCode::InvalidProofOutput.into());
    }

    // --- 1. Parse Winner Pubkey ---
    let winner_bytes: [u8; 32] = committed[0..32]
        .try_into()
        .map_err(|_| ErrorCode::InvalidProofOutput)?;
    let winner_pubkey = Pubkey::new_from_array(winner_bytes);

    // --- 2. Parse Max PNL ---
    let max_pnl_bytes: [u8; 16] = committed[32..48]
        .try_into()
        .map_err(|_| ErrorCode::InvalidProofOutput)?;
    let max_pnl = i128::from_le_bytes(max_pnl_bytes);

    // --- 3. Save Results to Contest ---
    let contest = &mut ctx.accounts.contest;
    contest.winner = Some(winner_pubkey);
    contest.winner_pnl = Some(max_pnl);
    contest.status = ContestState::Completed; // Mark as completed
    contest.current_execution_account = None; // Clear the execution account

    Ok(())
}