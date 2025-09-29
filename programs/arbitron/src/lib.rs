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

    pub fn create_contest(context:Context<CreateContest>,name:String, start_time:i64, duration:u64,entry_fees:u64, max_participents:u64)->Result<()>{

        handlers::create_contest(context, name,start_time,duration,entry_fees,max_participents)?;
        Ok(())
    }
}
