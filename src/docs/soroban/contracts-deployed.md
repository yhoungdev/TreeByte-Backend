**Project Token**

josue1908@Josue:/mnt/c/Tree Byte/TreeByte-Backend/contracts$ stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/project_token.wasm \
  --source alice \
  --network testnet \
  --alias project_token
ℹ️ Skipping install because wasm already installed
ℹ️ Using wasm hash 26b3b7e9cf24fdb9fa97469aad4bee30ab3033f403bdc25b1fce57f96b5d5a9e
ℹ️ Simulating deploy transaction…
ℹ️ Transaction hash is 203299e25ed948e4279cc8ed485452076e25ed64ea0001b56dfc411c1400cbb3
🔗 https://stellar.expert/explorer/testnet/tx/203299e25ed948e4279cc8ed485452076e25ed64ea0001b56dfc411c1400cbb3
ℹ️ Signing transaction: 203299e25ed948e4279cc8ed485452076e25ed64ea0001b56dfc411c1400cbb3
🌎 Submitting deploy transaction…
🔗 https://stellar.expert/explorer/testnet/contract/CACFLZN5UBPWC4N5ERBIIPSTFVCAURHRRIU5MKR3V2VP5KJ2ATX4MFA4
✅ Deployed!
⚠️ Overwriting existing contract id: CDS3DAQXFWQEPPCSIARMINS2K5EWVT7UBIFRPVN5CNXWH3NSDWVHHAX3
CACFLZN5UBPWC4N5ERBIIPSTFVCAURHRRIU5MKR3V2VP5KJ2ATX4MFA4
josue1908@Josue:/mnt/c/Tree Byte/TreeByte-Backend/contracts$ 


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