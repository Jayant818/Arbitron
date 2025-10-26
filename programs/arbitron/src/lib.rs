pub mod constants;
pub mod error;
pub mod handlers;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use handlers::*;
pub use error::*;
pub use state::*;

declare_id!("GVP9mBCdGTTfiBmMWf1h5pqyXxorFeBmUvBbC7aUiTXS");

#[program]
pub mod arbitron {
    use super::*;

    pub fn initialize(context: Context<Initialize>,platform_fee_wallet:Pubkey,platform_fee_bps:u16) -> Result<()> {
        handlers::initialize(context, platform_fee_wallet, platform_fee_bps)?;
        Ok(())
    }

    pub fn create_contest(context:Context<CreateContest>,name:String, start_time:i64, duration:u64,entry_fees:u64, max_participents:u32)->Result<()>{

        handlers::create_contest(context, name,start_time,duration,entry_fees,max_participents)?;
        Ok(())
    }

    pub fn join_contest(context:Context<JoinContest> )->Result<()>{
        handlers::join_contest(context)?;
        Ok(())
    }

    pub fn start_contest(context:Context<StartContest>)->Result<()>{
        handlers::start_contest(context)?;
        Ok(())
    }

    pub fn create_portfolio(context:Context<CreatePortfolio>,token_selected:Vec<SelectedToken>)->Result<()>{
        handlers::create_portfolio(context,token_selected)?;

        Ok(())
    }

    pub fn update_portfolio(context:Context<UpdatePortfolio>,token_selected:Vec<SelectedToken>)->Result<()>{
        handlers::update_portfolio(context,token_selected)?;
        Ok(())
    }

    pub fn receive_end_contest_proof(context:Context<ReceiveEndContestProof>,data:Vec<u8> )->Result<()>{
        
        handlers::receive_end_contest_proof(context,data)?;

        Ok(())
    }

    pub fn set_execution_account(context:Context<SetExecutionAccount>,execution_account:Pubkey)->Result<()>{
        handlers::set_execution_account(context, execution_account);
        Ok(())
    }


}
