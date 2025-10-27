use anchor_lang::{prelude::*, solana_program::program::invoke};
use bonsol_anchor_interface::{bonsol_interface, instructions::{CallbackConfig, ExecutionConfig, InputRef, execute_v1}};

use crate::{Contest, ContestInput, ContestState, IMAGE_ID,error::ErrorCode};

#[derive(Accounts)]
#[instruction(execution_id:String)]
pub struct RequestEndContestProof<'info>{
    #[account(mut)]
    pub payer : Signer<'info>,

    #[account(
        mut,
        constraint = contest.status == ContestState::Ongoing,
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        seeds = [
            b"contest_inputs",
            contest.key().as_ref()
        ],
        bump = contest_inputs.bump
    )]
    pub contest_inputs: Account<'info, ContestInput>,

    /// CHECK: Checked by Bonsol
    #[account(mut)]
    pub execution_request: AccountInfo<'info>,

    /// CHECK: Checked by Bonsol
    pub deployment_account: AccountInfo<'info>,

    /// CHECK: Bonsol Program
    #[account(
        executable,
        address = bonsol_interface::id(),
    )]
    pub bonsol_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn request_end_contest_proof(context:Context<RequestEndContestProof>,execution_id: String,
    tip: u64,)->Result<()>{

    let slot = Clock::get()?.slot;

    let callback_ix_discriminator:Vec<u8> = vec![];

     let ix = execute_v1(
        &context.accounts.payer.key(),
        &context.accounts.payer.key(),
        IMAGE_ID, // Your Arbitron PNL ZK Guest Image ID
        &execution_id,
        //
        // --- THIS IS THE KEY CHANGE ---
        // Pass a private reference to the PDA instead of public data.
        // Bonsol will read the data from this account.
        vec![InputRef::private(context.accounts.contest_inputs.key().as_ref())],
        //
        tip,
        slot + 100000000, // Expiration slot
        ExecutionConfig {
            forward_output: true,
            verify_input_hash: false,
            input_hash: None,
        },
        Some(CallbackConfig {
            program_id: crate::id(), // Your Arbitron program ID
            instruction_prefix: callback_ix_discriminator,
            extra_accounts: vec![
                // Pass the 'contest' account to the callback
                AccountMeta::new(context.accounts.contest.key(), false),
            ],
        }),
        None,
        vec![], // Or your required oracle/signer accounts
    )
    .map_err(|_| ErrorCode::CantCallExecute)?; // Add CantCallExecute to your ErrorCode

    invoke(&ix, &context.accounts.to_account_infos())?;

    // Set the execution account on the contest state
    // This is CRITICAL for your callback handler to find this execution
    let contest = &mut context.accounts.contest;
    contest.current_execution_account = Some(context.accounts.execution_request.key());

    Ok(())
}