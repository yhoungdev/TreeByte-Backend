#![cfg(test)]

use soroban_sdk::{
    testutils::Address as _,
    symbol_short, Address, Env,
};
use soroban_sdk::testutils::Ledger;
use crate::soulbound_token_contract::{SoulboundToken, SoulboundTokenClient, TokenMetadata};


fn setup_contract(env: &Env) -> (SoulboundTokenClient, Address, Address) {
    // Register the contract implementation in memory
    let contract_id = env.register_contract(None, SoulboundToken);
    let client = SoulboundTokenClient::new(env, &contract_id);

    // Generate issuer and user
    let issuer = Address::generate(env);
    let user = Address::generate(env);

    // Mock auths so all require_auth passes
    env.mock_all_auths();

    // Initialize the contract
    client.init(&issuer);

    (client, issuer, user)
}

#[test]
fn test_mint_and_get_token() {
    let env = Env::default();

    // Set a fixed timestamp
    env.ledger().with_mut(|ledger| {
        ledger.timestamp = 123456789;
    });

    let (client, issuer, user) = setup_contract(&env);

    // Call mint
    client.mint(&issuer, &user, &symbol_short!("tree"), &10u64);

    // Get and validate the token
    let token = client.get_token(&0);
    assert_eq!(token.owner, user);
    assert_eq!(token.project_id, symbol_short!("tree"));
    assert_eq!(token.trees_count, 10);
    assert_eq!(token.timestamp, 123456789);
}
