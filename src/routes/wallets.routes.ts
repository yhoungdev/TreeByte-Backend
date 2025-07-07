import { Router } from 'express';
const {
  createWallet,
  exportEncryptedKeyHandler,
  sendEncryptedKeyHandler,
  recoverWalletHandler
} = require('../controllers/wallet.controller');

const router = Router();

// 🟢 Wallet creation (external or invisible)
router.post('/create', createWallet);

// 🔐 Wallet recovery (export + email)
router.post('/recovery/export', exportEncryptedKeyHandler);
router.post('/recovery/send', sendEncryptedKeyHandler);
router.post('/recovery/recover', recoverWalletHandler);

export default router;
