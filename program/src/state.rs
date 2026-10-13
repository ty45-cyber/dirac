use bytemuck::{Pod, Zeroable};

pub const SCALE: i64 = 1_000_000_000;
pub const DIRAC_MAGIC: u64 = 0x4449524143; 
pub const RING_BUFFER_CAPACITY: usize = 1024;

#[repr(C, align(8))]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct DiracState {
    pub magic: u64,                 
    pub admin: [u8; 32],            
    pub base_mint: [u8; 32],        
    pub quote_mint: [u8; 32],       
    pub mid_price: u64,             
    pub inventory_q: i64,           
    pub risk_aversion_gamma: u64,   
    pub volatility_sigma_sq: u64,   
    pub tick_bit_map: [u64; 256],   
}

#[repr(C, align(8))]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct TradeEvent {
    pub price: u64,                 
    pub size: u64,                  
    pub timestamp: i64,             
    pub is_buy: u8,                 
    pub _padding: [u8; 7],          
}

#[repr(C, align(8))]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct EventRingBuffer {
    pub head_sequence: u64,                                 
    pub events: [TradeEvent; RING_BUFFER_CAPACITY],         
}