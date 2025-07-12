**Project Token**

josue1908@Josue:/mnt/c/Tree Byte/TreeByte-Backend/contracts$ stellar contract deploy \        
  --wasm target/wasm32v1-none/release/project_token.wasm \
  --source alice \
  --network testnet \
  --alias project_token
ℹ️ Simulating install transaction…
ℹ️ Signing transaction: 39b1ebab0d46cad8a5b0482c9fd74c43e5114ab53e76cc47beaac80206c7144b      
🌎 Submitting install transaction…
ℹ️ Using wasm hash b7484f5f4541c4eff5fdb878fa01596fe095b9972b659c58d882e5ee750e349a
ℹ️ Simulating deploy transaction…
ℹ️ Transaction hash is c29ee40b253155fab143267e74c79f3037f22202d104bf904343366feb3c1d43       
🔗 https://stellar.expert/explorer/testnet/tx/c29ee40b253155fab143267e74c79f3037f22202d104bf904343366feb3c1d43
ℹ️ Signing transaction: c29ee40b253155fab143267e74c79f3037f22202d104bf904343366feb3c1d43      
🌎 Submitting deploy transaction…
🔗 https://stellar.expert/explorer/testnet/contract/CAODTEVXGOYRTW5MGHA5VSNVPQB2WAUKCKK73VYMW3CALGHQZWHJDO7T
✅ Deployed!
CAODTEVXGOYRTW5MGHA5VSNVPQB2WAUKCKK73VYMW3CALGHQZWHJDO7T
josue1908@Josue:/mnt/c/Tree Byte/TreeByte-Backend/contracts$


**Soulbound Token**

josue1908@Josue:/mnt/c/Tree Byte/TreeByte-Backend/contracts$ stellar contract deploy \
  --wasm target/wasm32v1-none/release/soulbound_token.wasm \
  --source alice \
  --network testnet \
  --alias soulbound_token
ℹ️ Simulating install transaction…
ℹ️ Signing transaction: 362b75c729d95c7122d40dfef9717139c9f7ea9a877b7bf04e5830fd0673548d
🌎 Submitting install transaction…
ℹ️ Using wasm hash 9424d6e3a99a03a29f2e759d8e65b471e481cbb6117acb26f3693361d5865bf3
ℹ️ Simulating deploy transaction…
ℹ️ Transaction hash is 467bb02be203de41328a09a7fb20fb56d860c7dffc6166775a97538452942d38
🔗 https://stellar.expert/explorer/testnet/tx/467bb02be203de41328a09a7fb20fb56d860c7dffc6166775a97538452942d38
ℹ️ Signing transaction: 467bb02be203de41328a09a7fb20fb56d860c7dffc6166775a97538452942d38
🌎 Submitting deploy transaction…
🔗 https://stellar.expert/explorer/testnet/contract/CCZQTLMKA7AKSAY3KJ5WL5RMHZJIGDGVM7N7FCORGFEBINJDHUDI6YD6
✅ Deployed!
CCZQTLMKA7AKSAY3KJ5WL5RMHZJIGDGVM7N7FCORGFEBINJDHUDI6YD6
josue1908@Josue:/mnt/c/Tree Byte/TreeByte-Backend/contracts$ 