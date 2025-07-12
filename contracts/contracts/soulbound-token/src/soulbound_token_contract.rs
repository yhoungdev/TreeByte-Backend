extern crate alloc;

use soroban_sdk::*;

#[derive(Clone, Debug)]
#[contracttype]
pub struct TokenMetadata {
    pub owner: Address,
    pub project_id: Symbol,
    pub trees_count: u64,
    pub timestamp: u64,
}

#[contract]
pub struct SoulboundToken;

#[contractimpl]
impl SoulboundToken {
    pub fn init(env: Env, issuer: Address) {
        env.storage()
            .instance()
            .set(&symbol_short!("issuer"), &issuer);
    }

    pub fn mint(
        env: Env,
        caller: Address,
        to: Address,
        project_id: Symbol,
        trees_count: u64,
    ) -> u64 {
        caller.require_auth();

        let issuer: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("issuer"))
            .expect("issuer not set");

        if caller != issuer {
            panic!("unauthorized");
        }

        let token_id: u64 = env
            .storage()
            .instance()
            .get(&symbol_short!("next_id"))
            .unwrap_or(0);

        let metadata = TokenMetadata {
            owner: to.clone(),
            project_id,
            trees_count,
            timestamp: env.ledger().timestamp(),
        };

        env.storage()
            .instance()
            .set(&Self::token_key(&env, token_id), &metadata);

        let mut owner_tokens: Vec<u64> = env
            .storage()
            .instance()
            .get(&Self::owner_key(&env, &to))
            .unwrap_or(Vec::new(&env));

        owner_tokens.push_back(token_id);

        env.storage()
            .instance()
            .set(&Self::owner_key(&env, &to), &owner_tokens);

        env.storage()
            .instance()
            .set(&symbol_short!("next_id"), &(token_id + 1));

        token_id
    }

    pub fn get_token(env: Env, token_id: u64) -> TokenMetadata {
        env.storage()
            .instance()
            .get(&Self::token_key(&env, token_id))
            .expect("token not found")
    }

    pub fn get_tokens_by_owner(env: Env, owner: Address) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&Self::owner_key(&env, &owner))
            .unwrap_or(Vec::new(&env))
    }

    fn token_key(_env: &Env, token_id: u64) -> (Symbol, u64) {
        (symbol_short!("token"), token_id)
    }

    fn owner_key(_env: &Env, owner: &Address) -> (Symbol, Address) {
        (symbol_short!("owner"), owner.clone())
    }
}
