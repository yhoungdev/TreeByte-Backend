#![no_std]
extern crate alloc;

use wee_alloc::WeeAlloc;
#[global_allocator]
static ALLOC: WeeAlloc = WeeAlloc::INIT;

pub mod soulbound_token_contract;
#[cfg(test)]
pub mod test;


