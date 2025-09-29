use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface,TransferChecked,transfer_checked, CloseAccount,close_account};

pub fn transfer_token<'info>(
    from: &InterfaceAccount<'info,TokenAccount>,
    to:&InterfaceAccount<'info,TokenAccount>,
    amount:u64,
    mint: &InterfaceAccount<'info,Mint>,
    authority: &AccountInfo<'info>,
    token_program: &Interface<'info,TokenInterface>,
    seeds: Option<&[&[u8]]>
)->Result<()>{

    let transfer_accounts = TransferChecked{
        authority:authority.to_account_info(),
        from:from.to_account_info(),
        to:to.to_account_info(),
        mint:mint.to_account_info()
    };

    let cpi_program = token_program.to_account_info();

    let signer_seed = seeds.map(|seed|[seed]);

    let cpi_ctx = if let Some(ref seed) = signer_seed {
        CpiContext::new_with_signer(cpi_program, transfer_accounts, seed)
    }else{
        CpiContext::new(cpi_program, transfer_accounts)
    };


    // let cpi_ctx: CpiContext<'_, '_, '_, '_, TransferChecked<'_>> = match seeds {
    //     Some(seed)=> CpiContext::new_with_signer(cpi_program, transfer_accounts, &[signer_seed]),
    //     None => CpiContext::new(cpi_program, transfer_accounts)
    // };

    transfer_checked(cpi_ctx, amount, mint.decimals)?;       

    Ok(())
}

pub fn close_token_account<'info>(
    token_account: &InterfaceAccount<'info,TokenAccount>,
    authority : &AccountInfo<'info>,
    destination: &AccountInfo<'info>,
    token_program:&Interface<'info,TokenInterface>,
    seeds: Option<&[&[u8]]>
)->Result<()>{

    let close_accounts = CloseAccount{
        account:token_account.to_account_info(),
        authority:authority.to_account_info(),
        destination:destination.to_account_info(),
    };

    let cpi_program = token_program.to_account_info();

    let signer_seed = seeds.map(|seed| [seed]);

    let cpi_ctx = if let Some(ref seed) = signer_seed{
        CpiContext::new_with_signer(cpi_program, close_accounts, seed)
    } else{
        CpiContext::new(cpi_program, close_accounts)
    };

    close_account(cpi_ctx)?;

    Ok(())
}