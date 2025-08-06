import { Asset } from '@stellar/stellar-sdk';
import { 
  walletService, 
  accountService, 
  trustlineService
} from '@/services/stellar';

const USDC_TEST_ISSUER = 'GA5ZSE7FRLNSJ45BPSF2F7DWQUHQIFU6UKX6DS7SHPCKBBZB2DFW6EX'; // emisor de USDC en testnet o ejemplo
const ASSET_CODE = 'USDC';
const PASSPHRASE = 'test-passphrase';

(async () => {
  try {
    // Paso 1: Generar wallet usando el servicio
    console.log('🔐 Generating wallet...');
    const wallet = walletService.generateWallet(PASSPHRASE);
    console.log('→ Public Key:', wallet.publicKey);
    console.log('→ Encrypted Secret:', wallet.encryptedSecret);

    // Paso 2: Fondear en testnet usando el servicio
    console.log('💰 Funding wallet on testnet...');
    await accountService.fundAccount(wallet.publicKey);
    console.log(`✅ Wallet funded: ${wallet.publicKey}`);

    // Wait for account to be created
    console.log('⏳ Waiting for account creation...');
    await accountService.waitForAccount(wallet.publicKey);

    // Paso 3: Verificar si tiene trustline a USDC
    const asset = new Asset(ASSET_CODE, USDC_TEST_ISSUER);
    const hasTrustline = await trustlineService.checkTrustline(wallet.publicKey, asset);
    
    console.log(`🔍 Trustline to ${ASSET_CODE}:`, hasTrustline ? '✅ YES' : '❌ NO');

    // Paso 4: Obtener información de todas las trustlines
    console.log('📋 Getting all trustlines...');
    const allTrustlines = await trustlineService.getAllTrustlines(wallet.publicKey);
    console.log(`Found ${allTrustlines.length} trustlines:`);
    allTrustlines.forEach((trustline, index) => {
      console.log(`${index + 1}. ${trustline.asset_code} - Balance: ${trustline.balance}`);
    });

    // Paso 5: Verificar información específica de la cuenta
    console.log('🔍 Account information:');
    const accountInfo = await accountService.getAccountInfo(wallet.publicKey);
    console.log(`→ Account ID: ${accountInfo.id}`);
    console.log(`→ Sequence: ${accountInfo.sequence}`);
    console.log(`→ Native Balance: ${await accountService.getNativeBalance(wallet.publicKey)} XLM`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();
