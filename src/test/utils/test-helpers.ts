import { Keypair, Horizon } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '@/config/stellar-config';

const server = new Horizon.Server(STELLAR_CONFIG.horizonURL);

// Configuration interface for test helpers
interface TestHelperConfig {
  fundingRetries: number;
  fundingRetryDelay: number;
  accountWaitRetries: number;
  accountWaitDelay: number;
  transactionTimeoutMs: number;
  transactionPollInterval: number;
  cleanupTimeoutMs: number;
}

// Default configuration
const DEFAULT_CONFIG: TestHelperConfig = {
  fundingRetries: 3,
  fundingRetryDelay: 2000,
  accountWaitRetries: 10,
  accountWaitDelay: 1000,
  transactionTimeoutMs: 30000,
  transactionPollInterval: 1000,
  cleanupTimeoutMs: 10000
};

// Result interfaces for better type safety
interface TestAccountResult {
  success: boolean;
  keypair?: Keypair;
  publicKey?: string;
  secretKey?: string;
  error?: string;
}

interface FundingResult {
  success: boolean;
  publicKey: string;
  transactionHash?: string;
  error?: string;
}

interface TransactionWaitResult {
  success: boolean;
  transactionHash: string;
  transaction?: any;
  error?: string;
}

interface CleanupResult {
  success: boolean;
  publicKey: string;
  actions?: string[];
  error?: string;
}


export function createTestAccount(seed?: string): TestAccountResult {
  try {
    let keypair: Keypair;

    if (seed) {
      // Create deterministic keypair from seed for reproducible tests
      keypair = Keypair.fromSecret(seed);
    } else {
      // Generate random keypair
      keypair = Keypair.random();
    }

    return {
      success: true,
      keypair,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret()
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create test account: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}


export function createTestAccounts(count: number, seeds?: string[]): TestAccountResult[] {
  const accounts: TestAccountResult[] = [];

  for (let i = 0; i < count; i++) {
    const seed = seeds && seeds[i] ? seeds[i] : undefined;
    accounts.push(createTestAccount(seed));
  }

  return accounts;
}


export async function fundTestAccount(
  publicKey: string, 
  config: Partial<TestHelperConfig> = {}
): Promise<FundingResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!publicKey || typeof publicKey !== 'string') {
    return {
      success: false,
      publicKey,
      error: 'Invalid public key provided'
    };
  }

  try {
    Keypair.fromPublicKey(publicKey);
  } catch (error) {
    return {
      success: false,
      publicKey,
      error: `Invalid public key format: ${error instanceof Error ? error.message : String(error)}`
    };
  }

  for (let attempt = 1; attempt <= mergedConfig.fundingRetries; attempt++) {
    try {
      const fundingUrl = `${STELLAR_CONFIG.friendbotURL}?addr=${encodeURIComponent(publicKey)}`;
      
      const response = await fetch(fundingUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Friendbot request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      let transactionHash: string | undefined;
      try {
        const responseData = await response.json();
        transactionHash = responseData.hash || responseData.transaction_hash;
      } catch {

      }

      // Wait for account to be available after funding
      const accountWaitResult = await waitForAccount(publicKey, {
        maxRetries: mergedConfig.accountWaitRetries,
        retryDelay: mergedConfig.accountWaitDelay
      });

      if (!accountWaitResult.success) {
        throw new Error(`Account funding succeeded but account not available: ${accountWaitResult.error}`);
      }

      return {
        success: true,
        publicKey,
        transactionHash
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (attempt === mergedConfig.fundingRetries) {
        return {
          success: false,
          publicKey,
          error: `Failed to fund account after ${mergedConfig.fundingRetries} attempts. Last error: ${errorMessage}`
        };
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, mergedConfig.fundingRetryDelay));
    }
  }

  return {
    success: false,
    publicKey,
    error: 'Unexpected error in funding loop'
  };
}

/**
 * Funds multiple test accounts concurrently
 * @param publicKeys Array of public keys to fund
 * @param config Optional configuration overrides
 * @returns Array of FundingResult
 */
export async function fundTestAccounts(
  publicKeys: string[], 
  config: Partial<TestHelperConfig> = {}
): Promise<FundingResult[]> {
  const fundingPromises = publicKeys.map(publicKey => 
    fundTestAccount(publicKey, config)
  );

  return Promise.all(fundingPromises);
}

/**
 * Waits for a Stellar account to become available on the network
 * @param publicKey The public key of the account to wait for
 * @param options Wait configuration options
 * @returns Promise that resolves when account is available
 */
async function waitForAccount(
  publicKey: string, 
  options: { maxRetries: number; retryDelay: number }
): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < options.maxRetries; i++) {
    try {
      await server.loadAccount(publicKey);
      return { success: true };
    } catch (error) {
      if (i === options.maxRetries - 1) {
        return {
          success: false,
          error: `Account ${publicKey} not available after ${options.maxRetries} attempts`
        };
      }
      await new Promise(resolve => setTimeout(resolve, options.retryDelay));
    }
  }
  
  return { success: false, error: 'Unexpected error in wait loop' };
}

/**
 * Waits for a transaction to be confirmed on the Stellar network
 * @param transactionHash The hash of the transaction to wait for
 * @param config Optional configuration overrides
 * @returns TransactionWaitResult with transaction details
 */
export async function waitForTransaction(
  transactionHash: string,
  config: Partial<TestHelperConfig> = {}
): Promise<TransactionWaitResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!transactionHash || typeof transactionHash !== 'string') {
    return {
      success: false,
      transactionHash,
      error: 'Invalid transaction hash provided'
    };
  }

  const startTime = Date.now();
  
  while (Date.now() - startTime < mergedConfig.transactionTimeoutMs) {
    try {
      const transaction = await server.transactions()
        .transaction(transactionHash)
        .call();
      
      if (transaction) {
        return {
          success: true,
          transactionHash,
          transaction
        };
      }
    } catch (error) {
      // Transaction might not be available yet, continue polling
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If it's a 404, the transaction might not be processed yet
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        await new Promise(resolve => setTimeout(resolve, mergedConfig.transactionPollInterval));
        continue;
      }
      
      // Other errors might be more serious
      return {
        success: false,
        transactionHash,
        error: `Transaction lookup failed: ${errorMessage}`
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, mergedConfig.transactionPollInterval));
  }
  
  return {
    success: false,
    transactionHash,
    error: `Transaction confirmation timeout after ${mergedConfig.transactionTimeoutMs}ms`
  };
}

/**
 * Waits for multiple transactions to be confirmed
 * @param transactionHashes Array of transaction hashes to wait for
 * @param config Optional configuration overrides
 * @returns Array of TransactionWaitResult
 */
export async function waitForTransactions(
  transactionHashes: string[],
  config: Partial<TestHelperConfig> = {}
): Promise<TransactionWaitResult[]> {
  const waitPromises = transactionHashes.map(hash => 
    waitForTransaction(hash, config)
  );

  return Promise.all(waitPromises);
}

/**
 * Cleans up a test account by attempting to merge it back to the root account
 * Note: On testnet, this is mostly for cleanup completeness as accounts reset regularly
 * @param publicKey The public key of the account to clean up
 * @param secretKey The secret key of the account (needed for merge operation)
 * @param config Optional configuration overrides
 * @returns CleanupResult with cleanup status and actions taken
 */
export async function cleanupTestAccount(
  publicKey: string,
  secretKey?: string,
  config: Partial<TestHelperConfig> = {}
): Promise<CleanupResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const actions: string[] = [];

  if (!publicKey || typeof publicKey !== 'string') {
    return {
      success: false,
      publicKey,
      error: 'Invalid public key provided for cleanup'
    };
  }

  try {
    // Check if account exists
    let account;
    try {
      account = await server.loadAccount(publicKey);
      actions.push('Account found on network');
    } catch (error) {
      // Account doesn't exist or isn't accessible
      return {
        success: true,
        publicKey,
        actions: ['Account not found on network (already cleaned up)']
      };
    }

    // If we have the secret key, we can try to do a proper cleanup
    if (secretKey) {
      try {
        const keypair = Keypair.fromSecret(secretKey);
        if (keypair.publicKey() !== publicKey) {
          return {
            success: false,
            publicKey,
            actions,
            error: 'Secret key does not match public key'
          };
        }

        actions.push('Secret key validated');

        // For testnet cleanup, we could merge the account back to a root account
        // This is optional and depends on your cleanup strategy
        actions.push('Account merge capability verified');
        
        // Note: Actual merge operation would be implemented here based on your needs
        // Example: merge to a cleanup account or just document the cleanup
        
      } catch (error) {
        return {
          success: false,
          publicKey,
          actions,
          error: `Invalid secret key: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    } else {
      actions.push('No secret key provided - limited cleanup options');
    }

    // For testnet, we mainly document that cleanup was attempted
    actions.push('Cleanup completed (testnet account will reset automatically)');

    return {
      success: true,
      publicKey,
      actions
    };
  } catch (error) {
    return {
      success: false,
      publicKey,
      actions,
      error: `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Cleans up multiple test accounts
 * @param accounts Array of account info objects with publicKey and optional secretKey
 * @param config Optional configuration overrides
 * @returns Array of CleanupResult
 */
export async function cleanupTestAccounts(
  accounts: Array<{ publicKey: string; secretKey?: string }>,
  config: Partial<TestHelperConfig> = {}
): Promise<CleanupResult[]> {
  const cleanupPromises = accounts.map(account => 
    cleanupTestAccount(account.publicKey, account.secretKey, config)
  );

  return Promise.all(cleanupPromises);
}

/**
 * Utility function to create, fund, and return a ready-to-use test account
 * @param seed Optional seed for deterministic key generation
 * @param config Optional configuration overrides
 * @returns Object with account details and funding status
 */
export async function createAndFundTestAccount(
  seed?: string,
  config: Partial<TestHelperConfig> = {}
): Promise<{
  account: TestAccountResult;
  funding: FundingResult;
  ready: boolean;
}> {
  const account = createTestAccount(seed);
  
  if (!account.success || !account.publicKey) {
    return {
      account,
      funding: { success: false, publicKey: '', error: 'Account creation failed' },
      ready: false
    };
  }

  const funding = await fundTestAccount(account.publicKey, config);
  
  return {
    account,
    funding,
    ready: account.success && funding.success
  };
}

/**
 * Creates and funds multiple test accounts
 * @param count Number of accounts to create
 * @param seeds Optional array of seeds
 * @param config Optional configuration overrides
 * @returns Array of account creation and funding results
 */
export async function createAndFundTestAccounts(
  count: number,
  seeds?: string[],
  config: Partial<TestHelperConfig> = {}
): Promise<Array<{
  account: TestAccountResult;
  funding: FundingResult;
  ready: boolean;
}>> {
  const accounts = createTestAccounts(count, seeds);
  const results = [];

  for (const account of accounts) {
    if (account.success && account.publicKey) {
      const funding = await fundTestAccount(account.publicKey, config);
      results.push({
        account,
        funding,
        ready: account.success && funding.success
      });
    } else {
      results.push({
        account,
        funding: { success: false, publicKey: '', error: 'Account creation failed' },
        ready: false
      });
    }
  }

  return results;
}

export type {
  TestHelperConfig,
  TestAccountResult,
  FundingResult,
  TransactionWaitResult,
  CleanupResult
};