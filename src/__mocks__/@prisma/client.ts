// This is a manual mock for @prisma/client
const { mockDeep } = require('jest-mock-extended');

// Create a mock PrismaClient class
class PrismaClient {
  constructor() {
    // Return a deep mock of all Prisma methods
    const mock = mockDeep();
    
    // Add any default mock implementations here
    mock.serviceCategory = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    
    mock.artisan = {
      findUnique: jest.fn(),
    };
    
    mock.artisanServiceCategory = {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };
    
    return mock;
  }
}

// Create a default mock instance
const prisma = new PrismaClient();

// Export the mock PrismaClient and prisma instance
module.exports = {
  PrismaClient,
  prisma,
  mockPrisma: prisma, // Alias for backward compatibility
};

// Default export
module.exports.default = prisma;
