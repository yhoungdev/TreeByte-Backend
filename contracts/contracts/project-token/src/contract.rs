use soroban_sdk::{contract, contractimpl, Env, Address};
use crate::{storage, events, types::DataKey};

#[contract] // Genera el client automáticamente
pub struct FixedToken;

#[contractimpl]
impl FixedToken {
    pub fn init(env: Env, initial_supply: i128) {
        // Prevent multiple initializations
        if env.storage().instance().has(&DataKey::RemainingSupply) {
            panic!("The contract has already been initialized");
        }
        // Set the fixed total supply
        env.storage().instance().set(&DataKey::RemainingSupply, &initial_supply);
    }

    pub fn buy_tokens(env: Env, buyer: Address, amount: i128) {
        buyer.require_auth(); // Require buyer signature

        if amount <= 0 {
            panic!("The purchase amount must be positive");
        }

        // Reduce remaining supply
        storage::spend_remaining(&env, amount);
        // Add to buyer balance
        storage::add_balance(&env, &buyer, amount);
        // Emit event
        events::buy_event(&env, &buyer, amount);
    }

    pub fn get_remaining_supply(env: Env) -> i128 {
        storage::read_remaining_supply(&env)
    }

    pub fn balance(env: Env, addr: Address) -> i128 {
        storage::read_balance(&env, &addr)
    }
}
