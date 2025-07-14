use soroban_sdk::{Env, Address, String};
use crate::types::DataKey;

/// Reads the balance of an address (returns 0 if not found in storage)
pub fn read_balance(env: &Env, addr: &Address) -> u64 {
    let key = DataKey::Balance(addr.clone());
    env.storage().instance().get(&key).unwrap_or(0)
}

/// Writes the balance for a given address
fn write_balance(env: &Env, addr: &Address, amount: u64) {
    let key = DataKey::Balance(addr.clone());
    env.storage().instance().set(&key, &amount);
}

/// Increases the balance of an address by `amount` tokens
pub fn add_balance(env: &Env, addr: &Address, amount: u64) {
    let current = read_balance(env, addr);
    write_balance(env, addr, current + amount);
}

/// Reads the remaining token supply
pub fn read_remaining_supply(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::RemainingSupply).unwrap_or(0)
}

/// Writes the new value for remaining supply
fn write_remaining_supply(env: &Env, amount: u64) {
    env.storage().instance().set(&DataKey::RemainingSupply, &amount);
}

/// Reduces the remaining supply by `amount` if enough is available
pub fn spend_remaining(env: &Env, amount: u64) {
    let remaining = read_remaining_supply(env);
    if remaining < amount {
        panic!("Not enough tokens available");
    }
    write_remaining_supply(env, remaining - amount);
}

/// Reads the stored project name
pub fn read_project_name(env: &Env) -> String {
    env.storage().instance().get(&DataKey::ProjectName).unwrap_or(String::from_str(env, ""))
}

/// Reads the stored project ID
pub fn read_project_id(env: &Env) -> String {
    env.storage().instance().get(&DataKey::ProjectId).unwrap_or(String::from_str(env, ""))
}

/// Reads the stored IPFS hash
pub fn read_ipfs_hash(env: &Env) -> String {
    env.storage().instance().get(&DataKey::IpfsHash).unwrap_or(String::from_str(env, ""))
}

/// Reads the stored issuer address
pub fn read_issuer_address(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::IssuerAddress).unwrap()
}
