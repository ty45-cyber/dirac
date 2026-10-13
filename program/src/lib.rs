#![forbid(arithmetic_overflow)]

pub mod loader;
pub mod security;
pub mod state;

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    program_error::ProgramError,
};
use state::DiracState;
use security::SecurityAgent;

entrypoint!(process_instruction);

/// 1. Fail-Fast Execution Pipeline
#[inline(always)]
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Immediate payload constraint check (Phase 4 Security)
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    let account_info_iter = &mut accounts.iter();
    let pda_account = next_account_info(account_info_iter)?;
    
    // Instruction 0: Initialize Zero-Copy State
    // Instruction 1: Process Atomic Trade
    match instruction_data[0] {
        0 => initialize_market(program_id, pda_account, instruction_data),
        1 => process_trade(program_id, pda_account, instruction_data),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

/// 2. Atomic Trade Processor (Phases 1, 2, & 3 combined)
#[inline(always)]
fn process_trade(
    program_id: &Pubkey,
    pda_account: &AccountInfo,
    instruction_data: &[u8]
) -> ProgramResult {
    // Eager sandboxing validation before memory mapping
    let expected_bump = instruction_data.get(1).copied().unwrap_or(0);
    SecurityAgent::verify_canonical_pda(pda_account, program_id, expected_bump)?;

    // O(1) Zero-copy memory cast
    let mut data = pda_account.data.borrow_mut();
    let state = DiracState::load_mut(&mut data)?;

    // Parse incoming trade data (Price: bytes 2-9, IsBuy: byte 10)
    let incoming_price = u64::from_le_bytes(instruction_data[2..10].try_into().unwrap());
    let is_buy = instruction_data.get(10).copied().unwrap_or(0) == 1;

    // Thermodynamic execution logic
    if !state.match_order(incoming_price, is_buy) {
        msg!("Order crossed beyond dynamic risk reservation limits");
        return Err(ProgramError::Custom(1)); // Spread tolerance exceeded
    }

    Ok(())
}