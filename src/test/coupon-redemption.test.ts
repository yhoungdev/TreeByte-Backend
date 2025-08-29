import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock modules with side-effects to avoid opening handles
jest.mock('@/repositories/user.repository', () => ({
  UserRepository: class {
    async findById(_id: string) {
      return { id: _id, email: 'test@example.com', public_key: 'GTESTPUBLICKEYTESTPUBLICKEYTESTPUBKEY12' };
    }
  },
}));

jest.mock('@/lib/db/supabase-sql-adapter', () => ({
  supabaseSqlAdapter: {
    query: jest.fn(async () => ({ rows: [] })),
  },
}));

jest.mock('@/services/stellar', () => ({
  accountService: { accountExists: jest.fn(async () => true) },
  stellarClientService: { getNetworkPassphrase: () => 'Test SDF Network ; September 2015' },
}));

jest.mock('@/lib/soroban/soroban-client', () => ({
  validateCouponOnChain: jest.fn(async () => true),
  redeemCouponOnChain: jest.fn(async () => ({ txHash: 'MOCKED_TX', status: 'success', tokenId: '1', redeemer: 'GTEST' })),
}));

// Minimal app for route testing
const app = express();
app.use(express.json());

beforeAll(async () => {
  process.env.NODE_ENV = 'development';
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key-1234567890';
  process.env.STELLAR_NETWORK = 'testnet';
  process.env.JWT_SECRET = 'dev-insecure-jwt-secret-please-change-32+chars';
  process.env.ENCRYPTION_KEY = 'dev-insecure-encryption-key-change-32+chars';
  const couponRoutes = (await import('@/routes/coupon.routes')).default;
  app.use('/api', couponRoutes);
});

afterAll(() => {
  jest.resetModules();
});

describe('POST /coupon/redeem/:id', () => {
  it('returns 400 when invalid payload', async () => {
    const res = await request(app)
      .post('/api/coupon/redeem/not-a-uuid')
      .send({});
    expect(res.status).toBe(400);
  });
});
