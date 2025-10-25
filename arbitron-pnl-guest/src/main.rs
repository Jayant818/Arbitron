
use risc0_zkvm::{guest::{env, sha::Impl}, sha::{Sha256}};
use serde::{
    Serialize, Deserialize
};

// Data Inputs that zk-worker will send

#[derive(Serialize,Deserialize,Clone)]
pub struct Token{
    pub mint : [u8;32],
    pub is_power_token: bool,
    pub quantity: u8,
    pub entry_price : u64,
}

#[derive(Serialize,Deserialize,Clone)]
pub struct Participant{
    pub user : [u8;32],
    pub tokens: Vec<Token>,
}

#[derive(Serialize,Deserialize,Clone)]
pub struct FinalPrice{
    pub mint : [u8;32],
    pub price: u64,
}

#[derive(Serialize,Deserialize,Clone)]
pub struct ContestInputs{
    pub participants : Vec<Participant>,
    pub final_price : Vec<FinalPrice>,
}

#[derive(Serialize,Deserialize,Clone)]
pub struct _WinnerDetails {
    pub winner_pub_key : [u8;32],
    pub max_pnl: i128,
}

fn main() {
   // Environment(env) - Module
   // read function - it deserializes the data passed to your program and convert that to the expected type.
   // basically it loads private and public input for the circuit that can be used to generate the circuit.     
   let inputs:ContestInputs = env::read();

   let mut max_pnl: i128 = i128::MIN;
   let mut winner_pub_key: [u8;32] = [0;32];

   for participant in &inputs.participants{
        let mut participant_pnl:i128 = 0;

        for token in &participant.tokens{
            // Find the Final price for this token 
            // Find method searches for the first element in the list that mathces the condition
            // find return Some(val)
            // find , map , filter these are iterator method 
            if let Some(final_price_data) = inputs.final_price.iter().find(|fp| fp.mint == token.mint){
                let final_price = final_price_data.price as i128;
                let entry_price = token.entry_price as i128;
                let quantity = token.quantity as i128;

                let token_pnl = match calculate_pnl(final_price, entry_price, quantity,token.is_power_token){
                    Ok(pnl)=>pnl,
                    Err(err)=> {
                        eprintln!("Error {}",err);
                        0
                    }
                };

                participant_pnl +=token_pnl;
            }
        }

        if participant_pnl > max_pnl {
            max_pnl = participant_pnl;
            winner_pub_key = participant.user;
        }
   }

//    let winner = WinnerDetails{
//     max_pnl: max_pnl,
//     winner_pub_key:winner_pub_key
//    };

   // This commits a value to the environment, meaning the value is recoreded as proof's public output so that it can be verified later.    
   // This is the public output that bonsol will verify and send back to the on-chain program        
   // We are saying here make this value part of the final proof/output that's verifiable.
   // through commit we expose result without revealing private inputs.
   // also there can be multiple commits 
   //env::commit(&winner);
   //env::commit(&pnl);
   env::commit(&(winner_pub_key,max_pnl));


}


fn calculate_pnl (final_price:i128,entry_price:i128, quantity:i128,is_power_token:bool)->Result<i128,&'static str>{
    // This is safe arithmetic calculation using checked operation, but it checks for errors instead of panicking 
    // If substraction overflowed it would return None, instead of crashing otherwise it would return Some(result)
    // let x: i8 = -128;
    // let y = 1;
    // println!("{:?}", x.checked_sub(y)); // None (underflow)

    // ok_or - it basically converts the Option returned by checked arithmetic into Result - Some(V) : OK(V), None -> Err("Substraction Overflow")
    // ? unwraps the result

    let mut pnl = final_price.checked_sub(entry_price).ok_or("Subtraction Overflow")?.checked_mul(quantity).ok_or("Multiplication Overflow")?;

    if is_power_token{
        pnl = pnl.checked_mul(2).ok_or("Multiplication Overflow during power_token Multiplication")?;
    }

    Ok(pnl)    
}

