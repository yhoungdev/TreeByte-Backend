import { Router } from 'express';
import { buyTokenController } from '@/controllers/buy-token.controller';

const router = Router();

router.post('/buy-token', buyTokenController);

export default router;
