# Logic explanation

- **constructor**: Initializes the contract with a fixed `initial_supply`. It stores the initial supply as the remaining supply (since at the start no token has been distributed).  
  _(If desired, we could additionally store a `TotalSupply` field with the same value or register an admin. In this basic example, it is not mandatory.)_

- **buy_tokens**: Allows the invoking account (`env.invoker()`) to buy a certain amount of tokens specified by `amount`. First, it validates that `amount` is positive (no negative or zero amounts allowed). Then, it calls `storage::spend_remaining` to deduct this amount from the remaining supply, ensuring internally that enough tokens are available. After that, it updates the buyer's balance using `storage::add_balance`. Finally, it emits an on-chain event of type `"buy_tokens"` via `events::buy_event` to record the purchase transaction.  
  **Important:** We do not require explicit authentication here (`buyer.require_auth()`) because we assume the call comes from the buyer itself (contract invocation already requires the caller's signature). If this function allowed specifying a different recipient, then we would use `require_auth` to ensure that no one transfers tokens to another account without permission. In this design, `buyer` is always the signing account, so no additional authorization is needed.

- **get_remaining_supply**: Returns the number of tokens not yet distributed, by reading directly from storage. This allows anyone to check how many tokens remain available for purchase from the fixed supply.

- **balance**: Returns the token balance of a given address. Although it was not explicitly required in the question, it is common to provide this function in token contracts so users can check how many tokens they own. It follows the same pattern as previous functions, using our storage function to read the balance. (For an address without a storage entry, `read_balance` returns 0.)
