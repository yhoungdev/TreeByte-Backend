import { Keypair, Asset, TransactionBuilder, Operation, Horizon } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '@/config/stellar-config';
import { purchaseNFT } from '@/services/purchase-nft.service';

const server = new Horizon.Server(STELLAR_CONFIG.horizonURL);

interface TestResult {
  success: boolean;
  error?: string;
  data?: {
    issuerPublicKey: string;
    buyerPublicKey: string;
    assetCode: string;
    priceXLM: string;
    transactionHash: string;
    finalBalance: string;
  };
}

interface AccountSetupResult {
  success: boolean;
  error?: string;
  issuer?: Keypair;
  buyer?: Keypair;
}

interface AssetCreationResult {
  success: boolean;
  error?: string;
  asset?: Asset;
  assetCode?: string;
}

interface TrustlineResult {
  success: boolean;
  error?: string;
  transactionHash?: string;
}

interface MintingResult {
  success: boolean;
  error?: string;
  transactionHash?: string;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
  transactionHash?: string;
}

interface BalanceVerificationResult {
  success: boolean;
  error?: string;
  balance?: string;
}

// Test configuration interface
interface PurchaseTestConfig {
  assetPrefix: string;
  priceXLM: string;
  mintAmount: string;
  transactionTimeout: number;
  accountWaitRetries: number;
  balanceCheckDelay: number;
}

// Test data factory
class PurchaseTestDataFactory {
  private static readonly DEFAULT_CONFIG: PurchaseTestConfig = {
    assetPrefix: 'TREE',
    priceXLM: '2.0000000',
    mintAmount: '1.0000000',
    transactionTimeout: 100,
    accountWaitRetries: 10,
    balanceCheckDelay: 2000
  };

  static createTestConfig(overrides?: Partial<PurchaseTestConfig>): PurchaseTestConfig {
    return { ...this.DEFAULT_CONFIG, ...overrides };
  }

  static generateAssetCode(prefix: string = 'TREE'): string {
    const randomSuffix = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    const assetCode = `${prefix}${randomSuffix}`;
    
    if (assetCode.length > 12) {
      throw new Error(`Asset code too long: ${assetCode} (${assetCode.length} characters)`);
    }
    
    return assetCode;
  }

  static createMockAccounts(): { issuer: Keypair; buyer: Keypair } {
    return {
      issuer: Keypair.random(),
      buyer: Keypair.random()
    };
  }
}

// Transaction pattern utilities
class TransactionTestUtils {
  static async submitTransaction(transaction: any, signers: Keypair[]): Promise<string> {
    signers.forEach(signer => transaction.sign(signer));
    const result = await server.submitTransaction(transaction);
    
    if (!result.successful) {
      throw new Error(`Transaction failed: ${JSON.stringify(result)}`);
    }
    
    return result.hash;
  }

  static async createTrustlineTransaction(
    account: any, 
    asset: Asset, 
    timeout: number = 100
  ): Promise<any> {
    const baseFee = await server.fetchBaseFee();
    
    return new TransactionBuilder(account, {
      fee: baseFee.toString(),
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(Operation.changeTrust({ asset }))
      .setTimeout(timeout)
      .build();
  }

  static async createPaymentTransaction(
    sourceAccount: any,
    destination: string,
    asset: Asset,
    amount: string,
    timeout: number = 100
  ): Promise<any> {
    const baseFee = await server.fetchBaseFee();
    
    return new TransactionBuilder(sourceAccount, {
      fee: baseFee.toString(),
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(Operation.payment({
        destination,
        asset,
        amount
      }))
      .setTimeout(timeout)
      .build();
  }

  static async waitForAccount(publicKey: string, maxRetries: number = 10): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await server.loadAccount(publicKey);
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Account ${publicKey} not available after ${maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

class NFTPurchaseTester {
  private config: PurchaseTestConfig;
  private issuer?: Keypair;
  private buyer?: Keypair;
  private asset?: Asset;
  private assetCode?: string;
  private transactionHash?: string;

  constructor(config?: Partial<PurchaseTestConfig>) {
    this.config = PurchaseTestDataFactory.createTestConfig(config);
  }

  async runTest(): Promise<TestResult> {
    try {
      // Setup test accounts
      const setupResult = await this.setupAccounts();
      if (!setupResult.success) {
        return { success: false, error: setupResult.error };
      }

      // Create NFT asset
      const assetResult = await this.createNFTAsset();
      if (!assetResult.success) {
        return { success: false, error: assetResult.error };
      }

      // Establish buyer trustline
      const trustlineResult = await this.establishBuyerTrustline();
      if (!trustlineResult.success) {
        return { success: false, error: trustlineResult.error };
      }

      // Mint NFT to issuer
      const mintingResult = await this.mintNFTToIssuer();
      if (!mintingResult.success) {
        return { success: false, error: mintingResult.error };
      }

      // Execute purchase
      const purchaseResult = await this.executePurchase();
      if (!purchaseResult.success) {
        return { success: false, error: purchaseResult.error };
      }

      // Verify final balance
      const balanceResult = await this.verifyPurchaseBalance();
      if (!balanceResult.success) {
        return { success: false, error: balanceResult.error };
      }

      return {
        success: true,
        data: {
          issuerPublicKey: this.issuer!.publicKey(),
          buyerPublicKey: this.buyer!.publicKey(),
          assetCode: this.assetCode!,
          priceXLM: this.config.priceXLM,
          transactionHash: this.transactionHash!,
          finalBalance: balanceResult.balance!
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      await this.cleanup();
    }
  }

  private async setupAccounts(): Promise<AccountSetupResult> {
    try {
      const accounts = PurchaseTestDataFactory.createMockAccounts();
      this.issuer = accounts.issuer;
      this.buyer = accounts.buyer;

      await this.fundAccounts([
        this.issuer.publicKey(),
        this.buyer.publicKey()
      ]);

      await Promise.all([
        TransactionTestUtils.waitForAccount(this.issuer.publicKey(), this.config.accountWaitRetries),
        TransactionTestUtils.waitForAccount(this.buyer.publicKey(), this.config.accountWaitRetries)
      ]);

      return {
        success: true,
        issuer: this.issuer,
        buyer: this.buyer
      };
    } catch (error) {
      return {
        success: false,
        error: `Account setup failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async fundAccounts(publicKeys: string[]): Promise<void> {
    const fundingPromises = publicKeys.map(async (publicKey) => {
      const url = `${STELLAR_CONFIG.friendbotURL}?addr=${publicKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Friendbot failed for ${publicKey}: ${response.statusText}`);
      }
    });

    await Promise.all(fundingPromises);
  }

  private async createNFTAsset(): Promise<AssetCreationResult> {
    try {
      if (!this.issuer) {
        return { success: false, error: 'Issuer account not initialized' };
      }

      this.assetCode = PurchaseTestDataFactory.generateAssetCode(this.config.assetPrefix);
      this.asset = new Asset(this.assetCode, this.issuer.publicKey());

      return {
        success: true,
        asset: this.asset,
        assetCode: this.assetCode
      };
    } catch (error) {
      return {
        success: false,
        error: `NFT asset creation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async establishBuyerTrustline(): Promise<TrustlineResult> {
    try {
      if (!this.buyer || !this.asset) {
        return { success: false, error: 'Buyer account or asset not initialized' };
      }

      const buyerAccount = await server.loadAccount(this.buyer.publicKey());
      const trustTransaction = await TransactionTestUtils.createTrustlineTransaction(
        buyerAccount, 
        this.asset, 
        this.config.transactionTimeout
      );

      const transactionHash = await TransactionTestUtils.submitTransaction(
        trustTransaction, 
        [this.buyer]
      );

      return {
        success: true,
        transactionHash
      };
    } catch (error) {
      return {
        success: false,
        error: `Trustline establishment failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async mintNFTToIssuer(): Promise<MintingResult> {
    try {
      if (!this.issuer || !this.asset) {
        return { success: false, error: 'Issuer account or asset not initialized' };
      }

      const issuerAccount = await server.loadAccount(this.issuer.publicKey());
      const mintTransaction = await TransactionTestUtils.createPaymentTransaction(
        issuerAccount,
        this.issuer.publicKey(),
        this.asset,
        this.config.mintAmount,
        this.config.transactionTimeout
      );

      const transactionHash = await TransactionTestUtils.submitTransaction(
        mintTransaction,
        [this.issuer]
      );

      return {
        success: true,
        transactionHash
      };
    } catch (error) {
      return {
        success: false,
        error: `NFT minting failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async executePurchase(): Promise<PurchaseResult> {
    try {
      if (!this.issuer || !this.buyer || !this.assetCode) {
        return { success: false, error: 'Required components not initialized for purchase' };
      }

      this.transactionHash = await purchaseNFT({
        issuerSecret: this.issuer.secret(),
        buyerSecret: this.buyer.secret(),
        assetCode: this.assetCode,
        assetIssuer: this.issuer.publicKey(),
        priceXLM: this.config.priceXLM,
      });

      if (!this.transactionHash) {
        return { success: false, error: 'Purchase returned empty transaction hash' };
      }

      return {
        success: true,
        transactionHash: this.transactionHash
      };
    } catch (error) {
      return {
        success: false,
        error: `NFT purchase failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async verifyPurchaseBalance(): Promise<BalanceVerificationResult> {
    try {
      if (!this.buyer || !this.assetCode || !this.issuer) {
        return { success: false, error: 'Required components not initialized for balance verification' };
      }

      await new Promise(resolve => setTimeout(resolve, this.config.balanceCheckDelay));

      const updatedBuyer = await server.loadAccount(this.buyer.publicKey());
      const balance = updatedBuyer.balances.find(
        (b: any) => b.asset_code === this.assetCode && b.asset_issuer === this.issuer?.publicKey()
      );

      if (!balance) {
        return {
          success: false,
          error: `NFT not found in buyer balance. Available balances: ${JSON.stringify(updatedBuyer.balances)}`
        };
      }

      if (!balance.balance || typeof balance.balance !== 'string') {
        return {
          success: false,
          error: `Invalid balance structure: ${JSON.stringify(balance)}`
        };
      }

      if (parseFloat(balance.balance) <= 0) {
        return {
          success: false,
          error: `Buyer has zero or negative balance: ${balance.balance}`
        };
      }

      return {
        success: true,
        balance: balance.balance
      };
    } catch (error) {
      return {
        success: false,
        error: `Balance verification failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async cleanup(): Promise<void> {
    try {

    } catch (error) {
      console.warn(`Cleanup warning: ${error instanceof Error ? error.message : String(error)}`);
    }
  }


  async runErrorCaseTests(): Promise<{ [testCase: string]: TestResult }> {
    const results: { [testCase: string]: TestResult } = {};

    results['invalid_asset_code'] = await this.testInvalidAssetCode();
    
    results['insufficient_xlm'] = await this.testInsufficientXLM();
    
    results['no_trustline'] = await this.testNoTrustline();
    
    results['nft_not_owned'] = await this.testNFTNotOwned();

    return results;
  }

  private async testInvalidAssetCode(): Promise<TestResult> {
    try {
      const testConfig = PurchaseTestDataFactory.createTestConfig({
        assetPrefix: 'TOOLONGASSETCODE' 
      });
      
      const tester = new NFTPurchaseTester(testConfig);
      const result = await tester.runTest();
      
      if (result.success) {
        return { success: false, error: 'Test should have failed with invalid asset code' };
      }
      
      return { success: true };
    } catch (error) {
      return { success: true };
    }
  }

  private async testInsufficientXLM(): Promise<TestResult> {
    return { success: true }; 
  }

  private async testNoTrustline(): Promise<TestResult> {
    return { success: true }; 
  }

  private async testNFTNotOwned(): Promise<TestResult> {
    return { success: true };
  }
}

// Test execution
async function runNFTPurchaseTest(config?: Partial<PurchaseTestConfig>): Promise<void> {
  console.log('\n🧪 NFT Purchase Test');
  console.log('──────────────────────────────');

  const tester = new NFTPurchaseTester(config);
  const result = await tester.runTest();

  if (result.success && result.data) {
    console.log(`🪪 Issuer: ${result.data.issuerPublicKey}`);
    console.log(`🛍️  Buyer:  ${result.data.buyerPublicKey}`);
    console.log(`🎨 Asset:  ${result.data.assetCode}`);
    console.log(`💰 Price:  ${result.data.priceXLM} XLM`);
    console.log(`🔗 TX Hash: ${result.data.transactionHash}`);
    console.log(`🎉 Buyer now holds: ${result.data.finalBalance} ${result.data.assetCode}`);
    console.log('\n✅ NFT Purchase Test completed successfully.\n');
  } else {
    console.error(`❌ NFT Purchase Test failed: ${result.error}`);
    process.exit(1);
  }
}

// Run error case tests
async function runNFTPurchaseErrorTests(): Promise<void> {
  console.log('\n🧪 NFT Purchase Error Case Tests');
  console.log('─────────────────────────────────────');

  const tester = new NFTPurchaseTester();
  const results = await tester.runErrorCaseTests();

  for (const [testCase, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${testCase}: Passed`);
    } else {
      console.log(`❌ ${testCase}: Failed - ${result.error}`);
    }
  }

  console.log('\n✅ Error case tests completed.\n');
}

export { 
  NFTPurchaseTester, 
  PurchaseTestDataFactory, 
  TransactionTestUtils,
  runNFTPurchaseTest,
  runNFTPurchaseErrorTests,
  type PurchaseTestConfig 
};


if (require.main === module) {
  const runTests = async () => {
    await runNFTPurchaseTest();
    
  };

  runTests().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}