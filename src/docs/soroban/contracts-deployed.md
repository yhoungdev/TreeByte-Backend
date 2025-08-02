**Project Token**

`stellar contract deploy --wasm target/wasm32v1-none/release/project_token.wasm --source-account alice --network testnet -- --initial_supply 1000 --project_name "Bosque Verde" --project_id "BV-001" --ipfs_hash "ipfs://bosque-verde-001" --issuer GADGVW7RXKGSXKWRQF2T6VFTQ4K2S2JOYUSZ7V2KVZ6RGLK32GRZXLRA`

ℹ️  Simulating install transaction…
ℹ️  Signing transaction: f1202ad5b2ffba7fd7f11918e770c848040f79b91190f14431ad5ef994c44a78
🌎 Submitting install transaction…
ℹ️  Using wasm hash 7ca2af256b5fcbdbc16a9af229b43e58d7631e13f198de31a7a0240d70aa2239
ℹ️  Simulating deploy transaction…
ℹ️  Transaction hash is 0672c9c404ba9dc89585c0e7643e09a1f79026a93417bd2c70aa178bebb5255f
🔗 https://stellar.expert/explorer/testnet/tx/0672c9c404ba9dc89585c0e7643e09a1f79026a93417bd2c70aa178bebb5255f
ℹ️  Signing transaction: 0672c9c404ba9dc89585c0e7643e09a1f79026a93417bd2c70aa178bebb5255f
🌎 Submitting deploy transaction…
🔗 https://stellar.expert/explorer/testnet/contract/CANSAO7W4JWZE445NXVN34IXMIZ2KZI6YM4HHEE3AZ7U737MC3ZOE67H
✅ Deployed!
CANSAO7W4JWZE445NXVN34IXMIZ2KZI6YM4HHEE3AZ7U737MC3ZOE67H

**Soulbound Token**

josue1908@Josue:/mnt/c/Tree Byte/TreeByte-Backend/contracts$ stellar contract deploy \
  --wasm target/wasm32v1-none/release/soulbound_token.wasm \
  --source alice \
  --network testnet \
  --alias soulbound_token
ℹ️ Skipping install because wasm already installed
ℹ️ Using wasm hash 9424d6e3a99a03a29f2e759d8e65b471e481cbb6117acb26f3693361d5865bf3
ℹ️ Simulating deploy transaction…
ℹ️ Transaction hash is 8ea0c4fed3cb324490f2372ed1820b99f5eb61fdb7b7391317750528cd093484
🔗 https://stellar.expert/explorer/testnet/tx/8ea0c4fed3cb324490f2372ed1820b99f5eb61fdb7b7391317750528cd093484
ℹ️ Signing transaction: 8ea0c4fed3cb324490f2372ed1820b99f5eb61fdb7b7391317750528cd093484
🌎 Submitting deploy transaction…
🔗 https://stellar.expert/explorer/testnet/contract/CBBSSB3UWNUOGEAHG56OPIPBHTUQLOVPV3O4UPWTADQDKJJPQPFHOY4U
✅ Deployed!
⚠️ Overwriting existing contract id: CCZQTLMKA7AKSAY3KJ5WL5RMHZJIGDGVM7N7FCORGFEBINJDHUDI6YD6
CBBSSB3UWNUOGEAHG56OPIPBHTUQLOVPV3O4UPWTADQDKJJPQPFHOY4U
