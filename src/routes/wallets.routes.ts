import { Router } from 'express';
import { createWallet } from '../controllers/wallet.controller';

const router = Router();
router.post('/create', createWallet);
export default router;
