const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn()
  },
  profile: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  profileMember: {
    create: jest.fn(),
    findFirst: jest.fn()
  },
  profileSession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  profileInvitation: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  customerProfile: {
    create: jest.fn()
  },
  artisanProfile: {
    create: jest.fn()
  }
};

module.exports = {
  PrismaClient: jest.fn(() => mockPrisma),
  ProfileType: {
    PERSONAL: 'PERSONAL',
    BUSINESS: 'BUSINESS',
    FREELANCE: 'FREELANCE',
    CORPORATE: 'CORPORATE'
  },
  ProfileStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
  },
  ProfileSessionStatus: {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED'
  },
  UserRole: {
    CUSTOMER: 'CUSTOMER',
    ARTISAN: 'ARTISAN',
    ADMIN: 'ADMIN'
  },
  OTPType: {
    PROFILE_SWITCH: 'PROFILE_SWITCH'
  },
  __esModule: true,
  mockPrisma
}; 