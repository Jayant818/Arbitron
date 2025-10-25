use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, TokenAccount, TokenInterface, TransferChecked,
};
use bonsol_anchor_interface::callback::handle_callback;

use crate::{Contest, IMAGE_ID, error::ErrorCode, Config};

#[derive(Accounts)]
pub struct ReceiveEndContestProof<'info> {
    /// CHECK: Bonsol execution account
    pub execution_request: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = contest.current_execution_account == Some(execution_request.key())
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        mut,
        address = contest.prize_pool_vault_usdt
    )]
    pub prize_pool_vault: Account<'info, TokenAccount>,

    /// CHECK: The winner's wallet (validated by proof)
    #[account(mut)]
    pub winner_account: UncheckedAccount<'info>,

    /// Winner’s token account
    #[account(mut)]
    pub winner_token_usdt_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        constraint = config.platform_fee_wallet == platform_fee_account.key()
    )]
    pub platform_fee_account: Account<'info, TokenAccount>, 

    #[account(
        constraint = config.platform_fee_wallet_mint == token_mint.key()
    )]
    pub token_mint: AccountInfo<'info>,

    pub token_program: Interface<'info, TokenInterface>,
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

    if committed.len() < 48 {
        return Err(ErrorCode::InvalidProofOutput.into());
    }

    let winner_bytes: [u8; 32] = committed[0..32]
        .try_into()
        .map_err(|_| ErrorCode::InvalidProofOutput)?;
    let winner_pubkey = Pubkey::new_from_array(winner_bytes);

    let _max_pnl_bytes: [u8; 16] = committed[32..48]
        .try_into()
        .map_err(|_| ErrorCode::InvalidProofOutput)?;
    // let max_pnl = i128::from_le_bytes(max_pnl_bytes);

    require_keys_eq!(
        ctx.accounts.winner_account.key(),
        winner_pubkey,
        ErrorCode::WinnerMismatch
    );

    let prize_amount = ctx.accounts.prize_pool_vault.amount;
    if prize_amount == 0 {
        return Err(ErrorCode::NoPrizeAvailable.into());
    }

    let contest = &ctx.accounts.contest;
    let host_key = contest.host.key();
    let contest_seeds = [
        b"contest",
        contest.name.as_bytes(),
        host_key.as_ref(),
        &[contest.bump],
    ];
    let signer_seeds = &[&contest_seeds[..]];

    // --- 💰 Platform fee split ---
    let fee_bps = ctx.accounts.config.platform_fee_bps; // e.g. 250 = 2.5%
    let platform_fee = (prize_amount * fee_bps as u64) / 10_000;
    let winner_amount = prize_amount - platform_fee;

    // --- 1️⃣ Transfer to Winner ---
    let winner_transfer = TransferChecked {
        authority: contest.to_account_info(),
        from: ctx.accounts.prize_pool_vault.to_account_info(),
        to: ctx.accounts.winner_token_usdt_account.to_account_info(),
        mint: ctx.accounts.token_mint.to_account_info(),
    };
    let cpi_ctx_winner = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        winner_transfer,
        signer_seeds,
    );
    transfer_checked(cpi_ctx_winner, winner_amount, 6)?;

    // --- 2️⃣ Transfer Platform Fee ---
    if platform_fee > 0 {
        let platform_transfer = TransferChecked {
            authority: contest.to_account_info(),
            from: ctx.accounts.prize_pool_vault.to_account_info(),
            to: ctx.accounts.platform_fee_account.to_account_info(),
            mint: ctx.accounts.token_mint.to_account_info(),
        };
        let cpi_ctx_platform = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            platform_transfer,
            signer_seeds,
        );
        transfer_checked(cpi_ctx_platform, platform_fee, 6)?;
    }

    Ok(())
}
