import { fetch } from "undici";
import { accountService } from "@/services/stellar";

const API_URL = process.env.API_URL as string;

interface RegisterResponse {
  message: string;
  user: {
    email: string;
    authMethod: string;
    publicKey: string;
  };
}

interface TestResult {
  success: boolean;
  error?: string;
  data?: {
    email: string;
    publicKey: string;
    balances: any[];
  };
}

interface BalanceTestResult {
  success: boolean;
  error?: string;
  balances?: any[];
}

class AuthRegisterTester {
  private testEmail: string;
  private publicKey?: string;

  constructor() {
    this.testEmail = `user-${Date.now()}@test.com`;
  }

  async runTest(): Promise<TestResult> {
    try {
      const registerResult = await this.testRegistration();
      if (!registerResult.success) {
        return registerResult;
      }

      const fundingResult = await this.testStellarFunding();
      if (!fundingResult.success) {
        return fundingResult;
      }

      const balanceResult = await this.testBalanceRetrieval();
      if (!balanceResult.success) {
        return balanceResult;
      }

      return {
        success: true,
        data: {
          email: this.testEmail,
          publicKey: this.publicKey!,
          balances: balanceResult.balances || []
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

  private async testRegistration(): Promise<TestResult> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.testEmail,
        authMethod: "email",
      }),
    });

    const rawResponse = await response.text();
    
    if (!this.isValidJson(rawResponse)) {
      return {
        success: false,
        error: `Invalid JSON response. Status: ${response.status}, Body: ${rawResponse}`
      };
    }

    const data = JSON.parse(rawResponse) as RegisterResponse;

    if (response.status !== 201) {
      return {
        success: false,
        error: `Registration failed with status ${response.status}: ${JSON.stringify(data)}`
      };
    }

    if (!this.isValidRegisterResponse(data)) {
      return {
        success: false,
        error: `Invalid response structure: ${JSON.stringify(data)}`
      };
    }

    this.publicKey = data.user.publicKey;
    return { success: true };
  }

  private async testStellarFunding(): Promise<TestResult> {
    if (!this.publicKey) {
      return { success: false, error: "Public key not available for funding" };
    }

    try {
      await accountService.fundAccount(this.publicKey);
      await accountService.waitForAccount(this.publicKey);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Stellar funding failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async testBalanceRetrieval(): Promise<BalanceTestResult> {
    if (!this.publicKey) {
      return { success: false, error: "Public key not available for balance retrieval" };
    }

    try {
      const balances = await accountService.getBalances(this.publicKey);
      
      if (!Array.isArray(balances) || balances.length === 0) {
        return {
          success: false,
          error: "No balances found or invalid balance structure"
        };
      }

      const hasValidBalances = balances.every(balance => 
        typeof balance.balance === 'string' && 
        (balance.asset_type || (balance.asset_code && balance.asset_issuer))
      );

      if (!hasValidBalances) {
        return {
          success: false,
          error: "Invalid balance structure detected"
        };
      }

      return { 
        success: true, 
        balances
      };
    } catch (error) {
      return {
        success: false,
        error: `Balance retrieval failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private isValidJson(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  private isValidRegisterResponse(data: any): data is RegisterResponse {
    return (
      data &&
      typeof data.message === 'string' &&
      data.user &&
      typeof data.user.email === 'string' &&
      typeof data.user.authMethod === 'string' &&
      typeof data.user.publicKey === 'string'
    );
  }

  private async cleanup(): Promise<void> {
    try {
    } catch (error) {
      console.warn(`Cleanup warning: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Utility method for formatting balance output
  private formatBalance(balance: any): string {
    if (balance.asset_code && balance.asset_issuer) {
      return `${balance.balance} ${balance.asset_code}`;
    }
    return `${balance.balance} ${balance.asset_type || 'XLM'}`;
  }
}

// Test execution
async function runAuthRegisterTest(): Promise<void> {
  console.log("\n🔐 Testing /auth/register");
  console.log("───────────────────────────────");

  const tester = new AuthRegisterTester();
  const result = await tester.runTest();

  if (result.success && result.data) {
    console.log(`✅ User registered: ${result.data.email}`);
    console.log(`🔑 Public key: ${result.data.publicKey}`);
    console.log("📊 Balances:");
    
    result.data.balances.forEach(balance => {
      const formatted = balance.asset_code && balance.asset_issuer
        ? `${balance.balance} ${balance.asset_code}`
        : `${balance.balance} ${balance.asset_type || 'XLM'}`;
      console.log(`  • ${formatted}`);
    });
    
    console.log("\n✅ Registration + Stellar integration test passed.\n");
  } else {
    console.error(`❌ Test failed: ${result.error}`);
    process.exit(1);
  }
}


export { AuthRegisterTester, runAuthRegisterTest };

if (require.main === module) {
  runAuthRegisterTest().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}