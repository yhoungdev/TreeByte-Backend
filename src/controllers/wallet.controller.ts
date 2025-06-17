import express from 'express';
import db from '@/lib/db/db';
import { generateStellarWallet } from '@/services/wallet-service';

export const createWallet = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { email, publicKey } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const { data: existing, error: existingError } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      // PGRST116 = no rows found (Supabase)
      console.error(existingError);
      return res.status(500).json({ error: 'Error checking existing wallet' });
    }

    if (existing) {
      return res.status(409).json({ error: 'Wallet already exists for this email' });
    }

    // External wallet (e.g., Freighter)
    if (publicKey) {
      if (!/^G[A-Z2-7]{55}$/.test(publicKey)) {
        return res.status(400).json({ error: 'Invalid publicKey format' });
      }

      const { error: insertError } = await db.from('users').insert([
        {
          email,
          public_key: publicKey,
          secret_key_enc: null,
          auth_method: 'freighter',
        },
      ]);

      if (insertError) {
        console.error(insertError);
        return res.status(500).json({ error: 'Error inserting external wallet' });
      }

      return res.status(201).json({ publicKey, source: 'external' });
    }

    // Invisible wallet (generated)
    const { publicKey: newPublicKey, encryptedSecret } = generateStellarWallet();

    const { error: insertGeneratedError } = await db.from('users').insert([
      {
        email,
        public_key: newPublicKey,
        secret_key_enc: encryptedSecret,
        auth_method: 'invisible',
      },
    ]);

    if (insertGeneratedError) {
      console.error(insertGeneratedError);
      return res.status(500).json({ error: 'Error inserting generated wallet' });
    }

    return res.status(201).json({ publicKey: newPublicKey, source: 'generated' });
  } catch (error) {
    console.error('Wallet creation failed', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
