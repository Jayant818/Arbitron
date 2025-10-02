use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ExecuteSwap{}


pub fn execute_swap(ctx:Context<ExecuteSwap>)->Result<()>{
    Ok(())
}
