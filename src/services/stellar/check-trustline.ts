import { Horizon } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '@/config/stellar-config';

const server = new Horizon.Server(STELLAR_CONFIG.horizonURL);

export const checkTrustline = async ({
  userPublicKey,
  assetCode,
  issuerPublicKey,
}: {
  userPublicKey: string;
  assetCode: string;
  issuerPublicKey: string;
}): Promise<boolean> => {
  try {
    const account = await server.loadAccount(userPublicKey);
    const balances = account.balances;

    return balances.some((balance) => {
      if (
        balance.asset_type === 'credit_alphanum4' ||
        balance.asset_type === 'credit_alphanum12'
      ) {
        return (
          balance.asset_code === assetCode &&
          balance.asset_issuer === issuerPublicKey
        );
      }

      return false; 
    });
  } catch (error) {
    console.error('Error checking trustline:', error);
    return false;
  }
};
