import { PrismaClient, ProfileType, ProfileStatus, ProfileSessionStatus, UserRole, OTPType } from '../generated/prisma';
import profileService from '../services/profile.service';
import otpService from '../services/otp.service';
import {
  CreateProfileRequest,
  SwitchProfileRequest,
  ProfileAuthenticationRequest,
  InviteToProfileRequest,
  AcceptInvitationRequest,
  UpdateProfileRequest
} from '../types/profile.types';
import * as prismaLib from '../lib/prisma';

// Mock OTP service
jest.mock('../services/otp.service', () => ({
  sendOTP: jest.fn(),
  verifyOTP: jest.fn()
}));

// Mock the Prisma client used in the service
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

// Replace the Prisma client in the service with the mock
(prismaLib as any).prisma = mockPrisma;

// Get the mocked profile service
const mockedProfileService = profileService as any;

// Add missing mock objects for clarity
const mockProfile = {
  id: 'profile-123',
  name: 'Test Profile',
  type: ProfileType.PERSONAL,
  status: ProfileStatus.ACTIVE,
  ownerId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: 'user-123', name: 'Test User' },
  members: [],
  customerProfile: null,
  artisanProfile: null
};
const mockFreelanceProfile = {
  id: 'profile-123',
  name: 'Test Profile',
  type: ProfileType.FREELANCE,
  status: ProfileStatus.ACTIVE,
  ownerId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: 'user-123', name: 'Test User' },
  members: [],
  customerProfile: null,
  artisanProfile: null
};
const mockProfile1 = {
  id: 'profile-1',
  name: 'Personal Profile',
  type: ProfileType.PERSONAL,
  status: ProfileStatus.ACTIVE,
  ownerId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: 'user-123', name: 'Test User' },
  members: [],
  customerProfile: null,
  artisanProfile: null
};
const mockProfile2 = {
  id: 'profile-2',
  name: 'Business Profile',
  type: ProfileType.BUSINESS,
  status: ProfileStatus.ACTIVE,
  ownerId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: { id: 'user-123', name: 'Test User' },
  members: [],
  customerProfile: null,
  artisanProfile: null
};
const mockSession = {
  id: 'session-123',
  profileId: 'profile-123',
  userId: 'user-123',
  token: 'session-token',
  status: ProfileSessionStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  expiresAt: new Date(Date.now() + 3600 * 1000)
};
const mockMember = {
  id: 'member-123',
  profileId: 'profile-123',
  userId: 'user-123',
  role: UserRole.CUSTOMER,
  permissions: { owner: true },
  isActive: true,
  joinedAt: new Date(),
  user: { id: 'user-123', name: 'Test User' }
};
const mockInvitation = {
  id: 'invitation-123',
  profileId: 'profile-123',
  invitedEmail: 'user@example.com',
  invitedByUserId: 'inviter-123',
  role: UserRole.CUSTOMER,
  message: 'Join our team!',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  isAccepted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  profile: { id: 'profile-123', name: 'Test Profile' }
};

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CUSTOMER,
      authProvider: 'EMAIL',
      isEmailVerified: true,
      isPhoneVerified: false,
      profileComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createProfileData: CreateProfileRequest = {
      name: 'Test Profile',
      type: ProfileType.PERSONAL,
      description: 'Test description',
      avatar: 'https://example.com/avatar.jpg',
      settings: { notifications: true },
      metadata: { test: 'data' }
    };

    it('should create a personal profile successfully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.profile.create as jest.Mock).mockResolvedValue(mockProfile);
      (mockPrisma.customerProfile.create as jest.Mock).mockResolvedValue({ id: 'customer-profile-123', profileId: 'profile-123' });

      const result = await profileService.createProfile('user-123', createProfileData);

      expect(result.message).toBe('Profile created successfully');
      expect(result.profile).toBeDefined();
      expect(result.profile?.name).toBe('Test Profile');
      expect(result.profile?.type).toBe(ProfileType.PERSONAL);
      expect(mockPrisma.customerProfile.create).toHaveBeenCalledWith({
        data: {
          profileId: 'profile-123',
          preferences: {},
          billingAddress: {},
          paymentMethods: {},
          serviceHistory: {}
        }
      });
    });

    it('should create a freelance profile successfully', async () => {
      const freelanceData = { ...createProfileData, type: ProfileType.FREELANCE };
      
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.profile.create as jest.Mock).mockResolvedValue(mockFreelanceProfile);
      (mockPrisma.artisanProfile.create as jest.Mock).mockResolvedValue({
        id: 'artisan-profile-123',
        profileId: 'profile-123'
      });

      const result = await profileService.createProfile('user-123', freelanceData);

      expect(result.message).toBe('Profile created successfully');
      expect(result.profile).toBeDefined();
      expect(result.profile?.type).toBe(ProfileType.FREELANCE);
      expect(mockPrisma.artisanProfile.create).toHaveBeenCalledWith({
        data: {
          profileId: 'profile-123',
          skills: [],
          experience: 0,
          portfolio: [],
          isOnline: false,
          locationTracking: false
        }
      });
    });

    it('should throw error if user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(profileService.createProfile('invalid-user', createProfileData))
        .rejects.toThrow('User not found');
    });
  });

  describe('getUserProfiles', () => {
    const mockProfiles = [
      {
        id: 'profile-1',
        name: 'Personal Profile',
        type: ProfileType.PERSONAL,
        status: ProfileStatus.ACTIVE,
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: 'user-123', name: 'Test User' },
        members: [],
        customerProfile: null,
        artisanProfile: null
      },
      {
        id: 'profile-2',
        name: 'Business Profile',
        type: ProfileType.BUSINESS,
        status: ProfileStatus.ACTIVE,
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: 'user-123', name: 'Test User' },
        members: [],
        customerProfile: null,
        artisanProfile: null
      }
    ];

    it('should return user profiles successfully', async () => {
      (mockPrisma.profile.findMany as jest.Mock).mockResolvedValue(mockProfiles);

      const result = await profileService.getUserProfiles('user-123');

      expect(result.message).toBe('Profiles retrieved successfully');
      expect(result.profiles).toHaveLength(2);
      expect(result.profiles?.[0].name).toBe('Personal Profile');
      expect(result.profiles?.[1].name).toBe('Business Profile');
    });
  });

  describe('switchProfile', () => {
    const switchData: SwitchProfileRequest = {
      profileId: 'profile-123',
      identifier: 'test@example.com'
    };

    it('should switch to profile without authentication when not required', async () => {
      (mockPrisma.profile.findFirst as jest.Mock).mockResolvedValue(mockProfile);
      (mockPrisma.profileSession.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.profileSession.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
        profileId: 'profile-123',
        userId: 'user-123',
        token: 'session-token',
        refreshToken: 'refresh-token',
        status: ProfileSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: mockProfile,
        user: { id: 'user-123', name: 'Test User' }
      });

      const result = await profileService.switchProfile('user-123', switchData);

      expect(result.message).toBe('Profile switched successfully');
      expect(result.requiresAuthentication).toBe(false);
      expect(result.profile).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.session?.token).toBe('session-token');
    });

    it('should require authentication when permissions require it', async () => {
      const profileWithAuth = {
        id: 'profile-123',
        name: 'Test Profile',
        type: ProfileType.PERSONAL,
        status: ProfileStatus.ACTIVE,
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: 'user-123', name: 'Test User' },
        members: [{
          id: 'member-123',
          profileId: 'profile-123',
          userId: 'user-123',
          role: UserRole.CUSTOMER,
          permissions: { requireReauthentication: true },
          isActive: true,
          joinedAt: new Date(),
          user: { id: 'user-123', name: 'Test User' }
        }],
        customerProfile: null,
        artisanProfile: null
      };

      (mockPrisma.profile.findFirst as jest.Mock).mockResolvedValue(profileWithAuth);
      (mockPrisma.profileSession.findFirst as jest.Mock).mockResolvedValue(null);
      (otpService.sendOTP as jest.Mock).mockResolvedValue(true);

      const result = await profileService.switchProfile('user-123', switchData);

      expect(result.message).toBe('Authentication required for profile switch');
      expect(result.requiresAuthentication).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.session).toBeUndefined();
      expect(otpService.sendOTP).toHaveBeenCalledWith('test@example.com', OTPType.PROFILE_SWITCH, 'user-123');
    });

    it('should return existing session if already active', async () => {
      const existingSession = {
        id: 'session-123',
        profileId: 'profile-123',
        userId: 'user-123',
        token: 'existing-token',
        refreshToken: 'existing-refresh-token',
        status: ProfileSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.profile.findFirst as jest.Mock).mockResolvedValue(mockProfile);
      (mockPrisma.profileSession.findFirst as jest.Mock).mockResolvedValue(existingSession);

      const result = await profileService.switchProfile('user-123', switchData);

      expect(result.message).toBe('Profile switched successfully');
      expect(result.requiresAuthentication).toBe(false);
      expect(result.session?.token).toBe('existing-token');
    });

    it('should throw error if access denied', async () => {
      (mockPrisma.profile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(profileService.switchProfile('user-123', switchData))
        .rejects.toThrow('Access denied to this profile');
    });
  });

  describe('authenticateProfileSwitch', () => {
    const authData: ProfileAuthenticationRequest = {
      profileId: 'profile-123',
      identifier: 'test@example.com',
      otp: '123456'
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.CUSTOMER
    };

    it('should authenticate profile switch successfully', async () => {
      (otpService.verifyOTP as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.profile.findFirst as jest.Mock).mockResolvedValue({
        id: 'profile-123',
        name: 'Test Profile',
        type: ProfileType.PERSONAL,
        status: ProfileStatus.ACTIVE,
        ownerId: 'user-123'
      });
      (mockPrisma.profileSession.create as jest.Mock).mockResolvedValue({
        id: 'session-123',
        profileId: 'profile-123',
        userId: 'user-123',
        token: 'session-token',
        refreshToken: 'refresh-token',
        status: ProfileSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: { id: 'profile-123', name: 'Test Profile' },
        user: mockUser
      });

      const result = await profileService.authenticateProfileSwitch(authData);

      expect(result.message).toBe('Profile authentication successful');
      expect(result.token).toBe('session-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw error for invalid OTP', async () => {
      (otpService.verifyOTP as jest.Mock).mockResolvedValue(false);

      await expect(profileService.authenticateProfileSwitch(authData))
        .rejects.toThrow('Invalid or expired OTP');
    });

    it('should throw error if user not found', async () => {
      (otpService.verifyOTP as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(profileService.authenticateProfileSwitch(authData))
        .rejects.toThrow('User not found');
    });

    it('should throw error if access denied to profile', async () => {
      (otpService.verifyOTP as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.profile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(profileService.authenticateProfileSwitch(authData))
        .rejects.toThrow('Access denied to this profile');
    });
  });

  describe('refreshProfileSession', () => {
    it('should refresh session successfully', async () => {
      (mockPrisma.profileSession.findFirst as jest.Mock).mockResolvedValue(mockSession);
      (mockPrisma.profileSession.update as jest.Mock).mockResolvedValue({
        id: 'session-123',
        profileId: 'profile-123',
        userId: 'user-123',
        token: 'new-token',
        refreshToken: 'new-refresh-token',
        status: ProfileSessionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const result = await profileService.refreshProfileSession('refresh-token');

      expect(result.message).toBe('Session refreshed successfully');
      expect(result.token).toBe('new-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw error for invalid refresh token', async () => {
      (mockPrisma.profileSession.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(profileService.refreshProfileSession('invalid-token'))
        .rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error for expired session', async () => {
      const expiredSession = {
        id: 'session-123',
        profileId: 'profile-123',
        userId: 'user-123',
        token: 'session-token',
        status: ProfileSessionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired
      };

      (mockPrisma.profileSession.findFirst as jest.Mock).mockResolvedValue(expiredSession);
      (mockPrisma.profileSession.update as jest.Mock).mockResolvedValue({
        id: 'session-123',
        profileId: 'profile-123',
        userId: 'user-123',
        token: 'session-token',
        status: ProfileSessionStatus.EXPIRED,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });

      await expect(profileService.refreshProfileSession('refresh-token'))
        .rejects.toThrow('Session expired');
    });
  });

  describe('inviteToProfile', () => {
    const inviteData: InviteToProfileRequest = {
      profileId: 'profile-123',
      invitedEmail: 'newuser@example.com',
      role: UserRole.CUSTOMER,
      message: 'Join our team!'
    };

    it('should create invitation successfully', async () => {
      (mockPrisma.profileMember.findFirst as jest.Mock).mockResolvedValue({
        id: 'member-123',
        profileId: 'profile-123',
        userId: 'inviter-123',
        role: UserRole.CUSTOMER,
        permissions: { invite: true },
        isActive: true
      });
      (mockPrisma.profileMember.findFirst as jest.Mock).mockResolvedValueOnce(null); // No existing member
      (mockPrisma.profileInvitation.create as jest.Mock).mockResolvedValue({
        id: 'invitation-123',
        profileId: 'profile-123',
        invitedEmail: 'newuser@example.com',
        invitedByUserId: 'inviter-123',
        role: UserRole.CUSTOMER,
        message: 'Join our team!',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isAccepted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: { id: 'profile-123', name: 'Test Profile' },
        invitedBy: { id: 'inviter-123', name: 'Inviter' }
      });

      const result = await profileService.inviteToProfile('inviter-123', inviteData);

      expect(result.message).toBe('Invitation sent successfully');
      expect(result.invitation).toBeDefined();
      expect(result.invitation?.invitedEmail).toBe('newuser@example.com');
    });

    it('should throw error if no permission to invite', async () => {
      (mockPrisma.profileMember.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(profileService.inviteToProfile('inviter-123', inviteData))
        .rejects.toThrow('No permission to invite users to this profile');
    });
  });

  describe('acceptInvitation', () => {
    const acceptData: AcceptInvitationRequest = {
      invitationId: 'invitation-123',
      userId: 'user-123'
    };

    it('should accept invitation successfully', async () => {
      (mockPrisma.profileInvitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation);
      (mockPrisma.profileMember.create as jest.Mock).mockResolvedValue({
        id: 'member-123',
        profileId: 'profile-123',
        userId: 'user-123',
        role: UserRole.CUSTOMER,
        isActive: true,
        joinedAt: new Date(),
        profile: { id: 'profile-123', name: 'Test Profile' },
        user: { id: 'user-123', name: 'Test User' }
      });
      (mockPrisma.profileInvitation.update as jest.Mock).mockResolvedValue({
        ...mockInvitation,
        isAccepted: true,
        acceptedAt: new Date(),
        acceptedByUserId: 'user-123'
      });

      const result = await profileService.acceptInvitation(acceptData);

      expect(result.message).toBe('Invitation accepted successfully');
      expect(result.profile).toBeDefined();
    });

    it('should throw error if invitation not found', async () => {
      (mockPrisma.profileInvitation.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(profileService.acceptInvitation(acceptData))
        .rejects.toThrow('Invitation not found');
    });

    it('should throw error if invitation already accepted', async () => {
      const acceptedInvitation = {
        id: 'invitation-123',
        isAccepted: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      (mockPrisma.profileInvitation.findUnique as jest.Mock).mockResolvedValue(acceptedInvitation);

      await expect(profileService.acceptInvitation(acceptData))
        .rejects.toThrow('Invitation already accepted');
    });

    it('should throw error if invitation expired', async () => {
      const expiredInvitation = {
        id: 'invitation-123',
        isAccepted: false,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired
      };

      (mockPrisma.profileInvitation.findUnique as jest.Mock).mockResolvedValue(expiredInvitation);

      await expect(profileService.acceptInvitation(acceptData))
        .rejects.toThrow('Invitation expired');
    });
  });

  describe('updateProfile', () => {
    const updateData: UpdateProfileRequest = {
      name: 'Updated Profile Name',
      description: 'Updated description',
      avatar: 'https://example.com/new-avatar.jpg'
    };

    it('should update profile successfully', async () => {
      (mockPrisma.profileMember.findFirst as jest.Mock).mockResolvedValue({
        id: 'member-123',
        profileId: 'profile-123',
        userId: 'user-123',
        role: UserRole.CUSTOMER,
        permissions: { edit: true },
        isActive: true
      });
      (mockPrisma.profile.update as jest.Mock).mockResolvedValue({
        id: 'profile-123',
        name: 'Updated Profile Name',
        description: 'Updated description',
        avatar: 'https://example.com/new-avatar.jpg',
        type: ProfileType.PERSONAL,
        status: ProfileStatus.ACTIVE,
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: 'user-123', name: 'Test User' },
        members: [],
        customerProfile: null,
        artisanProfile: null
      });

      const result = await profileService.updateProfile('profile-123', 'user-123', updateData);

      expect(result.message).toBe('Profile updated successfully');
      expect(result.profile?.name).toBe('Updated Profile Name');
      expect(result.profile?.description).toBe('Updated description');
    });

    it('should throw error if no permission to update', async () => {
      (mockPrisma.profileMember.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(profileService.updateProfile('profile-123', 'user-123', updateData))
        .rejects.toThrow('No permission to update this profile');
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile successfully', async () => {
      (mockPrisma.profile.findFirst as jest.Mock).mockResolvedValue({
        id: 'profile-123',
        name: 'Test Profile',
        ownerId: 'user-123'
      });
      (mockPrisma.profile.delete as jest.Mock).mockResolvedValue({
        id: 'profile-123',
        name: 'Test Profile'
      });

      await expect(profileService.deleteProfile('profile-123', 'user-123'))
        .resolves.not.toThrow();
    });

    it('should throw error if not profile owner', async () => {
      (mockPrisma.profile.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(profileService.deleteProfile('profile-123', 'user-123'))
        .rejects.toThrow('Only profile owner can delete the profile');
    });
  });

  describe('getProfileAnalytics', () => {
    it('should return profile analytics successfully', async () => {
      (mockPrisma.profileMember.findFirst as jest.Mock).mockResolvedValue({
        id: 'member-123',
        profileId: 'profile-123',
        userId: 'user-123',
        role: UserRole.CUSTOMER,
        isActive: true
      });
      (mockPrisma.profileSession.count as jest.Mock)
        .mockResolvedValueOnce(10) // totalSessions
        .mockResolvedValueOnce(5)  // activeSessions
        .mockResolvedValueOnce(3)  // memberCount
        .mockResolvedValueOnce(15); // switchCount
      (mockPrisma.profileSession.findFirst as jest.Mock).mockResolvedValue({
        lastActivityAt: new Date()
      });

      const result = await profileService.getProfileAnalytics('profile-123', 'user-123');

      expect(result.profileId).toBe('profile-123');
      expect(result.totalSessions).toBe(10);
      expect(result.activeSessions).toBe(5);
      expect(result.memberCount).toBe(3);
      expect(result.switchCount).toBe(15);
    });

    it('should throw error if no access to profile', async () => {
      (mockPrisma.profileMember.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(profileService.getProfileAnalytics('profile-123', 'user-123'))
        .rejects.toThrow('No access to this profile');
    });
  });
}); 