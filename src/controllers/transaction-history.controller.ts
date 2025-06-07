import { Request, Response } from 'express';
import { getTransactionHistory } from '@/services/transaction-history.service';

export const fetchUserTransactionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      res.status(400).json({ error: 'Public key is required' });
      return;
    }

    const history = await getTransactionHistory(publicKey);
    res.status(200).json({ history });
  } catch (error) {
    console.error('❌ Error fetching transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

