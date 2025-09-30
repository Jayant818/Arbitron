use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,

    #[msg("Name max length Excedded")]
    MaxNameLengthExcedded,

    #[msg("Contest is full")]
    ContestFull,

    #[msg("Already joined the contest")]
    AlreadyJoined,

    #[msg("Contest is not in upcoming state")]
    ContestNotUpcoming,

    #[msg("Invalid token account mint")]
    InvalidTokenAccountMint,

    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,

    #[msg("Invalid platform fee wallet")]
    InvalidPlatformFeeWallet
}
