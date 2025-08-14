import { config } from 'dotenv';
config();

// --- Configuration and Types ---

/**
 * Interface representing the complete test environment configuration.
 */
interface TestConfig {
  env: 'local' | 'ci';
  db: {
    connectionUrl: string;
    // Add other database-specific configs like user, password, etc.
  };
  stellar: {
    horizonURL: string;
    friendbotURL: string;
    networkPassphrase: string;
    fundingAccountSecret: string;
  };
  timeouts: {
    apiCall: number;
    transactionSubmission: number;
    accountLoad: number;
  };
  retries: {
    maxAttempts: number;
    delayMs: number;
  };
}


export const TEST_CONFIG: TestConfig = {
  env: (process.env.TEST_ENV || 'local') as 'local' | 'ci',
  db: {
   
    connectionUrl: process.env.TEST_DB_URL || 'mongodb://localhost:27017/test_db',
  },
  stellar: {
    horizonURL: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    friendbotURL: process.env.STELLAR_FRIENDBOT_URL || 'https://friendbot.stellar.org',
    networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
   
    fundingAccountSecret: process.env.STELLAR_FUNDING_SECRET || 'YOUR_SECURE_FUNDING_SECRET_KEY_HERE',
  },
  timeouts: {
    apiCall: Number(process.env.TEST_TIMEOUT_API_CALL) || 5000, // 5 seconds
    transactionSubmission: Number(process.env.TEST_TIMEOUT_TX) || 15000, // 15 seconds
    accountLoad: Number(process.env.TEST_TIMEOUT_ACCOUNT_LOAD) || 10000, // 10 seconds
  },
  retries: {
    maxAttempts: Number(process.env.TEST_RETRY_ATTEMPTS) || 5,
    delayMs: Number(process.env.TEST_RETRY_DELAY_MS) || 1000, // 1 second
  },
};
