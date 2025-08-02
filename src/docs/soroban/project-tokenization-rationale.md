# Project Tokenization with Soroban Smart Contracts

## Overview

TreeByte leverages Soroban smart contracts for project tokenization to ensure trust, transparency, and supply integrity in a decentralized manner. This document explains the technical rationale behind using on-chain smart contracts instead of traditional backend-only approaches.

## Why Smart Contracts Are Essential

### 1. **Trust and Supply Integrity**

Traditional backend-only tokenization approaches suffer from critical trust issues:

- **Backend Manipulation Risk**: A centralized backend could theoretically mint unlimited tokens, manipulate balances, or alter supply without user knowledge
- **Single Point of Failure**: Database corruption, server compromise, or malicious admin actions could destroy token value
- **Lack of Transparency**: Users cannot independently verify token supply, ownership, or transaction history

Soroban contracts solve these issues by:
- **Immutable Supply**: Once deployed, the total supply is fixed and cannot be altered by any party
- **On-chain Verification**: All token operations are publicly verifiable on the Stellar blockchain
- **Decentralized Logic**: Smart contract rules execute autonomously without human intervention

### 2. **Fixed and Immutable Supply**

Our `project-token` contract implements strict supply controls:

```rust
// From contracts/project-token/src/contract.rs
pub fn __constructor(env: Env, initial_supply: u64, project_name: String, project_id: String, ipfs_hash: String, issuer: Address) {
    // Store initial supply - this becomes immutable
    env.storage().instance().set(&DataKey::RemainingSupply, &initial_supply);
    // ... other metadata
}

pub fn buy_tokens(env: Env, buyer: Address, amount: u64) {
    buyer.require_auth(); // Requires buyer signature
    
    if amount == 0 {
        panic!("Purchase amount must be positive");
    }
    
    // Deduct from remaining supply - cannot exceed initial supply
    storage::spend_remaining(&env, amount);
    storage::add_balance(&env, &buyer, amount);
    events::buy_event(&env, &buyer, amount);
}
```

**Key Features:**
- **Initial Supply Lock**: Supply is set once during contract deployment and cannot be modified
- **Remaining Supply Tracking**: Contract maintains accurate count of available tokens
- **Purchase Validation**: Prevents buying more tokens than available supply
- **Atomic Operations**: Token transfers are atomic - either complete or fail entirely

### 3. **Prevention of Backend Manipulation**

Smart contracts eliminate backend manipulation risks:

**Before (Backend-Only Approach):**
```typescript
// Vulnerable to manipulation
const updateTokenBalance = async (userId: number, amount: number) => {
  await db.query('UPDATE balances SET amount = amount + $1 WHERE user_id = $2', [amount, userId]);
  // No verification, no limits, no transparency
};
```

**After (Soroban Contract Approach):**
```typescript
// From src/services/buy-token.service.ts
const txConfirmation = await simulateSorobanBuyCall({
  buyerAddress: user.wallet_address,
  projectAsset: project.asset_code,
  amount,
});
```

**Security Benefits:**
- **No Backend Minting**: Backend cannot create tokens out of thin air
- **Authenticated Operations**: All token operations require user wallet signatures
- **Public Verification**: Every transaction is recorded on-chain and publicly verifiable
- **Immutable Rules**: Contract logic cannot be changed after deployment

### 4. **On-chain Logic for Transparency**

Soroban contracts provide complete transparency:

**Public Verification:**
- **Supply Verification**: Anyone can query `get_remaining_supply()` to verify available tokens
- **Balance Verification**: Anyone can query `balance(address)` to verify user holdings
- **Transaction History**: All purchases are recorded as on-chain events
- **Project Metadata**: Project name, ID, and IPFS hash are publicly accessible

**Event Logging:**
```rust
// From contracts/project-token/src/events.rs
pub fn buy_event(env: &Env, buyer: &Address, amount: u64) {
    env.events().publish(("buy_tokens",), (buyer, amount));
}
```

### 5. **Future Extensibility**

Soroban contracts enable advanced features without compromising security:

#### **Max Tokens Per User**
```rust
// Future implementation
pub fn buy_tokens(env: Env, buyer: Address, amount: u64) {
    buyer.require_auth();
    
    let current_balance = storage::read_balance(&env, &buyer);
    let max_per_user = storage::read_max_per_user(&env);
    
    if current_balance + amount > max_per_user {
        panic!("Exceeds maximum tokens per user");
    }
    
    // ... rest of purchase logic
}
```

#### **Automatic Sale Closure**
```rust
// Future implementation
pub fn buy_tokens(env: Env, buyer: Address, amount: u64) {
    let remaining = storage::read_remaining_supply(&env);
    let closing_threshold = storage::read_closing_threshold(&env);
    
    if remaining <= closing_threshold {
        panic!("Sale is closing - no more purchases allowed");
    }
    
    // ... purchase logic
}
```

#### **KYC Validations**
```rust
// Future implementation
pub fn buy_tokens(env: Env, buyer: Address, amount: u64) {
    let kyc_status = storage::read_kyc_status(&env, &buyer);
    
    if !kyc_status.is_verified {
        panic!("KYC verification required");
    }
    
    // ... purchase logic
}
```

## Technical Implementation

### Contract Architecture

**Project Token Contract:**
- **Location**: `contracts/contracts/project-token/src/contract.rs`
- **Purpose**: Manages project token sales with fixed supply
- **Key Functions**: `buy_tokens()`, `get_remaining_supply()`, `balance()`

**Soulbound Token Contract:**
- **Location**: `contracts/contracts/soulbound-token/src/soulbound_token_contract.rs`
- **Purpose**: Manages non-transferable achievement tokens
- **Key Functions**: `mint()`, `get_token()`, `get_tokens_by_owner()`

### Deployment Process

**Automated Deployment:**
```typescript
// From src/services/soroban-deployment.service.ts
async deployProjectToken(params: ContractDeploymentParams): Promise<ContractDeploymentResult> {
  const contractWasmPath = await this.buildContract();
  const contractAddress = await this.deployContract(contractWasmPath);
  const transactionHash = await this.initializeContract(contractAddress, params);
  
  return { contractAddress, issuerPublicKey: params.issuerPublicKey, transactionHash };
}
```

**Deployment Steps:**
1. **Build**: Compile Rust contract to WASM
2. **Deploy**: Upload WASM to Stellar network
3. **Initialize**: Set initial supply and project metadata
4. **Verify**: Confirm contract deployment and initialization

### Integration with Backend

**Purchase Flow:**
```typescript
// From src/services/buy-token.service.ts
export const handleBuyToken = async ({ project_id, user_id, amount }: BuyTokenParams) => {
  // 1. Validate project and user
  const project = await getProject(project_id);
  const user = await getUser(user_id);
  
  // 2. Execute on-chain purchase
  const txConfirmation = await simulateSorobanBuyCall({
    buyerAddress: user.wallet_address,
    projectAsset: project.asset_code,
    amount,
  });
  
  // 3. Record purchase in database
  const purchase = await recordPurchase(user_id, project_id, amount);
  
  return { message: 'Token purchase successful', transaction: txConfirmation, purchase };
};
```

## Benefits Summary

| Aspect | Backend-Only | Soroban Smart Contracts |
|--------|-------------|------------------------|
| **Supply Integrity** | ❌ Vulnerable to manipulation | ✅ Immutable and verifiable |
| **Transparency** | ❌ Opaque operations | ✅ Public and auditable |
| **Trust** | ❌ Requires trust in backend | ✅ Trustless execution |
| **Security** | ❌ Single point of failure | ✅ Decentralized and secure |
| **Extensibility** | ❌ Limited by backend constraints | ✅ Programmable and flexible |

## Conclusion

Soroban smart contracts provide the foundation for trustworthy, transparent, and secure project tokenization in TreeByte. By moving critical token logic on-chain, we eliminate trust requirements, ensure supply integrity, and create a foundation for advanced features while maintaining user confidence in the platform.

The combination of immutable supply, public verification, and programmable logic makes Soroban contracts the ideal solution for project tokenization, enabling TreeByte to build a truly decentralized and trustworthy ecosystem for environmental project funding. 