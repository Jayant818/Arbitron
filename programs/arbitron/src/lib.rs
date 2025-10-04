pub mod constants;
pub mod error;
pub mod handlers;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use handlers::*;
pub use error::*;
pub use state::*;

declare_id!("ETjik8Bom7xHKv7HHawVM1igFNwJbKyWBZtnLp8jEkgD");

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

    pub fn join_contest(context:Context<JoinContest>)->Result<()>{
        handlers::join_contest(context)?;
        Ok(())
    }

    pub fn start_contest(context:Context<StartContest>)->Result<()>{
        handlers::start_contest(context)?;
        Ok(())
    }

    pub fn execute_swap(context:Context<ExecuteSwap>)->Result<()>{
        handlers::execute_swap(context)?;
        Ok(())
    }
}
