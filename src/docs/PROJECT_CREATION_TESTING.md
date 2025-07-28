# Project Creation with Soroban Integration - Testing Guide

This guide explains how to test the integrated project creation flow with Soroban contract deployment.

## Prerequisites

Before testing, ensure you have:

1. **Soroban CLI installed and configured**:
   ```bash
   # Install Soroban CLI
   cargo install --locked soroban-cli
   
   # Configure testnet
   soroban config network add testnet --rpc-url https://soroban-testnet.stellar.org:443
   
   # Create/import a test account
   soroban config identity generate default
   soroban config identity fund default --network testnet
   ```

2. **Environment variables configured**:
   Create a `.env` file in the project root:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_key
   PORT=3000
   ```

3. **Database setup**:
   ```bash
   # Run migrations
   npm run supabase:migrate
   ```

4. **Dependencies installed**:
   ```bash
   npm install
   ```

## Testing Methods

### Method 1: Integration Test (Recommended)

Run the automated integration test:

```bash
# Run the integration test
npm run test:project-creation

# Or run directly with ts-node
npx ts-node -r tsconfig-paths/register src/test/project-creation-integration.test.ts
```

The test will:
- Create a test project with sample data
- Deploy a Soroban contract
- Store project data in the database
- Display all results including contract address and transaction hash

**Expected Output:**
```
Testing project creation with Soroban contract deployment...
Project created successfully:
- Project ID: 12345678-1234-1234-1234-123456789abc
- Contract Address: CBTQ4ZS7DJFP2MXQG3KXVQK4Z7DJFP2MXQG3KXVQK4Z7DJFP2MXQG3KXV
- Issuer Public Key: GCKFBEIYTKP74Q7EFI2Q5BZRYWEXMMH2EK2LI7UNG5X6QKJMMRJ6MQM3
- Transaction Hash: 1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12
- IPFS Hash: QmXyZ123...
- IPFS URL: https://gateway.pinata.cloud/ipfs/QmXyZ123...
Integration test completed successfully!
```

### Method 2: API Testing with Postman

#### Setup Postman Collection

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Create a new POST request**:
   - **URL**: `http://localhost:3000/api/projects/register`
   - **Method**: `POST`
   - **Headers**:
     ```
     Content-Type: application/json
     ```

3. **Request Body** (JSON):
   ```json
   {
     "name": "Green Energy Initiative",
     "description": "A renewable energy project focused on solar panel installation in rural communities",
     "location": "Costa Rica, Central America",
     "photo_url": "https://example.com/solar-panels.jpg",
     "impact": "Providing clean energy to 500+ families, reducing CO2 emissions by 2000 tons/year",
     "asset_code": "GREEN",
     "issuer_public_key": "GCKFBEIYTKP74Q7EFI2Q5BZRYWEXMMH2EK2LI7UNG5X6QKJMMRJ6MQM3",
     "supply": 1000000
   }
   ```

#### Expected Response

**Success Response (201 Created)**:
```json
{
  "message": "Project registered successfully",
  "data": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "name": "Green Energy Initiative",
    "description": "A renewable energy project focused on solar panel installation in rural communities",
    "location": "Costa Rica, Central America",
    "photo_url": "https://example.com/solar-panels.jpg",
    "impact": "Providing clean energy to 500+ families, reducing CO2 emissions by 2000 tons/year",
    "asset_code": "GREEN",
    "issuer_public_key": "GCKFBEIYTKP74Q7EFI2Q5BZRYWEXMMH2EK2LI7UNG5X6QKJMMRJ6MQM3",
    "supply": 1000000,
    "ipfs_hash": "QmXyZ123456789abcdef...",
    "ipfs_url": "https://gateway.pinata.cloud/ipfs/QmXyZ123456789abcdef...",
    "contract_id": "CBTQ4ZS7DJFP2MXQG3KXVQK4Z7DJFP2MXQG3KXVQK4Z7DJFP2MXQG3KXV",
    "transaction_hash": "1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12",
    "contract_address": "CBTQ4ZS7DJFP2MXQG3KXVQK4Z7DJFP2MXQG3KXVQK4Z7DJFP2MXQG3KXV",
    "created_at": "2025-07-28T19:00:00.000Z",
    "updated_at": "2025-07-28T19:00:00.000Z"
  }
}
```

**Error Response (500 Internal Server Error)**:
```json
{
  "error": "Project registration failed: Contract deployment error - Failed to deploy contract: ..."
}
```

### Method 3: cURL Testing

```bash
curl -X POST http://localhost:3000/api/projects/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ocean Cleanup Project",
    "description": "Initiative to remove plastic waste from ocean waters",
    "location": "Pacific Ocean",
    "photo_url": "https://example.com/ocean-cleanup.jpg",
    "impact": "Removing 10,000 tons of plastic waste annually",
    "asset_code": "OCEAN",
    "issuer_public_key": "GCKFBEIYTKP74Q7EFI2Q5BZRYWEXMMH2EK2LI7UNG5X6QKJMMRJ6MQM3",
    "supply": 500000
  }'
```

## Verifying Contract Deployment

After successful project creation, you can verify the contract deployment:

### 1. Check Contract on Stellar Explorer

Visit: `https://stellar.expert/explorer/testnet/contract/{CONTRACT_ADDRESS}`

Replace `{CONTRACT_ADDRESS}` with the returned contract address.

### 2. Query Contract Functions

```bash
# Get remaining supply
soroban contract invoke \
  --id {CONTRACT_ADDRESS} \
  --network testnet \
  --source-account default \
  -- get_remaining_supply

# Get project name
soroban contract invoke \
  --id {CONTRACT_ADDRESS} \
  --network testnet \
  --source-account default \
  -- project_name

# Get issuer address
soroban contract invoke \
  --id {CONTRACT_ADDRESS} \
  --network testnet \
  --source-account default \
  -- issuer_address
```

### 3. Test Token Purchase

```bash
# Buy tokens (replace ADDRESS with your test account)
soroban contract invoke \
  --id {CONTRACT_ADDRESS} \
  --network testnet \
  --source-account default \
  -- buy_tokens \
  --buyer {YOUR_STELLAR_ADDRESS} \
  --amount 100

# Check balance
soroban contract invoke \
  --id {CONTRACT_ADDRESS} \
  --network testnet \
  --source-account default \
  -- balance \
  --addr {YOUR_STELLAR_ADDRESS}
```

## Troubleshooting

### Common Issues

1. **"soroban command not found"**:
   - Install Soroban CLI: `cargo install --locked soroban-cli`
   - Ensure Rust is installed: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

2. **"Account not funded"**:
   - Fund your test account: `soroban config identity fund default --network testnet`

3. **"Contract build failed"**:
   - Ensure Rust wasm target is installed: `rustup target add wasm32-unknown-unknown`
   - Check that contract path exists: `contracts/contracts/project-token/`

4. **"IPFS upload failed"**:
   - Verify Pinata API credentials in `.env`
   - Check internet connection

5. **"Database insertion error"**:
   - Verify Supabase credentials
   - Ensure migrations have been run
   - Check that the `projects` table exists

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=* npm run dev
```

Or add logging to the service files to trace execution.

## Performance Notes

- Contract deployment typically takes 10-30 seconds
- IPFS upload usually completes in 5-15 seconds
- Total project creation time: 15-45 seconds
- The process is atomic - if any step fails, no partial data is saved

## Next Steps

After successful testing:
1. Configure production Stellar network endpoints
2. Set up monitoring for contract deployments
3. Implement retry mechanisms for failed deployments
4. Add contract upgrade capabilities
5. Set up automated testing in CI/CD pipeline