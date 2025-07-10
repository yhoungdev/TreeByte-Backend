#![no_std]

use soroban_sdk::{
    contract, contractimpl, Address, Env, Symbol, Vec, String, Map, IntoVal,
    storage::{StorageMap, StorageValue}
};

// Token structure
#[derive(Clone)]
pub struct SoulboundToken {
    pub owner: Address,
    pub project_id: String,
    pub trees_count: u64,
    pub timestamp: u64,
}

// Contract storage keys
const TOKEN_COUNTER: Symbol = Symbol::short("TOKEN_COUNTER");
const TOKENS: Symbol = Symbol::short("TOKENS");
const OWNER_INDEX: Symbol = Symbol::short("OWNER_INDEX");

#[contract]
pub struct SoulboundTokenContract;

#[contractimpl]
impl SoulboundTokenContract {
    pub fn mint(env: Env, owner: Address, project_id: String, trees_count: u64) {
        // Authorization: only a trusted issuer can mint
        let caller = env.invoker();
        assert!(
            is_authorized_issuer(&env, &caller),
            "unauthorized"
        );

        // Get current token ID
        let mut counter: u64 = env
            .storage()
            .get(&TOKEN_COUNTER)
            .unwrap_or(Ok(0u64))
            .unwrap();

        let token_id = counter;

        // Get current timestamp
        let timestamp = env.ledger().timestamp();

        // Create token
        let token = SoulboundToken {
            owner: owner.clone(),
            project_id: project_id.clone(),
            trees_count,
            timestamp,
        };

        // Save token
        let mut token_map: Map<u64, SoulboundToken> = env
            .storage()
            .get(&TOKENS)
            .unwrap_or(Ok(Map::new(&env)))
            .unwrap();
        token_map.set(token_id, token.clone());
        env.storage().set(&TOKENS, &token_map);

        // Index by owner
        let mut index_map: Map<Address, Vec<u64>> = env
            .storage()
            .get(&OWNER_INDEX)
            .unwrap_or(Ok(Map::new(&env)))
            .unwrap();

        let mut owner_tokens = index_map.get(owner.clone()).unwrap_or(Vec::new(&env));
        owner_tokens.push_back(token_id);
        index_map.set(owner, owner_tokens);
        env.storage().set(&OWNER_INDEX, &index_map);

        // Increment counter
        counter += 1;
        env.storage().set(&TOKEN_COUNTER, &counter);
    }

    pub fn get_token(env: Env, token_id: u64) -> (Address, String, u64, u64) {
        let token_map: Map<u64, SoulboundToken> = env
            .storage()
            .get(&TOKENS)
            .unwrap_or(Ok(Map::new(&env)))
            .unwrap();

        let token = token_map.get(token_id).expect("token not found");
        (token.owner, token.project_id, token.trees_count, token.timestamp)
    }

    pub fn get_tokens_by_owner(env: Env, owner: Address) -> Vec<u64> {
        let index_map: Map<Address, Vec<u64>> = env
            .storage()
            .get(&OWNER_INDEX)
            .unwrap_or(Ok(Map::new(&env)))
            .unwrap();

        index_map.get(owner).unwrap_or(Vec::new(&env))
    }
}

fn is_authorized_issuer(env: &Env, caller: &Address) -> bool {
    // Replace this with actual logic
    // For now, allow only a specific hardcoded address (development purposes)
    let authorized = Address::from_contract_id(&env, &[1, 2, 3, 4]);
    caller == &authorized
}


#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    fn create_env() -> (Env, Address) {
        let env = Env::default();
        let issuer = Address::random(&env);
        env.set_invoker(issuer.clone()); // Simula que el issuer llama a la función
        (env, issuer)
    }

    #[test]
    fn test_mint_and_get_token() {
        let (env, issuer) = create_env();
        let user = Address::random(&env);
        let project_id = String::from_str(&env, "reforest-cr");
        let trees = 10;

        // Mint the token
        SoulboundTokenContract::mint(env.clone(), user.clone(), project_id.clone(), trees);

        // Validate token data
        let (owner, proj, count, ts) = SoulboundTokenContract::get_token(env.clone(), 0);
        assert_eq!(owner, user);
        assert_eq!(proj, project_id);
        assert_eq!(count, trees);
        assert!(ts > 0); // Should store a valid timestamp
    }

    #[test]
    fn test_get_tokens_by_owner() {
        let (env, _issuer) = create_env();
        let user1 = Address::random(&env);
        let user2 = Address::random(&env);
        let project_id = String::from_str(&env, "treebyte-1");

        // Mint tokens
        SoulboundTokenContract::mint(env.clone(), user1.clone(), project_id.clone(), 3);
        SoulboundTokenContract::mint(env.clone(), user1.clone(), project_id.clone(), 5);
        SoulboundTokenContract::mint(env.clone(), user2.clone(), project_id.clone(), 1);

        // Validate index by owner
        let tokens1 = SoulboundTokenContract::get_tokens_by_owner(env.clone(), user1.clone());
        assert_eq!(tokens1.len(), 2);
        assert_eq!(tokens1.get(0), Some(0));
        assert_eq!(tokens1.get(1), Some(1));

        let tokens2 = SoulboundTokenContract::get_tokens_by_owner(env.clone(), user2.clone());
        assert_eq!(tokens2.len(), 1);
        assert_eq!(tokens2.get(0), Some(2));
    }

    #[test]
    #[should_panic(expected = "unauthorized")]
    fn test_unauthorized_mint_fails() {
        let env = Env::default();
        let user = Address::random(&env);
        let project_id = String::from_str(&env, "project-x");

        // No invoker set, should panic on auth check
        SoulboundTokenContract::mint(env, user, project_id, 1);
    }
}
