import { Router, Request, Response } from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import crypto from 'crypto';

const router = Router();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; 
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

router.post('/wallet/create', (_req: Request, res: Response): void => {
  try {
    const pair = Keypair.random();
    const publicKey = pair.publicKey();
    const secretKey = pair.secret();
    const encryptedSecret = encrypt(secretKey);



    res.status(201).json({ publicKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wallet.' });
  }
});

export default router;