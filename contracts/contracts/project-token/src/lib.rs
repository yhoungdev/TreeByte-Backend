#![no_std]
use soroban_sdk::{contract};

// Modules for types, storage logic, event publishing, main contract logic, and tests
mod types;
mod storage;
mod events;
mod contract;    
mod test;        

#[contract]
pub struct FixedToken;
