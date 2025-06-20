// Import the manual mock for @prisma/client
const { PrismaClient, prisma } = require('../__mocks__/@prisma/client');

// Mock the Prisma client globally
jest.mock('@prisma/client', () => {
  const originalModule = jest.requireActual('@prisma/client');
  return {
    ...originalModule,
    PrismaClient: jest.fn(() => prisma),
    prisma,
  };
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset all mock implementations
  Object.values(prisma).forEach((mock: any) => {
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach((method: any) => {
        if (typeof method === 'function' && method.mock) {
          method.mockClear();
        }
      });
    }
  });
});

// Export the mock for use in tests
export const prismaMock = prisma;
export const prismaMockInstance = prisma; // Alias for backward compatibility

export default prisma;
