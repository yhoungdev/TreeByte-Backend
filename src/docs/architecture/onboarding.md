
---

# 📘 `onboarding-flow.md`

## 🧭 Overview

The backend onboarding flow for TreeByte enables user registration with flexible authentication methods (OAuth, email), wallet creation via Stellar (external or invisible), and secure secret key handling through encryption and email-based recovery.

The architecture is intentionally off-chain for simplicity and user experience but designed to evolve toward decentralized identity standards (e.g., Soroban identity contracts, DIDs).

---

## 🧩 Step-by-step Breakdown

### 1. **User Registration**

**Endpoint:** `POST /register`

* Accepts `email` and `authMethod` (`email` or `google`).
* Generates a Stellar keypair via `generateKeypair`.
* Returns the `publicKey`, email, and auth method.

---

### 2. **Wallet Creation**

**Endpoint:** `POST /wallet/create`

* If `publicKey` is provided, an **external wallet** is registered.
* If not, an **invisible wallet** is generated:

  * Requires a `passphrase` (minimum 8 characters).
  * The `secretKey` is encrypted using AES-256-CBC.
  * Stored in Supabase under `secret_key_enc`.

---

### 3. **Encrypted Key Recovery**

**Endpoints:**

* `POST /wallet/recovery/export` → Exports the encrypted key (base64).
* `POST /wallet/recovery/send` → Sends it via email as `.txt` attachment.
* `POST /wallet/recovery/recover` → Decrypts using passphrase and returns `publicKey`.

---

### 4. **Transaction History**

**Endpoint:** `POST /transactions`

* Accepts a `publicKey`.
* Returns the 10 most recent transactions using the Stellar Horizon API.

---

## 🧰 Technologies Used

| Component              | Technology / Library                   |
| ---------------------- | -------------------------------------- |
| Backend Framework      | `Express.js`                           |
| Database               | `Supabase` (PostgreSQL + REST API)     |
| Blockchain Integration | `@stellar/stellar-sdk`                 |
| Encryption             | `crypto` module with AES-256-CBC       |
| Email Service          | `nodemailer`                           |
| Logging                | `winston`                              |
| Environment Variables  | `.env` and `dotenv`                    |
| Import Structure       | `@/` alias paths (no relative imports) |

---

## 🔐 Security Measures

| Area                  | Implementation Details                                                                |
| --------------------- | ------------------------------------------------------------------------------------- |
| Secret key encryption | AES-256-CBC using `crypto.createCipheriv` and SHA-256 hashed passphrase as the key    |
| Key recovery          | Optional email backup with attached `.txt` and security notice in HTML email body     |
| Input validation      | Regex for Stellar public key, passphrase length checks, duplicate account checks      |
| Key separation        | `publicKey` stored as plaintext; `secretKey` encrypted and stored as `secret_key_enc` |
| Endpoint protection   | HTTP status codes, error logging, and explicit error messages                         |

---

## ⚖️ Off-chain Design Decisions

* **Wallet ↔ Email Binding:** Handled off-chain for simplicity and minimal UX friction.
* **Key encryption and recovery:** Keeps secret keys encrypted locally and recoverable without blockchain transactions.
* **Hybrid authentication:** Users can register with email or social logins, optionally attach their own wallet.

---

## 🔮 Future Improvements

| Feature Proposal               | Description                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 🧾 Soroban Identity Contracts  | Bind Stellar identity to smart contracts for on-chain account representation                                   |
| 🪪 Decentralized IDs (DIDs)    | Use [DIDs](https://w3c.github.io/did-core/) and [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) |
| 🔗 IPFS Backup Storage         | Host encrypted key backups as verifiable blobs on IPFS                                                         |
| ✅ Session-based Wallet Signing | Use wallet signatures instead of server-based auth/session tokens                                              |

---

## 📁 Code Structure Guidelines

* Use **`kebab-case`** for all file and folder names (`wallet-service.ts`, `recovery.service.ts`).
* Avoid relative imports like `../../utils` – use alias paths like `@/utils/logger`.
* Split code by concern:

  * `controllers/` → Express route handlers
  * `services/` → Business logic (wallet, recovery, Stellar ops)
  * `lib/` → Helpers like Stellar server instance, encryption
  * `config/` → Network config and environment setup

---
