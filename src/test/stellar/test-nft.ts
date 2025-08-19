import { Horizon, Keypair, Asset, TransactionBuilder, Operation } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '@/config/stellar-config';
import { generateUniqueToken } from '@/services/generate-unique-token.service';

const server = new Horizon.Server(STELLAR_CONFIG.horizonURL);

interface TestResult {
  success: boolean;
  error?: string;
  data?: {
    issuerPublicKey: string;
    recipientPublicKey: string;
    assetCode: string;
    transactionHash: string;
    balance: string;
  };
}

interface AccountSetupResult {
  success: boolean;
  error?: string;
  issuer?: Keypair;
  recipient?: Keypair;
}

interface AssetResult {
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

interface TokenIssuanceResult {
  success: boolean;
  error?: string;
  transactionHash?: string;
}

interface BalanceVerificationResult {
  success: boolean;
  error?: string;
  balance?: string;
}

class NFTTester {
  private issuer?: Keypair;
  private recipient?: Keypair;
  private asset?: Asset;
  private assetCode?: string;
  private transactionHash?: string;

  async runTest(): Promise<TestResult> {
    try {
      // Setup accounts
      const setupResult = await this.setupAccounts();
      if (!setupResult.success) {
        return { success: false, error: setupResult.error };
      }

      // Create asset
      const assetResult = await this.createAsset();
      if (!assetResult.success) {
        return { success: false, error: assetResult.error };
      }

      // Establish trustline
      const trustlineResult = await this.establishTrustline();
      if (!trustlineResult.success) {
        return { success: false, error: trustlineResult.error };
      }

      // Issue token
      const issuanceResult = await this.issueToken();
      if (!issuanceResult.success) {
        return { success: false, error: issuanceResult.error };
      }

      // Verify balance
      const balanceResult = await this.verifyBalance();
      if (!balanceResult.success) {
        return { success: false, error: balanceResult.error };
      }

      return {
        success: true,
        data: {
          issuerPublicKey: this.issuer!.publicKey(),
          recipientPublicKey: this.recipient!.publicKey(),
          assetCode: this.assetCode!,
          transactionHash: this.transactionHash!,
          balance: balanceResult.balance!
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
      this.issuer = Keypair.random();
      this.recipient = Keypair.random();

      await this.fundAccounts([
        this.issuer.publicKey(),
        this.recipient.publicKey()
      ]);

      // Wait for accounts to be available
      await this.waitForAccountsAvailable();

      return {
        success: true,
        issuer: this.issuer,
        recipient: this.recipient
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

  private async waitForAccountsAvailable(): Promise<void> {
    if (!this.issuer || !this.recipient) {
      throw new Error('Accounts not initialized');
    }

    const maxRetries = 10;
    const delay = 1000; // 1 second

    for (let i = 0; i < maxRetries; i++) {
      try {
        await Promise.all([
          server.loadAccount(this.issuer.publicKey()),
          server.loadAccount(this.recipient.publicKey())
        ]);
        return; // Both accounts are available
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Accounts not available after ${maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async createAsset(): Promise<AssetResult> {
    try {
      if (!this.issuer) {
        return { success: false, error: 'Issuer account not initialized' };
      }

      const randomSuffix = this.generateRandomSuffix();
      this.assetCode = `TREE${randomSuffix}`;

      // Validate asset code length (Stellar limit is 12 characters)
      if (this.assetCode.length > 12) {
        return { success: false, error: `Asset code too long: ${this.assetCode.length} characters` };
      }

      this.asset = new Asset(this.assetCode, this.issuer.publicKey());

      return {
        success: true,
        asset: this.asset,
        assetCode: this.assetCode
      };
    } catch (error) {
      return {
        success: false,
        error: `Asset creation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private generateRandomSuffix(): string {
    return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  }

  private async establishTrustline(): Promise<TrustlineResult> {
    try {
      if (!this.recipient || !this.asset) {
        return { success: false, error: 'Recipient account or asset not initialized' };
      }

      const recipientAccount = await server.loadAccount(this.recipient.publicKey());
      const baseFee = await server.fetchBaseFee();

      const trustTransaction = new TransactionBuilder(recipientAccount, {
        fee: baseFee.toString(),
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      })
        .addOperation(Operation.changeTrust({ asset: this.asset }))
        .setTimeout(100)
        .build();

      trustTransaction.sign(this.recipient);
      const result = await server.submitTransaction(trustTransaction);

      if (!result.successful) {
        return {
          success: false,
          error: `Trustline transaction failed: ${JSON.stringify(result)}`
        };
      }

      return {
        success: true,
        transactionHash: result.hash
      };
    } catch (error) {
      return {
        success: false,
        error: `Trustline establishment failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async issueToken(): Promise<TokenIssuanceResult> {
    try {
      if (!this.issuer || !this.recipient || !this.assetCode) {
        return { success: false, error: 'Required components not initialized for token issuance' };
      }

      this.transactionHash = await generateUniqueToken({
        issuerSecret: this.issuer.secret(),
        assetCode: this.assetCode,
        recipientPublicKey: this.recipient.publicKey(),
      });

      if (!this.transactionHash) {
        return { success: false, error: 'Token issuance returned empty transaction hash' };
      }

      return {
        success: true,
        transactionHash: this.transactionHash
      };
    } catch (error) {
      return {
        success: false,
        error: `Token issuance failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async verifyBalance(): Promise<BalanceVerificationResult> {
    try {
      if (!this.recipient || !this.assetCode || !this.issuer) {
        return { success: false, error: 'Required components not initialized for balance verification' };
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedAccount = await server.loadAccount(this.recipient.publicKey());
      const balance = updatedAccount.balances.find(
        (b: any) => b.asset_code === this.assetCode && b.asset_issuer === this.issuer?.publicKey()
      );

      if (!balance) {
        return {
          success: false,
          error: `NFT not found in recipient balance. Available balances: ${JSON.stringify(updatedAccount.balances)}`
        };
      }

      // Validate balance structure
      if (!balance.balance || typeof balance.balance !== 'string') {
        return {
          success: false,
          error: `Invalid balance structure: ${JSON.stringify(balance)}`
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
}

export class NFTTestUtils {
  static generateAssetCode(prefix: string = 'TREE'): string {
    const randomSuffix = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    return `${prefix}${randomSuffix}`;
  }

  static async fundAccount(publicKey: string): Promise<void> {
    const url = `${STELLAR_CONFIG.friendbotURL}?addr=${publicKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Friendbot failed: ${response.statusText}`);
    }
  }

  static async createAndFundKeypair(): Promise<Keypair> {
    const keypair = Keypair.random();
    await this.fundAccount(keypair.publicKey());
    return keypair;
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

// Test execution
async function runNFTTest(): Promise<void> {
  console.log('\n🌱 NFT Generation Test on Stellar Testnet');
  console.log('──────────────────────────────────────────');

  const tester = new NFTTester();
  const result = await tester.runTest();

  if (result.success && result.data) {
    console.log(`🔑 Issuer:    ${result.data.issuerPublicKey}`);
    console.log(`👤 Recipient: ${result.data.recipientPublicKey}`);
    console.log(`🎨 Asset:     ${result.data.assetCode}`);
    console.log(`🔗 TX Hash:   ${result.data.transactionHash}`);
    console.log(`🎉 NFT Balance: ${result.data.balance} ${result.data.assetCode}`);
    console.log('\n✅ NFT Test completed successfully.\n');
  } else {
    console.error(`❌ NFT Test failed: ${result.error}`);
    process.exit(1);
  }
}


export { NFTTester, runNFTTest };

if (require.main === module) {
  runNFTTest().catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}