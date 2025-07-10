// src/events.rs
use soroban_sdk::{Env, Symbol, Address};

// Event for a token purchase: records the buyer and the amount
pub fn buy_event(env: &Env, buyer: &Address, amount: i128) {
    let topics = (Symbol::new(env, "buy_tokens"), buyer.clone());  // event topics
    env.events().publish(topics, amount);
}
