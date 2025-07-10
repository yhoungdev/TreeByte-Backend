// src/storage.rs
use soroban_sdk::{Env};
use crate::types::DataKey;

// Reads the balance of an address (returns 0 if not found in storage)
pub fn read_balance(env: &Env, addr: &soroban_sdk::Address) -> i128 {
    let key = DataKey::Balance(addr.clone());
    env.storage().instance().get(&key).unwrap_or(0)  // If no value, return 0
}

// Writes the balance for a given address
fn write_balance(env: &Env, addr: &soroban_sdk::Address, amount: i128) {
    let key = DataKey::Balance(addr.clone());
    env.storage().instance().set(&key, &amount);
}

// Increases the balance of an address by `amount` tokens
pub fn add_balance(env: &Env, addr: &soroban_sdk::Address, amount: i128) {
    let current = read_balance(env, addr);
    write_balance(env, addr, current + amount);
}

/* Decreases the balance of an address by `amount` tokens (e.g., when spending/purchasing)
pub fn spend_balance(env: &Env, addr: &soroban_sdk::Address, amount: i128) {
    let current = read_balance(env, addr);
    if current < amount {
        panic!("Insufficient balance");
    }
    write_balance(env, addr, current - amount);
}
*/

// Reads the remaining supply of tokens to be sold/distributed
pub fn read_remaining_supply(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::RemainingSupply).unwrap_or(0)
}

// Writes the new value for the remaining supply
fn write_remaining_supply(env: &Env, amount: i128) {
    env.storage().instance().set(&DataKey::RemainingSupply, &amount);
}

// Reduces the remaining supply when selling tokens, checking that enough are available
pub fn spend_remaining(env: &Env, amount: i128) {
    let remaining = read_remaining_supply(env);
    if remaining < amount {
        panic!("Not enough tokens available");
    }
    write_remaining_supply(env, remaining - amount);
}
