use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,

    #[msg("Overflow Occurred")]
    Overflow,

    #[msg("Name max length Excedded")]
    MaxNameLengthExcedded,

    #[msg("Contest is full")]
    ContestFull,

    #[msg("Already Participated in another contest")]
    AlreadyInContest,

    #[msg("The contest has not reached its scheduled start time yet.")]
    ContestNotStartedYet,

    #[msg("Minimum participants not reached")]
    MinContestParticipantsError,

    #[msg("Already joined the contest")]
    AlreadyJoined,

    #[msg("Contest is not in upcoming state")]
    ContestNotUpcoming,

    #[msg("Invalid token account mint")]
    InvalidTokenAccountMint,

    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,

    #[msg("Invalid platform fee wallet")]
    InvalidPlatformFeeWallet,

    #[msg("Unauthorized host")]
    UnauthorizedHost,

    #[msg("Unauthorized action")]
    UnauthorizedAction,

    #[msg("Invalid contest state")]
    InvalidContestState,

    #[msg("Contest already exists")]
    ContestAlreadyExists,

    #[msg("Invalid entry fees amount")]
    InvalidEntryFees,

    #[msg("Invalid duration")]
    InvalidDuration,

    #[msg("Invalid start time")]
    InvalidStartTime,

    #[msg("Invalid max participants")]
    InvalidMaxParticipants,

    #[msg("Power Token not selected")]
    InvalidLeverageSelection,

    #[msg("Invalid Proof Verification")]
    InvalidProofVerification,

    #[msg("Invalid Proof Size")]
    InvalidProofOutput,

    #[msg("Winner Mismatch")]
    WinnerMismatch,

    #[msg("No Prize Available")]
    NoPrizeAvailable,
}
