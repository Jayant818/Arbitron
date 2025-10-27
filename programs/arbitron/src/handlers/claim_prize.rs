use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked,
};


use crate::{
    state::{Config, Contest, ContestState},
    error::ErrorCode,
};

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut, 
        seeds = [
            b"contest",
            contest.name.as_bytes(),
            contest.host.key().as_ref()
        ],
        bump = contest.bump,
        // Constraint checks
        constraint = contest.status == ContestState::Completed @ ErrorCode::InvalidContestState,
        constraint = contest.winner == Some(winner.key()) @ ErrorCode::NotWinner,
        constraint = !contest.is_prize_claimed @ ErrorCode::AlreadyClaimed,
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        mut, 
        address = contest.prize_pool_vault_usdc @ ErrorCode::InvalidPrizeVault
    )]
    pub contest_vault: InterfaceAccount<'info, TokenAccount>, // Use InterfaceAccount

    #[account(
        mut, 
        // Ensure this is the winner's ATA for the correct mint
        constraint = winner_usdc_account.mint == config.platform_fee_wallet_mint @ ErrorCode::InvalidMint,
        constraint = winner_usdc_account.owner == winner.key() @ ErrorCode::InvalidOwner, 
    )]
    pub winner_usdc_account: InterfaceAccount<'info, TokenAccount>, // Use InterfaceAccount

    #[account(
        mut, 
        address = config.platform_fee_wallet @ ErrorCode::InvalidFeeWallet
    )]
    pub platform_fee_wallet: InterfaceAccount<'info, TokenAccount>, // Use InterfaceAccount

    #[account(
        address = config.platform_fee_wallet_mint @ ErrorCode::InvalidMint
    )]
    pub token_mint: InterfaceAccount<'info, Mint>, // Use InterfaceAccount

    // Use TokenInterface for CPIs
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn claim_prize(ctx: Context<ClaimPrize>) -> Result<()> {
    let contest = &ctx.accounts.contest;
    let config = &ctx.accounts.config;
    let prize_pool_vault = &ctx.accounts.contest_vault;

    require!(prize_pool_vault.amount > 0, ErrorCode::VaultEmpty);

    let total_prize_amount = prize_pool_vault.amount;
    let fee_bps = config.platform_fee_bps;

    // Use u128 for intermediate calculation to prevent overflow
    let platform_fee = ((total_prize_amount as u128 * fee_bps as u128) / 10_000) as u64;
    let winner_amount = total_prize_amount
        .checked_sub(platform_fee)
        .ok_or(ErrorCode::Overflow)?; 

    msg!("Total prize: {}", total_prize_amount);
    msg!("Platform fee ({} bps): {}", fee_bps, platform_fee);
    msg!("Winner amount: {}", winner_amount);

    let host_key = contest.host.key();
    let contest_bump = [contest.bump];
    let contest_name_bytes = contest.name.as_bytes();
    let contest_seeds = &[
        b"contest".as_ref(),
        contest_name_bytes, 
        host_key.as_ref(),
        &contest_bump, 
    ][..]; 
    let signer_seeds = &[contest_seeds][..]; 

    if winner_amount > 0 {
        let winner_transfer_accounts = TransferChecked {
            from: prize_pool_vault.to_account_info(),
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.winner_usdc_account.to_account_info(),
            authority: contest.to_account_info(), 
        };
        let cpi_ctx_winner = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            winner_transfer_accounts,
            signer_seeds, 
        );
        transfer_checked(
            cpi_ctx_winner,
            winner_amount,
            ctx.accounts.token_mint.decimals, 
        )?;
        msg!("Transferred {} to winner {}", winner_amount, ctx.accounts.winner.key());
    }

    if platform_fee > 0 {
        let platform_transfer_accounts = TransferChecked {
            from: prize_pool_vault.to_account_info(),
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.platform_fee_wallet.to_account_info(), 
            authority: contest.to_account_info(), 
        };
        let cpi_ctx_platform = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            platform_transfer_accounts,
            signer_seeds, 
        );
        transfer_checked(
            cpi_ctx_platform,
            platform_fee,
            ctx.accounts.token_mint.decimals, 
        )?;
        msg!(
            "Transferred {} platform fee to {}",
            platform_fee,
            ctx.accounts.platform_fee_wallet.key() 
        );
    }

    let contest_mut = &mut ctx.accounts.contest;
    contest_mut.is_prize_claimed = true;

    Ok(())
}