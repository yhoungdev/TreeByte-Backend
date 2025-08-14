import { Keypair, Horizon, TransactionBuilder, Operation } from '@stellar/stellar-sdk';
import Server from '@stellar/stellar-sdk';
import { beforeAll, afterAll } from 'vitest';
import { STELLAR_CONFIG } from '../../config/stellar-config';
import { Op } from 'sequelize';

// The Horizon server instance, configured from the main Stellar config.
const server = new Server(STELLAR_CONFIG.horizonURL);

// A simple interface to represent a test account keypair and its public key.
export interface StellarTestAccount {
  keypair: Keypair;
  publicKey: string;
}

// Global variable to hold a funding account for all tests.
let fundingAccount: StellarTestAccount;

// --- Setup and Teardown Functions ---

/**
 * Verifies that the connection to the Stellar Horizon testnet is active.
 * Throws an error if the connection fails.
 */
export const verifyNetworkConnection = async (): Promise<void> => {
  console.log(`Verifying connection to Horizon at ${STELLAR_CONFIG.horizonURL}...`);
  try {
    // Attempt to load the network's root information
    await server.loadAccount(fundingAccount.publicKey);
    console.log('Successfully connected to Stellar network.');
  } catch (error) {
    console.error('Failed to connect to Stellar network.');
    throw new Error(`Connection verification failed: ${error}`);
  }
};

/**
 * Creates and funds a new test account on the Stellar network.
 * This is a crucial helper for creating test accounts that can be used
 * for transactions and contract interactions.
 * @param initialBalance The initial balance to fund the account with (in lumens).
 * @returns A promise that resolves to a new StellarTestAccount.
 */
export const createAndFundTestAccount = async (initialBalance: string): Promise<StellarTestAccount> => {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  console.log(`Creating and funding new test account: ${publicKey}`);

  try {
    // Load the funding account to build the transaction
    const fundingAccountDetails = await server.loadAccount(fundingAccount.publicKey);

    // Build and sign the transaction to create the new account
    const transaction = new TransactionBuilder(fundingAccountDetails, {
      fee: '1000', // Small base fee
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    })
      .addOperation(
        Operation.createAccount({
          destination: publicKey,
          startingBalance: initialBalance,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(fundingAccount.keypair);

    // Submit the transaction to the network
    await server.submitTransaction(transaction);
    console.log(`Account ${publicKey} funded successfully.`);

    return { keypair, publicKey };
  } catch (error) {
    console.error(`Failed to create and fund test account ${publicKey}.`);
    throw error;
  }
};

/**
 * Deploys a smart contract to the Stellar network.
 * This is a simplified helper; a real-world implementation would need
 * more complex logic for contract-specific setup and configuration.
 * @param sourceAccount The account that will pay for the deployment.
 * @param contractCode The WebAssembly (Wasm) contract code as a Buffer or similar type.
 * @returns A promise that resolves to the contract ID.
 */
export const deployContract = async (
  sourceAccount: StellarTestAccount,
  contractCode: Buffer,
): Promise<string> => {
  console.log(`Deploying a contract from account: ${sourceAccount.publicKey}`);
  // In a real-world scenario, you would use more advanced SDK features here
  // to upload the contract Wasm and initialize it.
  // This is a placeholder to show the structure.
  console.log('Contract deployment logic would go here...');
  
  // Return a mock contract ID for now
  return `contract_${Keypair.random().publicKey().slice(0, 8)}`;
};


// --- Global Vitest Hooks ---

beforeAll(async () => {

  const fundingKeypair = Keypair.fromSecret(STELLAR_CONFIG.fundingAccountSecret);
  fundingAccount = {
    keypair: fundingKeypair,
    publicKey: fundingKeypair.publicKey(),
  };

  await verifyNetworkConnection();
});

afterAll(async () => {
  console.log('Stellar test environment teardown complete.');

});

