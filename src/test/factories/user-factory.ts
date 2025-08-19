import { Keypair } from '@stellar/stellar-sdk';

/**
 * Interface representing a basic mock user.
 */
export interface MockUser {
    id: string;
    email: string;
    name: string;
}

/**
 * Interface representing a mock user with an associated Stellar wallet.
 */
export interface MockUserWithWallet extends MockUser {
    publicKey: string;
    secretKey: string;
}

// --- Factory Functions ---

/**
 * Creates a mock user object with default test data.
 * @param overrides - An object with properties to override the default mock user data.
 * @returns A new MockUser object.
 */
export const createMockUser = (overrides?: Partial<MockUser>): MockUser => {
    return {
        id: 'usr_test_12345',
        email: 'testuser@example.com',
        name: 'Test User',
        ...overrides,
    };
};

/**
 * Creates a mock user object that is configured with a Stellar wallet.
 * A new Keypair is generated for each call to ensure unique wallet details.
 * @param overrides - An object with properties to override the default mock user data.
 * @returns A new MockUserWithWallet object.
 */
export const createMockUserWithWallet = (overrides?: Partial<MockUserWithWallet>): MockUserWithWallet => {
    // Generate a new Stellar Keypair for the wallet
    const keypair = Keypair.random();

    // Use the basic factory to create the base user object
    const baseUser = createMockUser(overrides);

    return {
        ...baseUser,
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
        ...overrides,
    };
};
