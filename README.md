# Solana-test-task-anchor

---

## Setup

- Run `cargo install`
- Run `npm i`

## Run

### Build program

- Run `anchor build`

### Run integration tests

- Run `anchor test`

## Description

### Overview

The program creates:

- Deposit account for storing sol tokens (data is empty)
- PDA account for storing information about user's deposit (creates for each user with user's pubkey as seed)

> In the vanila rust version I've created one PDA for storing all data. But here I create PDA per user.

### Instructions

- Deposit { amount: u64 } - Deposit lamports to the deposit account
  - `[signer, writable]` - The account of the person who wants to send the donation
  - `[writable]` - The deposit accumulate account
  - `[writable]` The PDA account for storing history data
  - `[]` System program
- Withdraw - Send all deposited lamports to admin account
  - `[signer, writable]` Admin account
  - `[writable]` The deposit accumulate account
- Initialize - Create PDA and deposit accounts
  - `[signer, writable]` The admin account
  - `[writable]` The deposit accumulate account
  - `[writable]` The PDA account for storing history data
  - `[]` System program

## Accounts

- program: 71pwG39Q9r8T3YKnLZ4KE7vPnLwptJQpkmTRkCU5dRZD
- admin: 2iRVv5L7cA7LMeq7C4wy4MeEUGqSCKoyYSXLAwrG2vFf
