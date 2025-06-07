
## 🧪 TESTING.md — Stellar SDK

### 🌐 Horizon Connection Test

📍 **Path:** `src/test/stellar/test-connection.ts`
💻 **Command:** `npm run test:connection:stellar`
🛠️ **Purpose:** Verifies if the backend can successfully connect to the Stellar testnet Horizon server and fetch the latest ledger.
✅ **Expected result:** Displays the latest ledger number with a success message.
❌ **Failure case:** Network/configuration error; unable to connect to Horizon.
📦 **Script added in package.json:** `test:connection:stellar`

---

### 💸 Transaction Build Test

📍 **Path:** `src/test/stellar/test-transaction-skeleton.ts`
💻 **Command:** `npx ts-node -r tsconfig-paths/register src/test/stellar/test-transaction-skeleton.ts`
🛠️ **Purpose:** Validates the ability to load an existing Stellar account and build a transaction skeleton using the `TransactionBuilder` from the SDK.
✅ **Expected result:** Successfully logs that the account was loaded and shows a built transaction (not signed or submitted).
❌ **Failure case:** Returns an error if the account doesn't exist or if base fee fetching fails.
📎 **Note:** This test does not sign or submit the transaction; it only builds and logs the XDR for inspection.
🔑 **Requirement:** A valid source public key on the Stellar testnet (with at least 1 XLM balance).

---