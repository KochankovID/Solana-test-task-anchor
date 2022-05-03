use anchor_lang::prelude::*;

declare_id!("71pwG39Q9r8T3YKnLZ4KE7vPnLwptJQpkmTRkCU5dRZD");
const ADMIN: &str = "2iRVv5L7cA7LMeq7C4wy4MeEUGqSCKoyYSXLAwrG2vFf";

#[program]
pub mod solana_test_task_anchor {
    use anchor_lang::solana_program::{
        program::invoke,
        system_instruction::transfer,
    };

    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn deposit(ctx: Context<MakeDeposit>, amount: u64) -> Result<()> {
        invoke(
            &transfer(ctx.accounts.user.key, &ctx.accounts.deposit.key(), amount),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.deposit.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let user_deposit_history = &mut ctx.accounts.deposit_history;
        user_deposit_history.amount += amount;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let deposit_account = ctx.accounts.deposit.to_account_info();
        let admin_account = ctx.accounts.admin.to_account_info();

        let amount = **deposit_account.lamports.borrow() - Rent::get()?.minimum_balance(8);

        **deposit_account.try_borrow_mut_lamports()? -= amount;
        **admin_account.try_borrow_mut_lamports()? += amount;

        Ok(())
    }
}

#[account]
#[derive(Default)]
pub struct DepositHistory {
    amount: u64,
}

#[account]
#[derive(Default)]
pub struct Deposit {}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut, constraint = admin.key.to_string() == ADMIN)]
    pub admin: Signer<'info>,
    #[account(init, payer = admin, space = 8, seeds = [b"deposit"], bump)]
    pub deposit: Account<'info, Deposit>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MakeDeposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"deposit"], bump)]
    pub deposit: Account<'info, Deposit>,
    #[account(
    init_if_needed,
    payer = user,
    space = 8 + 8, seeds = [b"deposit-hisotry", user.key().as_ref()],
    bump
    )]
    pub deposit_history: Account<'info, DepositHistory>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, constraint = admin.key.to_string() == ADMIN)]
    pub admin: Signer<'info>,
    #[account(mut, seeds = [b"deposit"], bump)]
    pub deposit: Account<'info, Deposit>,
    pub system_program: Program<'info, System>,
}
