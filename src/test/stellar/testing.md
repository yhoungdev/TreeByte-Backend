
## 🧪 TESTING.md — Stellar SDK

### 🌐 Horizon Connection Test

📍 **Path:** `src/test/stellar/test-connection.ts`
💻 **Command:** `npm run test:connection:stellar`
🛠️ **Purpose:** Verifies if the backend can successfully connect to the Stellar testnet Horizon server and fetch the latest ledger.
✅ **Expected result:** Displays the latest ledger number with a success message.
❌ **Failure case:** Network/configuration error; unable to connect to Horizon.
📦 **Script added in package.json:** `test:connection:stellar`

---

