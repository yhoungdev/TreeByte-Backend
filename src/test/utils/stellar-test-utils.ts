import { 
  Keypair, 
  Asset, 
  TransactionBuilder, 
  Operation, 
  Horizon,
  Memo,
} from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '@/config/stellar-config';

const server = new Horizon.Server(STELLAR_CONFIG.horizonURL);

// Configuration interface for Stellar test utilities
interface StellarTestConfig {
  baseFeeMultiplier: number;
  transactionTimeout: number;
  accountLoadRetries: number;
  accountLoadDelay: number;
  transactionSubmissionRetries: number;
  transactionSubmissionDelay: number;
  balanceRefreshRetries: number;
  balanceRefreshDelay: number;
}

// Default configuration
const DEFAULT_STELLAR_CONFIG: StellarTestConfig = {
  baseFeeMultiplier: 1,
  transactionTimeout: 100,
  accountLoadRetries: 5,
  accountLoadDelay: 1000,
  transactionSubmissionRetries: 3,
  transactionSubmissionDelay: 2000,
  balanceRefreshRetries: 5,
  balanceRefreshDelay: 1000
};

// Result interfaces
interface AssetCreationResult {
  success: boolean;
  asset?: Asset;
  assetCode?: string;
  issuerPublicKey?: string;
  error?: string;
}

interface TrustlineResult {
  success: boolean;
  transactionHash?: string;
  asset?: Asset;
  accountPublicKey?: string;
  error?: string;
}

interface TransferResult {
  success: boolean;
  transactionHash?: string;
  asset?: Asset;
  amount?: string;
  fromPublicKey?: string;
  toPublicKey?: string;
  error?: string;
}

interface BalanceResult {
  success: boolean;
  balance?: string;
  assetCode?: string;
  assetIssuer?: string;
  assetType?: string;
  publicKey?: string;
  allBalances?: Array<{
    balance: string;
    asset_code?: string;
    asset_issuer?: string;
    asset_type?: string;
  }>;
  error?: string;
}

// Asset type for better typing
interface TestAsset {
  code: string;
  issuer: string;
  stellarAsset: Asset;
}

/**
 * Creates a test asset with the given issuer and code
 * @param issuer Keypair or public key string of the asset issuer
 * @param code Asset code (max 12 characters for custom assets, or 'native' for XLM)
 * @returns AssetCreationResult with asset details
 */
export function createTestAsset(
  issuer: Keypair | string,
  code: string
): AssetCreationResult {
  try {
    // Input validation
    if (!code || typeof code !== 'string') {
      return {
        success: false,
        error: 'Asset code must be a non-empty string'
      };
    }

    // Handle native XLM
    if (code.toLowerCase() === 'native' || code.toUpperCase() === 'XLM') {
      return {
        success: true,
        asset: Asset.native(),
        assetCode: 'XLM',
        issuerPublicKey: undefined // Native asset has no issuer
      };
    }

    // Validate asset code length
    if (code.length > 12) {
      return {
        success: false,
        error: `Asset code too long: ${code.length} characters (max 12)`
      };
    }

    // Validate and extract issuer public key
    let issuerPublicKey: string;
    if (typeof issuer === 'string') {
      // Validate public key format
      try {
        Keypair.fromPublicKey(issuer);
        issuerPublicKey = issuer;
      } catch (error) {
        return {
          success: false,
          error: `Invalid issuer public key: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    } else if (issuer instanceof Keypair) {
      issuerPublicKey = issuer.publicKey();
    } else {
      return {
        success: false,
        error: 'Issuer must be a Keypair or valid public key string'
      };
    }

    // Create the asset
    const asset = new Asset(code, issuerPublicKey);

    return {
      success: true,
      asset,
      assetCode: code,
      issuerPublicKey
    };
  } catch (error) {
    return {
      success: false,
      error: `Asset creation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Creates multiple test assets at once
 * @param assetsData Array of { issuer, code } objects
 * @returns Array of AssetCreationResult
 */
export function createTestAssets(
  assetsData: Array<{ issuer: Keypair | string; code: string }>
): AssetCreationResult[] {
  return assetsData.map(({ issuer, code }) => createTestAsset(issuer, code));
}

/**
 * Establishes a trustline from an account to an asset
 * @param account Keypair of the account establishing the trustline
 * @param asset Asset object or TestAsset to trust
 * @param limit Optional trust limit (default: no limit)
 * @param config Optional configuration overrides
 * @returns TrustlineResult with transaction details
 */
export async function establishTrustline(
  account: Keypair | string,
  asset: Asset | TestAsset,
  limit?: string,
  config: Partial<StellarTestConfig> = {}
): Promise<TrustlineResult> {
  const mergedConfig = { ...DEFAULT_STELLAR_CONFIG, ...config };

  try {
    // Input validation
    let accountKeypair: Keypair;
    let accountPublicKey: string;

    if (typeof account === 'string') {
      try {
        accountKeypair = Keypair.fromSecret(account);
        accountPublicKey = accountKeypair.publicKey();
      } catch (error) {
        return {
          success: false,
          error: `Invalid account secret key: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    } else if (account instanceof Keypair) {
      accountKeypair = account;
      accountPublicKey = account.publicKey();
    } else {
      return {
        success: false,
        error: 'Account must be a Keypair or secret key string'
      };
    }

    // Extract Stellar Asset
    let stellarAsset: Asset;
    if (asset instanceof Asset) {
      stellarAsset = asset;
    } else if (asset && typeof asset === 'object' && 'stellarAsset' in asset) {
      stellarAsset = (asset as TestAsset).stellarAsset;
    } else {
      return {
        success: false,
        error: 'Invalid asset provided'
      };
    }

    // Don't create trustline for native XLM
    if (stellarAsset.isNative()) {
      return {
        success: true,
        asset: stellarAsset,
        accountPublicKey,
        transactionHash: undefined // No transaction needed for native asset
      };
    }

    // Load account with retries
    const accountData = await loadAccountWithRetries(accountPublicKey, mergedConfig);
    if (!accountData) {
      return {
        success: false,
        accountPublicKey,
        error: `Failed to load account ${accountPublicKey} after ${mergedConfig.accountLoadRetries} attempts`
      };
    }

    // Get base fee
    const baseFee = await server.fetchBaseFee();
    const fee = (baseFee * mergedConfig.baseFeeMultiplier).toString();

    // Build trustline transaction
    const trustlineOperation = limit 
      ? Operation.changeTrust({ asset: stellarAsset, limit })
      : Operation.changeTrust({ asset: stellarAsset });

    const transaction = new TransactionBuilder(accountData, {
      fee,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(trustlineOperation)
      .setTimeout(mergedConfig.transactionTimeout)
      .build();

    // Sign transaction
    transaction.sign(accountKeypair);

    // Submit transaction with retries
    const submitResult = await submitTransactionWithRetries(transaction, mergedConfig);
    if (!submitResult.success) {
      return {
        success: false,
        asset: stellarAsset,
        accountPublicKey,
        error: submitResult.error
      };
    }

    return {
      success: true,
      transactionHash: submitResult.transactionHash,
      asset: stellarAsset,
      accountPublicKey
    };
  } catch (error) {
    return {
      success: false,
      error: `Trustline establishment failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Establishes trustlines for multiple assets from one account
 * @param account Keypair of the account establishing trustlines
 * @param assets Array of assets to trust
 * @param limits Optional array of trust limits corresponding to assets
 * @param config Optional configuration overrides
 * @returns Array of TrustlineResult
 */
export async function establishTrustlines(
  account: Keypair | string,
  assets: Array<Asset | TestAsset>,
  limits?: string[],
  config: Partial<StellarTestConfig> = {}
): Promise<TrustlineResult[]> {
  const results: TrustlineResult[] = [];

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const limit = limits && limits[i] ? limits[i] : undefined;
    const result = await establishTrustline(account, asset, limit, config);
    results.push(result);
  }

  return results;
}

/**
 * Transfers an asset from one account to another
 * @param from Keypair or secret key of the sending account
 * @param to Public key or Keypair of the receiving account
 * @param asset Asset to transfer
 * @param amount Amount to transfer (as string)
 * @param memo Optional memo for the transaction
 * @param config Optional configuration overrides
 * @returns TransferResult with transaction details
 */
export async function transferAsset(
  from: Keypair | string,
  to: string | Keypair,
  asset: Asset | TestAsset,
  amount: string,
  memo?: string,
  config: Partial<StellarTestConfig> = {}
): Promise<TransferResult> {
  const mergedConfig = { ...DEFAULT_STELLAR_CONFIG, ...config };

  try {
    // Input validation
    if (!amount || typeof amount !== 'string') {
      return {
        success: false,
        error: 'Amount must be provided as a string'
      };
    }

    // Validate amount format
    if (!/^\d+(\.\d{1,7})?$/.test(amount)) {
      return {
        success: false,
        error: 'Amount must be a valid decimal number with up to 7 decimal places'
      };
    }

    // Process sender account
    let senderKeypair: Keypair;
    let senderPublicKey: string;

    if (typeof from === 'string') {
      try {
        senderKeypair = Keypair.fromSecret(from);
        senderPublicKey = senderKeypair.publicKey();
      } catch (error) {
        return {
          success: false,
          error: `Invalid sender secret key: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    } else if (from instanceof Keypair) {
      senderKeypair = from;
      senderPublicKey = from.publicKey();
    } else {
      return {
        success: false,
        error: 'Sender must be a Keypair or secret key string'
      };
    }

    // Process recipient account
    let recipientPublicKey: string;

    if (typeof to === 'string') {
      try {
        Keypair.fromPublicKey(to); // Validate public key format
        recipientPublicKey = to;
      } catch (error) {
        return {
          success: false,
          error: `Invalid recipient public key: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    } else if (to instanceof Keypair) {
      recipientPublicKey = to.publicKey();
    } else {
      return {
        success: false,
        error: 'Recipient must be a public key string or Keypair'
      };
    }

    // Extract Stellar Asset
    let stellarAsset: Asset;
    if (asset instanceof Asset) {
      stellarAsset = asset;
    } else if (asset && typeof asset === 'object' && 'stellarAsset' in asset) {
      stellarAsset = (asset as TestAsset).stellarAsset;
    } else {
      return {
        success: false,
        error: 'Invalid asset provided'
      };
    }

    // Load sender account
    const senderAccount = await loadAccountWithRetries(senderPublicKey, mergedConfig);
    if (!senderAccount) {
      return {
        success: false,
        fromPublicKey: senderPublicKey,
        toPublicKey: recipientPublicKey,
        error: `Failed to load sender account ${senderPublicKey} after ${mergedConfig.accountLoadRetries} attempts`
      };
    }

    // Get base fee
    const baseFee = await server.fetchBaseFee();
    const fee = (baseFee * mergedConfig.baseFeeMultiplier).toString();

    // Build payment transaction
    const transactionBuilder = new TransactionBuilder(senderAccount, {
      fee,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(Operation.payment({
        destination: recipientPublicKey,
        asset: stellarAsset,
        amount
      }))
      .setTimeout(mergedConfig.transactionTimeout);

    // Add memo if provided
    if (memo) {
      transactionBuilder.addMemo(Memo.text(memo));
    }

    const transaction = transactionBuilder.build();

    // Sign transaction
    transaction.sign(senderKeypair);

    // Submit transaction
    const submitResult = await submitTransactionWithRetries(transaction, mergedConfig);
    if (!submitResult.success) {
      return {
        success: false,
        asset: stellarAsset,
        amount,
        fromPublicKey: senderPublicKey,
        toPublicKey: recipientPublicKey,
        error: submitResult.error
      };
    }

    return {
      success: true,
      transactionHash: submitResult.transactionHash,
      asset: stellarAsset,
      amount,
      fromPublicKey: senderPublicKey,
      toPublicKey: recipientPublicKey
    };
  } catch (error) {
    return {
      success: false,
      error: `Asset transfer failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Performs multiple asset transfers in sequence
 * @param transfers Array of transfer configurations
 * @param config Optional configuration overrides
 * @returns Array of TransferResult
 */
export async function transferAssets(
  transfers: Array<{
    from: Keypair | string;
    to: string | Keypair;
    asset: Asset | TestAsset;
    amount: string;
    memo?: string;
  }>,
  config: Partial<StellarTestConfig> = {}
): Promise<TransferResult[]> {
  const results: TransferResult[] = [];

  for (const transfer of transfers) {
    const result = await transferAsset(
      transfer.from,
      transfer.to,
      transfer.asset,
      transfer.amount,
      transfer.memo,
      config
    );
    results.push(result);
  }

  return results;
}

/**
 * Gets the balance of a specific asset for an account
 * @param publicKey Public key of the account
 * @param assetCode Asset code to check balance for ('native' or 'XLM' for XLM)
 * @param assetIssuer Asset issuer (optional for native XLM)
 * @param config Optional configuration overrides
 * @returns BalanceResult with balance information
 */
export async function getAccountBalance(
  publicKey: string,
  assetCode?: string,
  assetIssuer?: string,
  config: Partial<StellarTestConfig> = {}
): Promise<BalanceResult> {
  const mergedConfig = { ...DEFAULT_STELLAR_CONFIG, ...config };

  try {
    // Input validation
    if (!publicKey || typeof publicKey !== 'string') {
      return {
        success: false,
        error: 'Public key must be provided as a string'
      };
    }

    try {
      Keypair.fromPublicKey(publicKey); // Validate public key format
    } catch (error) {
      return {
        success: false,
        publicKey,
        error: `Invalid public key format: ${error instanceof Error ? error.message : String(error)}`
      };
    }

    // Load account with retries
    const account = await loadAccountWithRetries(publicKey, mergedConfig);
    if (!account) {
      return {
        success: false,
        publicKey,
        error: `Failed to load account ${publicKey} after ${mergedConfig.accountLoadRetries} attempts`
      };
    }

    // Get all balances
    const allBalances = account.balances.map((balance: any) => ({
      balance: balance.balance,
      asset_code: balance.asset_code,
      asset_issuer: balance.asset_issuer,
      asset_type: balance.asset_type
    }));

    // If no specific asset requested, return all balances
    if (!assetCode) {
      return {
        success: true,
        publicKey,
        allBalances
      };
    }

    // Look for specific asset
    let targetBalance;

    if (assetCode.toLowerCase() === 'native' || assetCode.toUpperCase() === 'XLM') {
      // Looking for native XLM
      targetBalance = account.balances.find((balance: any) => 
        balance.asset_type === 'native'
      );
    } else {
      // Looking for custom asset
      if (!assetIssuer) {
        return {
          success: false,
          publicKey,
          assetCode,
          error: 'Asset issuer must be provided for custom assets'
        };
      }

      targetBalance = account.balances.find((balance: any) => 
        balance.asset_code === assetCode && balance.asset_issuer === assetIssuer
      );
    }

    if (!targetBalance) {
      return {
        success: false,
        publicKey,
        assetCode,
        assetIssuer,
        allBalances,
        error: `Asset ${assetCode} not found in account balances`
      };
    }

    return {
      success: true,
      balance: targetBalance.balance,
      assetCode: targetBalance.asset_code || 'XLM',
      assetIssuer: targetBalance.asset_issuer,
      assetType: targetBalance.asset_type,
      publicKey,
      allBalances
    };
  } catch (error) {
    return {
      success: false,
      publicKey,
      assetCode,
      assetIssuer,
      error: `Balance retrieval failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Gets balances for multiple accounts and assets
 * @param queries Array of balance query configurations
 * @param config Optional configuration overrides
 * @returns Array of BalanceResult
 */
export async function getAccountBalances(
  queries: Array<{
    publicKey: string;
    assetCode?: string;
    assetIssuer?: string;
  }>,
  config: Partial<StellarTestConfig> = {}
): Promise<BalanceResult[]> {
  const balancePromises = queries.map(query => 
    getAccountBalance(query.publicKey, query.assetCode, query.assetIssuer, config)
  );

  return Promise.all(balancePromises);
}

// Helper function to load account with retry logic
async function loadAccountWithRetries(
  publicKey: string, 
  config: StellarTestConfig
): Promise<any> {
  for (let i = 0; i < config.accountLoadRetries; i++) {
    try {
      return await server.loadAccount(publicKey);
    } catch (error) {
      if (i === config.accountLoadRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, config.accountLoadDelay));
    }
  }
}

// Helper function to submit transaction with retry logic
async function submitTransactionWithRetries(
  transaction: any,
  config: StellarTestConfig
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  for (let i = 0; i < config.transactionSubmissionRetries; i++) {
    try {
      const result = await server.submitTransaction(transaction);
      
      if (!result.successful) {
        const error = `Transaction failed: ${JSON.stringify(result)}`;
        if (i === config.transactionSubmissionRetries - 1) {
          return { success: false, error };
        }
        await new Promise(resolve => setTimeout(resolve, config.transactionSubmissionDelay));
        continue;
      }

      return { success: true, transactionHash: result.hash };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (i === config.transactionSubmissionRetries - 1) {
        return { success: false, error: `Transaction submission failed: ${errorMessage}` };
      }
      
      await new Promise(resolve => setTimeout(resolve, config.transactionSubmissionDelay));
    }
  }
  
  return { success: false, error: 'Unexpected error in transaction submission loop' };
}

/**
 * Utility function to create a complete test asset workflow
 * @param issuer Asset issuer keypair
 * @param code Asset code
 * @param trustingAccounts Accounts that should trust this asset
 * @param config Optional configuration overrides
 * @returns Object with asset creation and trustline results
 */
export async function createTestAssetWorkflow(
  issuer: Keypair,
  code: string,
  trustingAccounts: Keypair[],
  config: Partial<StellarTestConfig> = {}
): Promise<{
  assetCreation: AssetCreationResult;
  trustlines: TrustlineResult[];
  asset?: Asset;
  ready: boolean;
}> {
  const assetCreation = createTestAsset(issuer, code);
  
  if (!assetCreation.success || !assetCreation.asset) {
    return {
      assetCreation,
      trustlines: [],
      ready: false
    };
  }

  const trustlinePromises = trustingAccounts.map(account =>
    establishTrustline(account, assetCreation.asset!, undefined, config)
  );

  const trustlines = await Promise.all(trustlinePromises);
  const allTrustlinesSuccessful = trustlines.every(result => result.success);

  return {
    assetCreation,
    trustlines,
    asset: assetCreation.asset,
    ready: assetCreation.success && allTrustlinesSuccessful
  };
}

// Export types for use in other files
export type {
  StellarTestConfig,
  AssetCreationResult,
  TrustlineResult,
  TransferResult,
  BalanceResult,
  TestAsset
};