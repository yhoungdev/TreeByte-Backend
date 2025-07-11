import { Request, Response, NextFunction } from 'express';
import { validateBuyTokenInput } from '@/validators/buy-token.validator';
import { handleBuyToken } from '@/services/buy-token.service';

export const buyTokenController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, value } = validateBuyTokenInput(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }

    const result = await handleBuyToken(value);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    next(err);
  }
};
