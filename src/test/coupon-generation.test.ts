import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock modules with side-effects to avoid opening handles
jest.mock('@/repositories/user.repository', () => ({
  UserRepository: class {
    async findById(id: string) {
      if (id === 'valid-user-id') {
        return { 
          id: 'valid-user-id', 
          email: 'test@example.com', 
          public_key: 'GTESTPUBLICKEYTESTPUBLICKEYTESTPUBKEY12' 
        };
      }
      if (id === 'user-without-wallet') {
        return { id: 'user-without-wallet', email: 'nowallet@example.com' };
      }
      return null;
    }
  },
}));

jest.mock('@/repositories/project.repository', () => ({
  ProjectRepository: class {
    async findById(id: string) {
      if (id === 'valid-project-id') {
        return { 
          id: 'valid-project-id', 
          name: 'Test Project', 
          active: true,
          website_url: 'https://testproject.com'
        };
      }
      if (id === 'inactive-project-id') {
        return { 
          id: 'inactive-project-id', 
          name: 'Inactive Project', 
          active: false
        };
      }
      return null;
    }
  },
}));

jest.mock('@/repositories/purchase.repository', () => ({
  PurchaseRepository: class {
    async findById(id: number) {
      if (id === 123) {
        return { 
          id: 123, 
          user_id: 'valid-user-id',
          project_id: 'valid-project-id',
          amount: 100,
          currency: 'USD'
        };
      }
      if (id === 456) {
        return { 
          id: 456, 
          user_id: 'different-user-id',
          project_id: 'valid-project-id',
          amount: 50,
          currency: 'USD'
        };
      }
      return null;
    }
  },
}));

jest.mock('@/lib/db/supabase-sql-adapter', () => ({
  supabaseSqlAdapter: {
    query: jest.fn(async (sql: string) => {
      if (sql.includes('SELECT * FROM coupons WHERE purchase_id')) {
        return { rows: [] }; // No existing coupon by default
      }
      if (sql.includes('INSERT INTO coupons')) {
        return { 
          rows: [{ 
            id: 'generated-coupon-id',
            user_id: 'valid-user-id',
            project_id: 'valid-project-id',
            purchase_id: 123,
            token_id: '12345',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }] 
        };
      }
      return { rows: [] };
    }),
  },
}));

jest.mock('@/services/stellar', () => ({
  accountService: { accountExists: jest.fn(async () => true) },
  stellarClientService: { getNetworkPassphrase: () => 'Test SDF Network ; September 2015' },
}));

jest.mock('@/lib/soroban/soroban-client', () => ({
  mintCouponOnChain: jest.fn(async () => ({
    tokenId: '12345',
    contractAddress: 'CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4K',
    transactionHash: 'MINT_TX_HASH_12345',
    networkPassphrase: 'Test SDF Network ; September 2015',
    status: 'success'
  })),
}));

jest.mock('@/services/coupon-metadata.service', () => ({
  CouponMetadataService: {
    generateCouponMetadata: jest.fn(() => ({
      name: 'Test Coupon',
      description: 'Test Description',
      image: 'https://example.com/image.jpg',
      external_url: 'https://testproject.com',
      attributes: []
    }))
  }
}));

jest.mock('@/services/coupon-ipfs.service', () => ({
  couponIPFSService: {
    uploadCouponMetadata: jest.fn(async () => ({
      success: true,
      ipfsHash: 'QmTestHash123',
      ipfsUrl: 'https://ipfs.io/ipfs/QmTestHash123'
    }))
  }
}));

jest.mock('@/utils/redemption-code', () => ({
  generateRedemptionCode: jest.fn(async () => 'TESTCODE12345678')
}));

// Create a mock for duplicate coupon test
const mockDuplicateCouponDb = {
  query: jest.fn(async (sql: string) => {
    if (sql.includes('SELECT * FROM coupons WHERE purchase_id')) {
      return { 
        rows: [{ 
          id: 'existing-coupon-id',
          purchase_id: 123,
          user_id: 'valid-user-id'
        }] 
      };
    }
    return { rows: [] };
  }),
};

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

describe('POST /coupon/generate', () => {
  const validPayload = {
    userId: 'valid-user-id',
    projectId: 'valid-project-id',
    purchaseId: 123,
    businessInfo: {
      name: 'Test Business',
      address: '123 Test St',
      region: 'Test Region'
    },
    activityType: 'restaurant',
    expirationDays: 30
  };

  it('returns 400 when payload is missing required fields', async () => {
    const invalidPayload = { userId: 'test' }; // Missing required fields
    
    const response = await request(app)
      .post('/api/coupon/generate')
      .send(invalidPayload)
      .expect(400);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:bad-request',
      status: 400
    });
  });

  it('returns 400 when userId is not a valid UUID', async () => {
    const invalidPayload = { ...validPayload, userId: 'invalid-uuid' };
    
    const response = await request(app)
      .post('/api/coupon/generate')
      .send(invalidPayload)
      .expect(400);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:bad-request',
      status: 400
    });
  });

  it('returns 401 when user is not authorized (no user in request)', async () => {
    const response = await request(app)
      .post('/api/coupon/generate')
      .send(validPayload)
      .expect(401);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:unauthorized',
      status: 401
    });
  });

  it('returns 401 when user tries to generate coupon for different user', async () => {
    const app2 = express();
    app2.use(express.json());
    app2.use((req, _res, next) => {
      (req as any).user = { id: 'different-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app2.use('/api', couponRoutes);

    const response = await request(app2)
      .post('/api/coupon/generate')
      .send(validPayload)
      .expect(401);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:unauthorized',
      status: 401
    });
  });

  it('returns 409 when coupon already exists for purchase', async () => {
    // Mock to return existing coupon
    const { supabaseSqlAdapter } = require('@/lib/db/supabase-sql-adapter');
    supabaseSqlAdapter.query.mockImplementationOnce(async (sql: string) => {
      if (sql.includes('SELECT * FROM coupons WHERE purchase_id')) {
        return { 
          rows: [{ 
            id: 'existing-coupon-id',
            purchase_id: 123,
            user_id: 'valid-user-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }] 
        };
      }
      return { rows: [] };
    });

    const app3 = express();
    app3.use(express.json());
    app3.use((req, _res, next) => {
      (req as any).user = { id: 'valid-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app3.use('/api', couponRoutes);

    const response = await request(app3)
      .post('/api/coupon/generate')
      .send(validPayload)
      .expect(409);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:conflict',
      status: 409
    });
  });

  it('returns 404 when user not found', async () => {
    const app4 = express();
    app4.use(express.json());
    app4.use((req, _res, next) => {
      (req as any).user = { id: 'nonexistent-user' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app4.use('/api', couponRoutes);

    const invalidPayload = { ...validPayload, userId: 'nonexistent-user' };

    const response = await request(app4)
      .post('/api/coupon/generate')
      .send(invalidPayload)
      .expect(404);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:not-found',
      status: 404
    });
  });

  it('returns 404 when user has no wallet', async () => {
    const app5 = express();
    app5.use(express.json());
    app5.use((req, _res, next) => {
      (req as any).user = { id: 'user-without-wallet' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app5.use('/api', couponRoutes);

    const invalidPayload = { ...validPayload, userId: 'user-without-wallet' };

    const response = await request(app5)
      .post('/api/coupon/generate')
      .send(invalidPayload)
      .expect(404);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:not-found',
      status: 404
    });
  });

  it('returns 404 when project not found', async () => {
    const app6 = express();
    app6.use(express.json());
    app6.use((req, _res, next) => {
      (req as any).user = { id: 'valid-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app6.use('/api', couponRoutes);

    const invalidPayload = { ...validPayload, projectId: 'nonexistent-project' };

    const response = await request(app6)
      .post('/api/coupon/generate')
      .send(invalidPayload)
      .expect(404);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:not-found',
      status: 404
    });
  });

  it('returns 404 when project is inactive', async () => {
    const app7 = express();
    app7.use(express.json());
    app7.use((req, _res, next) => {
      (req as any).user = { id: 'valid-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app7.use('/api', couponRoutes);

    const invalidPayload = { ...validPayload, projectId: 'inactive-project-id' };

    const response = await request(app7)
      .post('/api/coupon/generate')
      .send(invalidPayload)
      .expect(404);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:not-found',
      status: 404
    });
  });

  it('returns 401 when purchase does not belong to user', async () => {
    const app8 = express();
    app8.use(express.json());
    app8.use((req, _res, next) => {
      (req as any).user = { id: 'valid-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app8.use('/api', couponRoutes);

    const invalidPayload = { ...validPayload, purchaseId: 456 }; // This purchase belongs to different-user-id

    const response = await request(app8)
      .post('/api/coupon/generate')
      .send(invalidPayload)
      .expect(401);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:unauthorized',
      status: 401
    });
  });

  it('returns 502 when IPFS upload fails', async () => {
    const { couponIPFSService } = require('@/services/coupon-ipfs.service');
    couponIPFSService.uploadCouponMetadata.mockImplementationOnce(async () => ({
      success: false,
      ipfsHash: '',
      ipfsUrl: ''
    }));

    const app9 = express();
    app9.use(express.json());
    app9.use((req, _res, next) => {
      (req as any).user = { id: 'valid-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app9.use('/api', couponRoutes);

    const response = await request(app9)
      .post('/api/coupon/generate')
      .send(validPayload)
      .expect(502);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:bad-gateway',
      status: 502
    });
  });

  it('returns 502 when Soroban mint fails', async () => {
    const { mintCouponOnChain } = require('@/lib/soroban/soroban-client');
    mintCouponOnChain.mockImplementationOnce(async () => {
      throw new Error('Soroban contract failed');
    });

    const app10 = express();
    app10.use(express.json());
    app10.use((req, _res, next) => {
      (req as any).user = { id: 'valid-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app10.use('/api', couponRoutes);

    const response = await request(app10)
      .post('/api/coupon/generate')
      .send(validPayload)
      .expect(502);

    expect(response.body).toMatchObject({
      type: 'urn:problem-type:bad-gateway',
      status: 502
    });
  });

  it('successfully generates coupon with valid input', async () => {
    const app11 = express();
    app11.use(express.json());
    app11.use((req, _res, next) => {
      (req as any).user = { id: 'valid-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app11.use('/api', couponRoutes);

    const response = await request(app11)
      .post('/api/coupon/generate')
      .send(validPayload)
      .expect(201);

    expect(response.body).toMatchObject({
      couponId: expect.any(String),
      tokenId: expect.any(String),
      metadataUrl: expect.any(String),
      expirationDate: expect.any(String),
      redemptionCode: expect.any(String),
      contractAddress: expect.any(String),
      transactionHash: expect.any(String)
    });

    expect(response.body.tokenId).toBe('12345');
    expect(response.body.contractAddress).toBe('CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4K');
    expect(response.body.transactionHash).toBe('MINT_TX_HASH_12345');
  });

  it('uses default expiration days when not specified', async () => {
    const { expirationDays, ...payloadWithoutExpiration } = validPayload;

    const app12 = express();
    app12.use(express.json());
    app12.use((req, _res, next) => {
      (req as any).user = { id: 'valid-user-id' };
      next();
    });
    const couponRoutes = require('@/routes/coupon.routes').default;
    app12.use('/api', couponRoutes);

    const response = await request(app12)
      .post('/api/coupon/generate')
      .send(payloadWithoutExpiration)
      .expect(201);

    expect(response.body.expirationDate).toBeDefined();
    
    // Check that expiration is about 365 days from now (allowing for small time differences)
    const expirationDate = new Date(response.body.expirationDate);
    const expectedDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const timeDifference = Math.abs(expirationDate.getTime() - expectedDate.getTime());
    expect(timeDifference).toBeLessThan(60000); // Within 1 minute
  });
});