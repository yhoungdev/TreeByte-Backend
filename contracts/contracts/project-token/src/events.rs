use soroban_sdk::{Env, Symbol, Address};

/// Publishes an event when tokens are bought
pub fn buy_event(env: &Env, buyer: &Address, amount: u64) {
    let topics = (Symbol::new(env, "buy_tokens"), buyer.clone());
    env.events().publish(topics, amount);
}
