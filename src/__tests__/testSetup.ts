// Import the manual mock for @prisma/client
import { mockDeep } from 'jest-mock-extended';

// Create a deep mock of the Prisma client
const prismaMock = mockDeep<any>();

// Add default mock implementations for artisan-related methods
prismaMock.artisan = {
  findUnique: jest.fn(),
  update: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  delete: jest.fn()
};

// Mock the Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  prisma: prismaMock,
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset all mock implementations
  Object.values(prismaMock).forEach((mock: any) => {
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach((method: any) => {
        if (typeof method === 'function' && method.mock) {
          method.mockClear();
        }
      });
    }
  });
  
  // Set up default mock implementations
  prismaMock.artisan.update.mockImplementation((data: any) => 
    Promise.resolve({ id: 'test-artisan-id', ...data.data })
  );
  
  prismaMock.artisan.findUnique.mockImplementation((data: any) => 
    Promise.resolve({
      id: 'test-artisan-id',
      isOnline: false,
      locationTracking: false,
      latitude: null,
      longitude: null,
      lastSeen: null,
      ...data?.where
    })
  );
});

// Export the mock for use in tests
export { prismaMock };

export default prismaMock;
