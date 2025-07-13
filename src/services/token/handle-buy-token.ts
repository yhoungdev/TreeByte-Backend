import { checkTrustline } from '@/services/stellar/check-trustline';

export const handleBuyToken = async ({
  userPublicKey,
  assetCode,
  issuerPublicKey,
  amount,
}: {
  userPublicKey: string;
  assetCode: string;
  issuerPublicKey: string;
  amount: string;
}) => {
  const hasTrustline = await checkTrustline({
    userPublicKey,
    assetCode,
    issuerPublicKey,
  });

  if (!hasTrustline) {
    return {
      success: false,
      error: `User must first create a trustline for ${assetCode}.`,
    };
  }

};
