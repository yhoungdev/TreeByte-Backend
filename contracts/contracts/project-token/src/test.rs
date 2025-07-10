#![cfg(test)]
extern crate std;

use crate::contract::{FixedToken, FixedTokenClient};
use soroban_sdk::{Env, Address, testutils::Address as _};

#[test]
fn test_token_workflow() {
    let env = Env::default();
    let contract_id = env.register(FixedToken {}, ());
    env.mock_all_auths();  // Allow require_auth to always pass in this test
    let client = FixedTokenClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.init(&1000);
    assert_eq!(client.get_remaining_supply(), 1000);

    // Alice buys 100 tokens (authorization automatically simulated)
    client.buy_tokens(&alice, &100);
    assert_eq!(client.balance(&alice), 100);
    assert_eq!(client.get_remaining_supply(), 900);

    // Bob buys 900 tokens (authorization automatically simulated)
    client.buy_tokens(&bob, &900);
    assert_eq!(client.balance(&bob), 900);
    assert_eq!(client.get_remaining_supply(), 0);
}

#[test]
#[should_panic]
fn test_buy_more_than_remaining_should_panic() {
    let env = Env::default();
    let contract_id = env.register(FixedToken {}, ());
    env.mock_all_auths(); // Simulate authorization for this test

    let client = FixedTokenClient::new(&env, &contract_id);
    let bob = Address::generate(&env);

    client.init(&1000);

    // Bob tries to buy more than what is available
    client.buy_tokens(&bob, &1001);
}
