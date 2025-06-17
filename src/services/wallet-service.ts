import { Keypair } from '@stellar/stellar-sdk';
import { encrypt } from '@/utils/encryption';

export function generateStellarWallet() {
  const keypair = Keypair.random();

  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  const encryptedSecret = encrypt(secretKey); 

  return {
    publicKey,
    encryptedSecret,
  };
}
