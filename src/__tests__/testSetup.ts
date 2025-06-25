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

// Mock the Prisma client with enums
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  prisma: prismaMock,
  // Include the enums
  UserRole: {
    CUSTOMER: 'CUSTOMER',
    ARTISAN: 'ARTISAN',
    ADMIN: 'ADMIN'
  },
  AuthProvider: {
    EMAIL: 'EMAIL',
    PHONE: 'PHONE',
    OAUTH_GOOGLE: 'OAUTH_GOOGLE'
  },
  OTPType: {
    SIGNUP: 'SIGNUP',
    LOGIN: 'LOGIN',
    VERIFICATION: 'VERIFICATION',
    PROFILE_SWITCH: 'PROFILE_SWITCH'
  },
  ProfileType: {
    PERSONAL: 'PERSONAL',
    BUSINESS: 'BUSINESS',
    FREELANCE: 'FREELANCE',
    CORPORATE: 'CORPORATE'
  },
  ProfileStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    PENDING_VERIFICATION: 'PENDING_VERIFICATION'
  },
  ProfileSessionStatus: {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    REVOKED: 'REVOKED'
  },
  JobStatus: {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
  }
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
