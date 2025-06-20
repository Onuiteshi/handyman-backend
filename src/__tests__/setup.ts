import { prisma } from '..';
import { setupTestData } from './testUtils';

// Set a longer timeout for the beforeAll hook
jest.setTimeout(30000); // 30 seconds

beforeAll(async () => {
  // Set the test database URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/handyman_test';
  
  // Initialize test data
  await setupTestData();
});

afterAll(async () => {
  // Clean up the test database
  await prisma.$disconnect();
});

// Export the Prisma client for use in tests
export { prisma };
