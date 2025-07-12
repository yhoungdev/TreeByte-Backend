🌱 TreeByte Backend – The Engine Behind Reforestation Powered by Web3

This is the backend for **TreeByte**, a platform that transforms your digital footprint into real-world reforestation 🌳. It manages API routes, wallet logic, NFT issuance, metadata generation, and prepares future integrations with Stellar blockchain and IPFS.

---

🧰 Tech Stack

* Node.js + Express
* TypeScript
* Stellar SDK (Testnet-ready)
* Dotenv for environment configuration
* Module-alias for cleaner imports

---

📦 How to clone and run locally

1. Clone the repository:

```bash
git clone https://github.com/Tree-Byte-org/TreeByte-Backend.git
cd TreeByte-Backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a .env file:

```env
PORT=4000
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key

MAIL_USER=your_email@gmail.com
MAIL_PASS=your_email_password_or_app_password
```

4. Apply the database schema automatically:

After adding your Supabase URL and Anon Key, run:

```bash
npx supabase db push
```

✅ This command will create all tables and extensions in your own Supabase project without needing to upload anything manually.

5. Run in development mode:

```bash
npm run dev
```

6. Or build and run in production:

```bash
npm run build
npm start
```

---

🧭 What does this backend handle?

* API endpoints for tree data and purchase flow
* Dynamic wallet management for both Freighter users and invisible accounts
* NFT metadata generation (ready for IPFS)
* Secure environment handling and modular service architecture

---

⚠️ Note for contributors

If new tables are added in future updates, just pull the latest changes and run:

```bash
npx supabase db push
```

again to apply all database updates to your own Supabase project.

---

📬 Contact & Collaborations

Want to contribute, collaborate, or learn more?

📩 [treebyte.web3@gmail.com](mailto:treebyte.web3@gmail.com)
🐦 @GoTreeByte ([https://twitter.com/GoTreeByte](https://twitter.com/GoTreeByte))
