use anchor_lang::prelude::*;

use crate::Contest;

#[derive(Accounts)]
pub struct SetExecutionAccount<'info>{
    #[account(mut)]
    pub host:Signer<'info>,

    #[account(mut)]
    pub contest: Account<'info,Contest>,
}

pub fn set_execution_account(context:Context<SetExecutionAccount>,execution_account:Pubkey)->Result<()>{

    let contest = &mut context.accounts.contest;

    contest.current_execution_account = Some(execution_account);

    Ok(())
}