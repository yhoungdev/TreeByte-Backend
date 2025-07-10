import { Request, Response } from 'express';
import { validateBuyTokenInput } from '@/validators/buy-token.validator';
import { handleBuyToken } from '@/services/buy-token.service';

export const buyTokenController = async (req: Request, res: Response) => {
  try {
    const { error, value } = validateBuyTokenInput(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const result = await handleBuyToken(value);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};