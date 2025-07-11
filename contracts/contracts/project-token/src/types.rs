use soroban_sdk::{contracttype, Address};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Balance(Address),       // Stores individual user balances
    RemainingSupply,        // Remaining tokens available for sale
    ProjectName,            // Project name (string)
    ProjectId,              // Project ID (string, can adapt to u64 if needed)
    IssuerAddress,          // Project issuer's address
}
