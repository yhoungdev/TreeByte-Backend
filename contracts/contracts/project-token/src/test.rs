#![cfg(test)]
use super::{FixedToken, FixedTokenClient};
use soroban_sdk::{Env, Address, String, testutils::Address as _};

#[test]
fn test_token_workflow() {
    let env: Env = Env::default();
    env.mock_all_auths(); // Mock all auth for tests

    let alice: Address = Address::generate(&env);
    let bob: Address = Address::generate(&env);

    let supply: u64 = 1000;
    let name: String = String::from_str(&env, "Bosque Verde");
    let project_id: String = String::from_str(&env, "BV-001");
    let ipfs_hash: String = String::from_str(&env, "ipfs://bosque-verde-001");
    let issuer: Address = Address::generate(&env);

    let contract_id: Address = env.register(FixedToken, (supply, name, project_id, ipfs_hash, &issuer));
    let client: FixedTokenClient<'_> = FixedTokenClient::new(&env, &contract_id);

    assert_eq!(client.get_remaining_supply(), 1000);

    // Alice buys 100 tokens
    client.buy_tokens(&alice, &100);
    assert_eq!(client.balance(&alice), 100);
    assert_eq!(client.get_remaining_supply(), 900);

    // Bob buys 900 tokens
    client.buy_tokens(&bob, &900);
    assert_eq!(client.balance(&bob), 900);
    assert_eq!(client.get_remaining_supply(), 0);
}


#[test]
#[should_panic]
fn test_buy_more_than_remaining_should_panic() {
    let env: Env = Env::default();
    env.mock_all_auths();

    let bob: Address = Address::generate(&env);

    let supply: u64 = 1000;
    let name: String = String::from_str(&env, "Bosque Verde");
    let project_id: String = String::from_str(&env, "BV-001");
    let ipfs_hash: String = String::from_str(&env, "ipfs://bosque-verde-001");
    let issuer: Address = Address::generate(&env);

    let contract_id: Address = env.register(FixedToken, (supply, name, project_id, ipfs_hash, &issuer));
    let client: FixedTokenClient<'_> = FixedTokenClient::new(&env, &contract_id);

    // Bob tries to buy more than available supply
    client.buy_tokens(&bob, &1001);
}

#[test]
#[should_panic(expected = "Purchase amount must be positive")]
fn test_buy_zero_tokens_should_panic() {
    let env: Env = Env::default();
    env.mock_all_auths();

    let alice: Address = Address::generate(&env);

    let supply: u64 = 1000;
    let name: String = String::from_str(&env, "Bosque Verde");
    let project_id: String = String::from_str(&env, "BV-001");
    let ipfs_hash: String = String::from_str(&env, "ipfs://bosque-verde-001");
    let issuer: Address = Address::generate(&env);

    let contract_id: Address = env.register(FixedToken, (supply, name, project_id, ipfs_hash, &issuer));
    let client: FixedTokenClient<'_> = FixedTokenClient::new(&env, &contract_id);

    // Alice tries to buy zero tokens
    client.buy_tokens(&alice, &0);
}

#[test]
fn test_ipfs_hash_retrieval() {
    let env: Env = Env::default();
    env.mock_all_auths();

    let supply: u64 = 1000;
    let name: String = String::from_str(&env, "Bosque Verde");
    let project_id: String = String::from_str(&env, "BV-001");
    let ipfs_hash: String = String::from_str(&env, "ipfs://bosque-verde-001");
    let issuer: Address = Address::generate(&env);

    let contract_id: Address = env.register(FixedToken, (supply, name, project_id, ipfs_hash, &issuer));
    let client: FixedTokenClient<'_> = FixedTokenClient::new(&env, &contract_id);

    let stored_hash: String = client.ipfs_hash();
    assert_eq!(stored_hash, String::from_str(&env, "ipfs://bosque-verde-001"));
}
