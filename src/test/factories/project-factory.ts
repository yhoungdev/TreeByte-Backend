import { Keypair } from '@stellar/stellar-sdk';


const generateRandomId = () => `proj_${Math.random().toString(36).substring(2, 15)}`;


export interface MockProject {
    id: string;
    name: string;
    description: string;
    ownerId: string;
}

/**
 * Interface representing a mock project with a Stellar contract.
 * The contract details are based on a typical Stellar smart contract setup.
 */
export interface MockProjectWithContract extends MockProject {
    contractId: string;
    contractAddress: string;
}

// --- Factory Functions ---


export const createMockProject = (overrides?: Partial<MockProject>): MockProject => {
    return {
        id: generateRandomId(),
        name: 'My Test Project',
        description: 'This is a description for a test project.',
        ownerId: 'usr_owner_123',
        ...overrides,
    };
};

/**
 * Creates a mock project that is configured with a Stellar smart contract.
 * A new contract ID and address are generated for each call.
 * @param overrides - An object with properties to override the default mock project data.
 * @returns A new MockProjectWithContract object.
 */
export const createMockProjectWithContract = (overrides?: Partial<MockProjectWithContract>): MockProjectWithContract => {
    // Generate new contract data for the mock project
    const contractId = generateRandomId().replace('proj_', 'contract_');
    const contractAddress = Keypair.random().publicKey();

    // Use the basic factory to create the base project object
    const baseProject = createMockProject(overrides);

    return {
        ...baseProject,
        contractId,
        contractAddress,
        ...overrides,
    };
};
