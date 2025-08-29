import { Router } from 'express';
import { redeemCouponController } from '@/controllers/coupon.controller';

const router = Router();

// POST /coupon/redeem/:id
router.post('/coupon/redeem/:id', redeemCouponController);

export default router;
