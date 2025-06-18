# Wallet-to-Email Relationship Limitations

## Current Status

In the current implementation, the mapping between a user's wallet and their email address is managed **off-chain** using centralized backend infrastructure, specifically a PostgreSQL database. This mapping is required for user authentication and communication, and is handled exclusively by the server.

This setup is functional for the MVP and provides a fast and simple integration path.

## Limitations

### Centralization Risk

All identity resolution (wallet ↔ email) depends on centralized systems. If the database is compromised, this could lead to:

- Identity impersonation (malicious reassignment of wallets or emails).
- Unauthorized access to user data.
- Loss of trust in the system's security model.

### Privacy Risk

Since email addresses and wallet addresses are stored together in a centralized backend, user identity metadata could be:

- Leaked in the event of a breach.
- Correlated without user consent.
- Misused if access control fails.

## Notes for Future Work

This document is intended to highlight the **current limitations**. Future iterations should consider decentralized or trust-minimized approaches for identity resolution.
