#[cfg(test)]
mod tests {
    use crate::soulbound_token_contract::{SoulboundToken, SoulboundTokenClient};
    use soroban_sdk::{
        Address, Env, symbol_short,
        testutils::{Address as _, Ledger},
    };

    fn setup_contract(env: &Env) -> (SoulboundTokenClient, Address, Address) {
        let contract_id = env.register(SoulboundToken, ());
        let client = SoulboundTokenClient::new(env, &contract_id);

        let issuer = Address::generate(env);
        let user = Address::generate(env);

        env.mock_all_auths();

        client.init(&issuer);

        (client, issuer, user)
    }

    #[test]
    fn test_mint_and_get_token() {
        let env = Env::default();
        env.ledger().with_mut(|l| l.timestamp = 123456789);

        let (client, issuer, user) = setup_contract(&env);
        let token_id = client.mint(&issuer, &user, &symbol_short!("tree"), &10u64);

        let token = client.get_token(&token_id);
        assert_eq!(token.owner, user);
        assert_eq!(token.project_id, symbol_short!("tree"));
        assert_eq!(token.trees_count, 10);
        assert_eq!(token.timestamp, 123456789);
    }

    #[test]
    #[should_panic(expected = "unauthorized")]
    fn test_mint_unauthorized() {
        let env = Env::default();
        let (client, _issuer, user) = setup_contract(&env);

        let attacker = Address::generate(&env);
        client.mint(&attacker, &user, &symbol_short!("tree"), &10u64);
    }

    #[test]
    fn test_get_tokens_by_owner_empty() {
        let env = Env::default();
        let (client, _issuer, user) = setup_contract(&env);


        let tokens = client.get_tokens_by_owner(&user);

        assert_eq!(tokens.len(), 0);
    }

    #[test]
    #[should_panic(expected = "token not found")]
    fn test_get_nonexistent_token_should_panic() {
        let env = Env::default();
        let (client, _issuer, _user) = setup_contract(&env);


        client.get_token(&0); 
    }

    #[test]
    fn test_mint_multiple_users() {
        let env = Env::default();
        let (client, issuer, user1) = setup_contract(&env);
        let user2 = Address::generate(&env);

        client.mint(&issuer, &user1, &symbol_short!("a"), &1u64); // token 0
        client.mint(&issuer, &user2, &symbol_short!("b"), &2u64); // token 1

        let token0 = client.get_token(&0);
        let token1 = client.get_token(&1);

        assert_eq!(token0.owner, user1);
        assert_eq!(token1.owner, user2);

        let user1_tokens = client.get_tokens_by_owner(&user1);
        let user2_tokens = client.get_tokens_by_owner(&user2);

        assert_eq!(user1_tokens.len(), 1);
        assert_eq!(user1_tokens.get(0), Some(0));
        assert_eq!(user2_tokens.len(), 1);
        assert_eq!(user2_tokens.get(0), Some(1));
    }

    #[test]
    fn test_token_id_incrementing() {
        let env = Env::default();
        let (client, issuer, user) = setup_contract(&env);

        let id1 = client.mint(&issuer, &user, &symbol_short!("one"), &1u64);
        let id2 = client.mint(&issuer, &user, &symbol_short!("two"), &2u64);

        assert_eq!(id1, 0);
        assert_eq!(id2, 1);
    }
}
