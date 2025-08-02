use super::{FixedToken, FixedTokenClient};
use soroban_sdk::{contractimpl, Env, Address, String};
use crate::{storage, events, types::DataKey, FixedTokenArgs};

#[contractimpl]
impl FixedToken {
    /// Initializes the contract with fixed supply, project name, id, and issuer
    pub fn __constructor(env: Env, initial_supply: u64, project_name: String, project_id: String, ipfs_hash: String, issuer: Address) {
        // Store initial supply and project metadata
        env.storage().instance().set(&DataKey::IssuerAddress, &issuer);
        env.storage().instance().set(&DataKey::RemainingSupply, &initial_supply);
        env.storage().instance().set(&DataKey::ProjectName, &project_name);
        env.storage().instance().set(&DataKey::ProjectId, &project_id);
        env.storage().instance().set(&DataKey::IpfsHash, &ipfs_hash);
    }

    /// Allows a buyer to purchase tokens if enough remain
    pub fn buy_tokens(env: Env, buyer: Address, amount: u64) {
        buyer.require_auth(); // Requires buyer signature

        if amount == 0 {
            panic!("Purchase amount must be positive");
        }

        // Deduct from remaining supply and credit to buyer balance
        storage::spend_remaining(&env, amount);
        storage::add_balance(&env, &buyer, amount);
        events::buy_event(&env, &buyer, amount);
    }

    /// Returns remaining supply
    pub fn get_remaining_supply(env: Env) -> u64 {
        storage::read_remaining_supply(&env)
    }

    /// Returns the balance of a specific address
    pub fn balance(env: Env, addr: Address) -> u64 {
        storage::read_balance(&env, &addr)
    }

    /// Returns the project name
    pub fn project_name(env: Env) -> String {
        storage::read_project_name(&env)
    }

    /// Returns the project id
    pub fn project_id(env: Env) -> String {
        storage::read_project_id(&env)
    }

    /// Returns the stored IPFS hash
    pub fn ipfs_hash(env: Env) -> String {
        storage::read_ipfs_hash(&env)
    }

    /// Returns the issuer address
    pub fn issuer_address(env: Env) -> Address {
        storage::read_issuer_address(&env)
    }
}
