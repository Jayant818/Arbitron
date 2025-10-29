
use risc0_zkvm::{guest::env};
use serde::{Serialize, Deserialize, Deserializer};

// Data Inputs that zk-worker will send
// These struct definitions match the JSON format from zk-data-prep

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Token {
    #[serde(deserialize_with = "deserialize_pubkey_from_string")]
    pub mint: [u8; 32],
    
    #[serde(rename = "isPowerToken")]
    pub is_power_token: bool,
    
    #[serde(deserialize_with = "deserialize_u64_from_string")]
    pub quantity: u64,  
    
    #[serde(rename = "entryPrice")]
    #[serde(deserialize_with = "deserialize_u64_from_string")]
    pub entry_price: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Participant {
    #[serde(rename = "userPublicKey")]
    #[serde(deserialize_with = "deserialize_pubkey_from_string")]
    pub user: [u8; 32],
    
    #[serde(rename = "selectedTokens")]
    pub tokens: Vec<Token>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FinalPrice {
    #[serde(deserialize_with = "deserialize_pubkey_from_string")]
    pub mint: [u8; 32],
    
    #[serde(deserialize_with = "deserialize_u64_from_string")]
    pub price: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ContestInputs {
    pub participants: Vec<Participant>,
    
    #[serde(rename = "finalPrices")]
    pub final_price: Vec<FinalPrice>,
}

// Custom deserializers for JSON string formats
fn deserialize_pubkey_from_string<'de, D>(deserializer: D) -> Result<[u8; 32], D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    
    // Decode base58 Solana public key
    let bytes = bs58::decode(&s)
        .into_vec()
        .map_err(|e| serde::de::Error::custom(format!("Invalid base58: {}", e)))?;
    
    if bytes.len() != 32 {
        return Err(serde::de::Error::custom("Public key must be 32 bytes"));
    }
    
    let mut array = [0u8; 32];
    array.copy_from_slice(&bytes);
    Ok(array)
}

fn deserialize_u64_from_string<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    s.parse::<u64>()
        .map_err(|e| serde::de::Error::custom(format!("Invalid u64: {}", e)))
}

#[derive(Serialize,Deserialize,Clone)]
pub struct _WinnerDetails {
    pub winner_pub_key : [u8;32],
    pub max_pnl: i128,
}

fn main() {
    // Read raw input data from Bonsol
    // When InputRef::public(account_key) is used, Bonsol reads the account data
    let mut input_data = Vec::<u8>::new();
    env::read_slice(&mut input_data);

    
    env::log("=== DEBUG: Raw Input Analysis ===");
    env::log(&format!("Total input length: {} bytes", input_data.len()));
    
    // Parse Anchor account data structure
    // Layout: [8-byte discriminator][32-byte contest pubkey][4-byte vec len][JSON data][1-byte bump]
    
    if input_data.len() < 45 {
        panic!(
            "Input data too short: expected at least 45 bytes, got {}",
            input_data.len()
        );
    }
    
    // Skip discriminator (8 bytes) and contest pubkey (32 bytes) to reach vec length
    let vec_len_offset = 40;
    
    // Read Vec<u8> length (4 bytes, little-endian u32)
    let vec_len = u32::from_le_bytes([
        input_data[vec_len_offset],
        input_data[vec_len_offset + 1],
        input_data[vec_len_offset + 2],
        input_data[vec_len_offset + 3],
    ]) as usize;
    
    env::log(&format!("Parsed JSON data length: {} bytes", vec_len));
    
    // Extract JSON data (starts at byte 44)
    let json_start = 44;
    let json_end = json_start + vec_len;
    
    if json_end > input_data.len() {
        panic!(
            "Invalid vec length: claimed {}, but only {} bytes after offset",
            vec_len,
            input_data.len() - json_start
        );
    }
    
    let json_data = &input_data[json_start..json_end];
    env::log(&format!("Extracting JSON from bytes {} to {}", json_start, json_end));
    
    // Deserialize JSON to ContestInputs
    let inputs: ContestInputs = match serde_json::from_slice::<ContestInputs>(json_data) {
        Ok(data) => {
            env::log(&format!("✅ Successfully parsed {} participants", data.participants.len()));
            data
        }
        Err(e) => {
            env::log(&format!("❌ JSON deserialization failed: {}", e));
            // Log first 200 bytes of JSON for debugging
            let preview = if json_data.len() > 200 {
                &json_data[..200]
            } else {
                json_data
            };
            env::log(&format!("JSON preview: {:?}", String::from_utf8_lossy(preview)));
            panic!("Failed to deserialize contest inputs JSON: {}", e);
        }
    };

    env::log("=== Starting PNL Calculation ===");

    let mut max_pnl: i128 = i128::MIN;
    let mut winner_pub_key: [u8; 32] = [0; 32];

    for (idx, participant) in inputs.participants.iter().enumerate() {
        let mut participant_pnl: i128 = 0;

        env::log(&format!("Processing participant #{}, tokens: {}", idx + 1, participant.tokens.len()));

        for token in &participant.tokens {
            // Find the final price for this token
            if let Some(final_price_data) = inputs
                .final_price
                .iter()
                .find(|fp| fp.mint == token.mint)
            {
                let final_price = final_price_data.price as i128;
                let entry_price = token.entry_price as i128;
                let quantity = token.quantity as i128;

                let token_pnl = match calculate_pnl(
                    final_price,
                    entry_price,
                    quantity,
                    token.is_power_token,
                ) {
                    Ok(pnl) => pnl,
                    Err(err) => {
                        env::log(&format!("Error calculating PNL: {}", err));
                        0
                    }
                };

                participant_pnl += token_pnl;
            } else {
                env::log("Warning: Final price not found for token");
            }
        }

        env::log(&format!("Participant #{} PNL: {}", idx + 1, participant_pnl));

        if participant_pnl > max_pnl {
            max_pnl = participant_pnl;
            winner_pub_key = participant.user;
        }
    }

    env::log(&format!("=== Winner Determined ==="));
    env::log(&format!("Max PNL: {}", max_pnl));

    // Commit the winner and max PNL as the public output
    env::commit(&(winner_pub_key, max_pnl));
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

