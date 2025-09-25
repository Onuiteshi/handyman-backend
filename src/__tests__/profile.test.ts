import { UserRole } from '../types/auth.types';
import profileService from '../services/profile.service';
import otpService from '../services/otp.service';
import { CreateProfileRequest, SwitchProfileRequest } from '../types/profile.types';

// Define ProfileType locally to avoid import issues
enum ProfileType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  FREELANCE = 'FREELANCE',
  CORPORATE = 'CORPORATE'
}

describe('ProfileService', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.CUSTOMER,
    isEmailVerified: true,
    isPhoneVerified: false,
    profileComplete: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockProfile = {
    id: 'profile-1',
    name: 'Test Profile',
    type: ProfileType.PERSONAL,
    ownerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    owner: mockUser,
    members: [],
    customerProfile: null,
    artisanProfile: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a personal profile successfully', async () => {
    // Mock Prisma
    const prisma = require('../lib/prisma');
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
    prisma.profile.create = jest.fn().mockResolvedValue(mockProfile);
    prisma.customerProfile.create = jest.fn().mockResolvedValue({ id: 'cp-1', profileId: 'profile-1' });

    const data: CreateProfileRequest = {
      name: 'Test Profile',
      type: ProfileType.PERSONAL,
      description: 'desc',
      avatar: '',
      settings: {},
      metadata: {}
    };
    const result = await profileService.createProfile('user-1', data);
    expect(result.message).toBe('Profile created successfully');
    expect(result.profile).toBeDefined();
    expect(result.profile?.name).toBe('Test Profile');
  });

  it('should get user profiles', async () => {
    const prisma = require('../lib/prisma');
    prisma.profile.findMany = jest.fn().mockResolvedValue([mockProfile]);
    const result = await profileService.getUserProfiles('user-1');
    expect(result.message).toBe('Profiles retrieved successfully');
    expect(result.profiles?.length).toBe(1);
    expect(result.profiles?.[0].id).toBe('profile-1');
  });

  it('should switch to a profile without authentication', async () => {
    const prisma = require('../lib/prisma');
    prisma.profile.findFirst = jest.fn().mockResolvedValue({ ...mockProfile, members: [{ userId: 'user-1', permissions: {} }] });
    prisma.profileSession.findFirst = jest.fn().mockResolvedValue(null);
    prisma.profileSession.create = jest.fn().mockResolvedValue({ id: 'session-1', profileId: 'profile-1', userId: 'user-1', token: 'token', refreshToken: 'refresh', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), expiresAt: new Date(), lastActivityAt: new Date() });
    const data: SwitchProfileRequest = { profileId: 'profile-1', identifier: 'test@example.com' };
    const result = await profileService.switchProfile('user-1', data);
    expect(result.message).toBe('Profile switched successfully');
    expect(result.requiresAuthentication).toBe(false);
    expect(result.session).toBeDefined();
  });

  it('should require authentication for profile switch if permissions require it', async () => {
    const prisma = require('../lib/prisma');
    prisma.profile.findFirst = jest.fn().mockResolvedValue({ ...mockProfile, members: [{ userId: 'user-1', permissions: { requireReauthentication: true } }] });
    prisma.profileSession.findFirst = jest.fn().mockResolvedValue(null);
    (otpService.sendOTP as jest.Mock) = jest.fn().mockResolvedValue(true);
    const data: SwitchProfileRequest = { profileId: 'profile-1', identifier: 'test@example.com' };
    const result = await profileService.switchProfile('user-1', data);
    expect(result.message).toBe('Authentication required for profile switch');
    expect(result.requiresAuthentication).toBe(true);
    expect(result.profile).toBeDefined();
  });
}); 