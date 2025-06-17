import { Router } from 'express';
const { createWallet } = require('../controllers/wallet.controller');

const router = Router();
console.log('[router] Wallet routes loaded');

router.post('/create', createWallet);
console.log('[router] Wallet routes loaded');

export default router;
