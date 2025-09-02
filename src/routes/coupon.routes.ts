import { Router } from 'express';
import { generateCouponController, redeemCouponController } from '@/controllers/coupon.controller';
import { handleHttpError } from '@/utils/http-errors';
import { mockAuthMiddleware } from '@/middleware/mock-auth';
import { mockDataMiddleware } from '@/middleware/mock-data';

const router = Router();

// POST /coupon/generate (con mocks para testing)
router.post('/coupon/generate', mockAuthMiddleware, mockDataMiddleware, generateCouponController);

// POST /coupon/redeem/:id
router.post('/coupon/redeem/:id', redeemCouponController);

// Error handling middleware
router.use(handleHttpError);

export default router;
