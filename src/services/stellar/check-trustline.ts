import { Asset } from '@stellar/stellar-sdk';
import { trustlineService } from '@/services/stellar';

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
    const asset = new Asset(assetCode, issuerPublicKey);
    return await trustlineService.checkTrustline(userPublicKey, asset);
  } catch (error) {
    console.error('Error checking trustline:', error);
    return false;
  }
};
