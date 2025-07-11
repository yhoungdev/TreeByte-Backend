type SimulateBuyParams = {
  buyerAddress: string;
  projectAsset: string;
  amount: number;
};

export const simulateSorobanBuyCall = async ({
  buyerAddress,
  projectAsset,
  amount,
}: SimulateBuyParams) => {
  console.log(`[soroban] Simulating buy_tokens(${amount}) for ${buyerAddress} on asset ${projectAsset}`);

  // Simulación de tx
  return {
    txHash: 'MOCKED_TX_HASH_123456789',
    status: 'success',
    buyer: buyerAddress,
    asset: projectAsset,
    amount,
  };
};