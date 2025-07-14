#![cfg(test)]
extern crate std;

use crate::contract::{FixedToken, FixedTokenClient};
use soroban_sdk::{Env, Address, testutils::Address as _, String as SorobanString};

#[test]
fn test_token_workflow() {
    let env = Env::default();
    let contract_id = env.register(FixedToken {}, ());
    env.mock_all_auths(); // Mock all auth for tests
    let client = FixedTokenClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    // Define project name, id, issuer, ipfs hash
    let name = SorobanString::from_str(&env, "Bosque Verde");
    let project_id = SorobanString::from_str(&env, "BV-001");
    let ipfs_hash = SorobanString::from_str(&env, "ipfs://bosque-verde-001");
    let issuer = Address::generate(&env);

    client.init(&1000, &name, &project_id, &ipfs_hash, &issuer);
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
    let env = Env::default();
    let contract_id = env.register(FixedToken {}, ());
    env.mock_all_auths();

    let client = FixedTokenClient::new(&env, &contract_id);
    let bob = Address::generate(&env);

    let name = SorobanString::from_str(&env, "Bosque Verde");
    let project_id = SorobanString::from_str(&env, "BV-001");
    let ipfs_hash = SorobanString::from_str(&env, "ipfs://bosque-verde-001");
    let issuer = Address::generate(&env);

    client.init(&1000, &name, &project_id, &ipfs_hash, &issuer);

    // Bob tries to buy more than available supply
    client.buy_tokens(&bob, &1001);
}

#[test]
#[should_panic(expected = "The contract has already been initialized")]
fn test_double_initialization_should_panic() {
    let env = Env::default();
    let contract_id = env.register(FixedToken {}, ());
    env.mock_all_auths();

    let client = FixedTokenClient::new(&env, &contract_id);

    let name = SorobanString::from_str(&env, "Bosque Verde");
    let project_id = SorobanString::from_str(&env, "BV-001");
    let ipfs_hash = SorobanString::from_str(&env, "ipfs://bosque-verde-001");
    let issuer = Address::generate(&env);

    // First initialization
    client.init(&1000, &name, &project_id, &ipfs_hash, &issuer);
    // Second initialization should panic
    client.init(&1000, &name, &project_id, &ipfs_hash, &issuer);
}

#[test]
#[should_panic(expected = "Purchase amount must be positive")]
fn test_buy_zero_tokens_should_panic() {
    let env = Env::default();
    let contract_id = env.register(FixedToken {}, ());
    env.mock_all_auths();

    let client = FixedTokenClient::new(&env, &contract_id);
    let alice = Address::generate(&env);

    let name = SorobanString::from_str(&env, "Bosque Verde");
    let project_id = SorobanString::from_str(&env, "BV-001");
    let ipfs_hash = SorobanString::from_str(&env, "ipfs://bosque-verde-001");
    let issuer = Address::generate(&env);

    client.init(&1000, &name, &project_id, &ipfs_hash, &issuer);

    // Alice tries to buy zero tokens
    client.buy_tokens(&alice, &0);
}

#[test]
fn test_ipfs_hash_retrieval() {
    let env = Env::default();
    let contract_id = env.register(FixedToken {}, ());
    env.mock_all_auths();

    let client = FixedTokenClient::new(&env, &contract_id);

    let name = SorobanString::from_str(&env, "Bosque Verde");
    let project_id = SorobanString::from_str(&env, "BV-001");
    let ipfs_hash = SorobanString::from_str(&env, "ipfs://bosque-verde-001");
    let issuer = Address::generate(&env);

    client.init(&1000, &name, &project_id, &ipfs_hash, &issuer);

    let stored_hash = client.ipfs_hash();
    assert_eq!(stored_hash, ipfs_hash);
}
