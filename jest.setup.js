// Global test setup
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key-1234567890';
process.env.STELLAR_NETWORK = process.env.STELLAR_NETWORK || 'testnet';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-please-change-32+chars';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-insecure-encryption-key-change-32+chars';
process.env.PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud';

global.console = {
  ...console,
  // Suppress console.log in tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};