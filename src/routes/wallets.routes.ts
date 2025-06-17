import { Router } from 'express';
const { createWallet } = require('../controllers/wallet.controller');

const router = Router();

router.post('/create', createWallet);

export default router;
