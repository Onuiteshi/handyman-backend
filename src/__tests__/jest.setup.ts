// Load environment variables from .env.test
import { config } from 'dotenv';
config({ path: '.env.test' });

// Import test setup
import './testSetup';

// Set a longer timeout for tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Set the test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  // Use DATABASE_URL from .env.test file, with fallback
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://handyman_user:handyman_password@localhost:5432/handyman_test';
});

// Reset all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  jest.restoreAllMocks();
});
