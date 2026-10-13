use crate::state::{DiracState, DIRAC_MAGIC, SCALE};
use bytemuck::try_from_bytes_mut;
use solana_program::program_error::ProgramError;
use std::mem::size_of;

impl DiracState {
    /// 1. O(1) Zero-Copy Cast & Validation
    #[inline(always)]
    pub fn load_mut(data: &mut [u8]) -> Result<&mut Self, ProgramError> {
        let size = size_of::<Self>();
        if data.len() < size { return Err(ProgramError::AccountDataTooSmall); }
        
        let state = try_from_bytes_mut::<Self>(&mut data[..size])
            .map_err(|_| ProgramError::InvalidAccountData)?;
            
        if state.magic != 0 && state.magic != DIRAC_MAGIC { 
            return Err(ProgramError::InvalidAccountData); 
        }
        Ok(state)
    }

    /// 2. Atomic Avellaneda-Stoikov Engine & Tick Execution
    #[inline(always)]
    pub fn match_order(&mut self, incoming_price: u64, is_buy: bool) -> bool {
        // Reservation Price Calculation (Fixed Point)
        let inventory_penalty = self.inventory_q
            .checked_mul(self.risk_aversion_gamma as i64).unwrap_or(0)
            .checked_mul(self.volatility_sigma_sq as i64).unwrap_or(0)
            .checked_div(SCALE * SCALE).unwrap_or(0);
            
        let r_price = (self.mid_price as i64).checked_sub(inventory_penalty).unwrap_or(self.mid_price as i64) as u64;
        
        // First-order Taylor Expansion Spread Approximation
        let base_spread = self.risk_aversion_gamma
            .checked_mul(self.volatility_sigma_sq).unwrap_or(0)
            .checked_div(SCALE as u64).unwrap_or(0);
        let depth_adjustment = (2 * SCALE as u64).checked_div(self.risk_aversion_gamma).unwrap_or(0);
        let spread = base_spread.checked_add(depth_adjustment).unwrap_or(0);

        // Crossing Logic
        let valid_cross = if is_buy {
            incoming_price >= r_price.checked_add(spread / 2).unwrap_or(u64::MAX)
        } else {
            incoming_price <= r_price.checked_sub(spread / 2).unwrap_or(0)
        };

        if valid_cross { self.inventory_q += if is_buy { -1 } else { 1 }; }
        valid_cross
    }
}