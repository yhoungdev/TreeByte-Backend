import { Keypair } from '@stellar/stellar-sdk';
import axios from 'axios';
import { encrypt } from '@/utils/encryption';
import { checkTrustline } from '@/services/stellar/check-trustline';

const USDC_TEST_ISSUER = 'GA5ZSE7FRLNSJ45BPSF2F7DWQUHQIFU6UKX6DS7SHPCKBBZB2DFW6EX'; // emisor de USDC en testnet o ejemplo
const ASSET_CODE = 'USDC';
const PASSPHRASE = 'test-passphrase';

function generateStellarWallet(passphrase: string) {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  const encryptedSecret = encrypt(secretKey, passphrase);

  return {
    publicKey,
    encryptedSecret,
    rawSecret: secretKey, // solo para debugging
  };
}

async function fundTestnetWallet(publicKey: string) {
  const url = `https://friendbot.stellar.org/?addr=${publicKey}`;
  try {
    const response = await axios.get(url);
    console.log(`✅ Wallet funded: ${publicKey}`);
    return response.data;
  } catch (err: any) {
    console.error('❌ Error funding wallet in testnet:', err.response?.data || err.message);
    throw err;
  }
}

(async () => {
  // Paso 1: Generar wallet
  const { publicKey, encryptedSecret, rawSecret } = generateStellarWallet(PASSPHRASE);
  console.log('🔐 Wallet generated');
  console.log('→ Public Key:', publicKey);
  console.log('→ Raw Secret:', rawSecret);
  console.log('→ Encrypted Secret:', encryptedSecret);

  // Paso 2: Fondear en testnet
  await fundTestnetWallet(publicKey);

  // Paso 3: Verificar si tiene trustline a USDC
  const result = await checkTrustline({
    userPublicKey: publicKey,
    assetCode: ASSET_CODE,
    issuerPublicKey: USDC_TEST_ISSUER,
  });

  console.log(`🔍 Trustline to ${ASSET_CODE}:`, result ? '✅ YES' : '❌ NO');
})();
