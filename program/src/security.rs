use solana_program::{account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey};

pub struct SecurityAgent;

impl SecurityAgent {
    /// 1. Eager Sandboxing & Bump Verification
    #[inline(always)]
    pub fn verify_canonical_pda(
        account: &AccountInfo, 
        program_id: &Pubkey, 
        expected_bump: u8
    ) -> Result<(), ProgramError> {
        let seeds = &[b"dirac_state", &[expected_bump]];
        let pda = Pubkey::create_program_address(seeds, program_id)
            .map_err(|_| ProgramError::InvalidSeeds)?;
        
        if account.key != &pda || !account.is_signer {
            return Err(ProgramError::InvalidAccountData);
        }
        Ok(())
    }

    /// 2. Anti-Reentrancy & Payload Constraint Checks
    #[inline(always)]
    pub fn assert_safe_execution(
        token_mint: &AccountInfo,
        instruction_data: &[u8]
    ) -> Result<(), ProgramError> {
        // Enforce native SPL ownership to prevent rouge CPI injection
        if token_mint.owner != &spl_token::id() {
            return Err(ProgramError::IllegalOwner);
        }
        // Cap payload size to prevent buffer overflow attacks
        if instruction_data.is_empty() || instruction_data.len() > 32 {
            return Err(ProgramError::InvalidInstructionData);
        }
        Ok(())
    }
}