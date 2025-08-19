
import { 
  beforeAll, 
  afterEach, 
  afterAll 
} from 'vitest';

// --- Mock Database and Configuration ---

/**
 * A mock representation of a database to store test data.
 * This object will be reset for each test to ensure isolation.
 */
let testDatabase: {
  users: Map<string, any>;
  projects: Map<string, any>;
};

// Test environment-specific configuration
const TEST_ENV_CONFIG = {
  dbConnectionUrl: 'in-memory-db://test',
  isMocked: true,
  // Add other configurations like API keys, feature flags, etc.
};

// --- Setup and Cleanup Functions ---

/**
 * Initializes the mock database before all tests in the suite.
 */
export function setupDatabase() {
  console.log(`Setting up mock database at ${TEST_ENV_CONFIG.dbConnectionUrl}`);
  // In a real scenario, this would connect to a test database
  // or initialize a testing framework like Prisma's test client.
  testDatabase = {
    users: new Map<string, any>(),
    projects: new Map<string, any>(),
  };
}

/**
 * Cleans up the mock database after a specific test run.
 * This is crucial for test isolation to prevent state from leaking
 * between tests.
 */
export function cleanupDatabase() {
  console.log('Cleaning up mock database state...');
  // Clear all data to ensure a clean slate for the next test
  testDatabase.users.clear();
  testDatabase.projects.clear();
}

/**
 * Destroys the mock database instance after all tests are finished.
 */
export function teardownDatabase() {
  console.log('Tearing down mock database connection.');
  // In a real scenario, this would close the database connection
  // or clean up other global resources.
  // We can leave `testDatabase` undefined to signify it's no longer active.
  // @ts-ignore - We are intentionally nulling this out for the teardown
  testDatabase = null;
}

// --- Global Test Hooks ---

/**
 * A utility to get the current mock database instance.
 * @returns The mock database object.
 */
export function getTestDatabase() {
  if (!testDatabase) {
    throw new Error('Test database is not set up. Did you forget to call `setupDatabase`?');
  }
  return testDatabase;
}

// Global hooks for the entire test environment
// The `beforeAll`, `afterEach`, and `afterAll` functions come from the
// testing framework (e.g., Vitest, Jest).

/**
 * Set up the database connection once before all tests in this file run.
 */
beforeAll(() => {
  setupDatabase();
});

/**
 * Clean up the database state after each test.
 * This is the most important hook for test isolation.
 */
afterEach(() => {
  cleanupDatabase();
});

/**
 * Clean up the database connection after all tests in this file are finished.
 */
afterAll(() => {
  teardownDatabase();
});
