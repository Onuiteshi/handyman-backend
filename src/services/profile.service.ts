import prisma from '../lib/prisma';
import { UserRole, OTPType } from '../types/auth.types';
import { generateToken, generateRefreshToken, generateSessionToken } from '../utils/auth.utils';
import otpService from './otp.service';
import {
  Profile,
  ProfileMember,
  ProfileSession,
  ProfileInvitation,
  CustomerProfile,
  ArtisanProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
  SwitchProfileRequest,
  ProfileAuthenticationRequest,
  InviteToProfileRequest,
  AcceptInvitationRequest,
  CustomerProfileRequest,
  ArtisanProfileRequest,
  ProfileResponse,
  ProfileSessionResponse,
  ProfileInvitationResponse,
  ProfileSwitchResponse,
  ProfileTokenPayload,
  ProfileCache,
  ProfileSessionCache,
  ProfileError,
  ProfileEvent,
  ProfileAnalytics,
  ProfileSecuritySettings,
  ProfileNotification
} from '../types/profile.types';

// Define enums locally to avoid import issues
enum ProfileType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  FREELANCE = 'FREELANCE',
  CORPORATE = 'CORPORATE'
}

enum ProfileStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

enum ProfileSessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED'
}

// In-memory cache for profiles and sessions (in production, use Redis)
const profileCache = new Map<string, ProfileCache>();
const sessionCache = new Map<string, ProfileSessionCache>();

export class ProfileService {
  private static instance: ProfileService;

  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  /**
   * Create a new profile for a user
   */
  public async createProfile(userId: string, data: CreateProfileRequest): Promise<ProfileResponse> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create profile
      const profile = await prisma.profile.create({
        data: {
          name: data.name,
          type: data.type,
          description: data.description,
          avatar: data.avatar,
          settings: data.settings,
          metadata: data.metadata,
          ownerId: userId,
          members: {
            create: {
              userId: userId,
              role: user.role,
              permissions: { owner: true },
              isActive: true
            }
          }
        },
        include: {
          owner: true,
          members: {
            include: {
              user: true
            }
          }
        }
      });

      // Create profile-specific data based on type
      if (data.type === ProfileType.PERSONAL || data.type === ProfileType.BUSINESS) {
        await prisma.customerProfile.create({
          data: {
            profileId: profile.id,
            preferences: {},
            billingAddress: {},
            paymentMethods: {},
            serviceHistory: {}
          }
        });
      }

      if (data.type === ProfileType.FREELANCE || data.type === ProfileType.CORPORATE) {
        await prisma.artisanProfile.create({
          data: {
            profileId: profile.id,
            skills: [],
            experience: 0,
            portfolio: [],
            isOnline: false,
            locationTracking: false
          }
        });
      }

      // Cache the profile
      this.cacheProfile(profile);

      // Emit profile created event
      this.emitProfileEvent({
        type: 'PROFILE_CREATED',
        profileId: profile.id,
        userId: userId,
        data: { profileType: data.type },
        timestamp: new Date()
      });

      return {
        message: 'Profile created successfully',
        profile: this.convertPrismaProfileToProfile(profile)
      };
    } catch (error) {
      console.error('Create profile error:', error);
      throw error;
    }
  }

  /**
   * Get all profiles for a user
   */
  public async getUserProfiles(userId: string): Promise<ProfileResponse> {
    try {
      const profiles = await prisma.profile.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId,
                  isActive: true
                }
              }
            }
          ]
        },
        include: {
          owner: true,
          members: {
            include: {
              user: true
            }
          },
          customerProfile: true,
          artisanProfile: true
        }
      });

      return {
        message: 'Profiles retrieved successfully',
        profiles: profiles.map((p: any) => this.convertPrismaProfileToProfile(p))
      };
    } catch (error) {
      console.error('Get user profiles error:', error);
      throw error;
    }
  }

  /**
   * Switch to a profile (with authentication if needed)
   */
  public async switchProfile(userId: string, data: SwitchProfileRequest): Promise<ProfileSwitchResponse> {
    try {
      // Check if user has access to this profile
      const profileAccess = await prisma.profile.findFirst({
        where: {
          id: data.profileId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId,
                  isActive: true
                }
              }
            }
          ]
        },
        include: {
          owner: true,
          members: {
            where: { userId: userId },
            include: { user: true }
          },
          customerProfile: true,
          artisanProfile: true
        }
      });

      if (!profileAccess) {
        throw new Error('Access denied to this profile');
      }

      // Check if user has an active session for this profile
      const existingSession = await prisma.profileSession.findFirst({
        where: {
          profileId: data.profileId,
          userId: userId,
          status: ProfileSessionStatus.ACTIVE,
          expiresAt: { gt: new Date() }
        }
      });

      if (existingSession) {
        // User already has an active session, return it
        return {
          message: 'Profile switched successfully',
          requiresAuthentication: false,
          profile: this.convertPrismaProfileToProfile(profileAccess),
          session: {
            message: 'Active session found',
            token: existingSession.token,
            refreshToken: existingSession.refreshToken,
            expiresAt: existingSession.expiresAt
          }
        };
      }

      // Check if user needs to authenticate for this profile
      const member = profileAccess.members.find((m: any) => m.userId === userId);
      const permissions = member?.permissions as Record<string, any> || {};
      const requiresAuth = permissions.requireReauthentication || false;

      if (requiresAuth) {
        // Send OTP for authentication
        const otpSent = await otpService.sendOTP(data.identifier, OTPType.PROFILE_SWITCH, userId);
        
        if (!otpSent) {
          throw new Error('Failed to send authentication OTP');
        }

        return {
          message: 'Authentication required for profile switch',
          requiresAuthentication: true,
          profile: this.convertPrismaProfileToProfile(profileAccess)
        };
      }

      // No authentication required, create session directly
      const session = await this.createProfileSession(userId, data.profileId);

      return {
        message: 'Profile switched successfully',
        requiresAuthentication: false,
        profile: this.convertPrismaProfileToProfile(profileAccess),
        session: {
          message: 'Session created successfully',
          token: session.token,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt
        }
      };
    } catch (error) {
      console.error('Switch profile error:', error);
      throw error;
    }
  }

  /**
   * Authenticate for profile switch
   */
  public async authenticateProfileSwitch(data: ProfileAuthenticationRequest): Promise<ProfileSessionResponse> {
    try {
      // Verify OTP
      const isValidOTP = await otpService.verifyOTP(data.identifier, data.otp, OTPType.PROFILE_SWITCH);

      if (!isValidOTP) {
        throw new Error('Invalid or expired OTP');
      }

      // Find user by identifier
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.identifier },
            { phone: data.identifier }
          ]
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has access to this profile
      const profileAccess = await prisma.profile.findFirst({
        where: {
          id: data.profileId,
          OR: [
            { ownerId: user.id },
            {
              members: {
                some: {
                  userId: user.id,
                  isActive: true
                }
              }
            }
          ]
        }
      });

      if (!profileAccess) {
        throw new Error('Access denied to this profile');
      }

      // Create session
      const session = await this.createProfileSession(user.id, data.profileId);

      return {
        message: 'Profile authentication successful',
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt
      };
    } catch (error) {
      console.error('Profile authentication error:', error);
      throw error;
    }
  }

  /**
   * Create a profile session
   */
  private async createProfileSession(userId: string, profileId: string): Promise<ProfileSession> {
    const token = generateSessionToken();
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await prisma.profileSession.create({
      data: {
        profileId,
        userId,
        token,
        refreshToken,
        expiresAt,
        status: ProfileSessionStatus.ACTIVE
      },
      include: {
        profile: true,
        user: true
      }
    });

    // Cache the session
    this.cacheSession(session);

    return this.convertPrismaSessionToSession(session);
  }

  /**
   * Refresh profile session
   */
  public async refreshProfileSession(refreshToken: string): Promise<ProfileSessionResponse> {
    try {
      const session = await prisma.profileSession.findFirst({
        where: { refreshToken },
        include: {
          profile: true,
          user: true
        }
      });

      if (!session || session.status !== ProfileSessionStatus.ACTIVE) {
        throw new Error('Invalid or expired refresh token');
      }

      if (session.expiresAt < new Date()) {
        // Update session status to expired
        await prisma.profileSession.update({
          where: { id: session.id },
          data: { status: ProfileSessionStatus.EXPIRED }
        });
        throw new Error('Session expired');
      }

      // Generate new tokens
      const newToken = generateSessionToken();
      const newRefreshToken = generateRefreshToken();
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const updatedSession = await prisma.profileSession.update({
        where: { id: session.id },
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresAt: newExpiresAt,
          lastActivityAt: new Date()
        },
        include: {
          profile: true,
          user: true
        }
      });

      // Update cache
      this.cacheSession(updatedSession);

      return {
        message: 'Session refreshed successfully',
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt
      };
    } catch (error) {
      console.error('Refresh session error:', error);
      throw error;
    }
  }

  /**
   * Revoke profile session
   */
  public async revokeProfileSession(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await prisma.profileSession.findFirst({
        where: {
          id: sessionId,
          userId: userId
        }
      });

      if (!session) {
        throw new Error('Session not found');
      }

      await prisma.profileSession.update({
        where: { id: sessionId },
        data: { status: ProfileSessionStatus.REVOKED }
      });

      // Remove from cache
      sessionCache.delete(sessionId);
    } catch (error) {
      console.error('Revoke session error:', error);
      throw error;
    }
  }

  /**
   * Invite user to profile
   */
  public async inviteToProfile(inviterId: string, data: InviteToProfileRequest): Promise<ProfileInvitationResponse> {
    try {
      // Check if inviter has permission to invite
      const inviterAccess = await prisma.profileMember.findFirst({
        where: {
          profileId: data.profileId,
          userId: inviterId,
          isActive: true
        }
      });

      if (!inviterAccess) {
        throw new Error('No permission to invite users to this profile');
      }

      // Check if user already has access
      const existingMember = await prisma.profileMember.findFirst({
        where: {
          profileId: data.profileId,
          userId: inviterId
        }
      });

      if (existingMember) {
        throw new Error('User already has access to this profile');
      }

      // Create invitation
      const invitation = await prisma.profileInvitation.create({
        data: {
          profileId: data.profileId,
          invitedEmail: data.invitedEmail,
          invitedPhone: data.invitedPhone,
          invitedByUserId: inviterId,
          role: data.role,
          message: data.message,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        include: {
          profile: true,
          invitedBy: true
        }
      });

      return {
        message: 'Invitation sent successfully',
        invitation: this.convertPrismaInvitationToInvitation(invitation)
      };
    } catch (error) {
      console.error('Invite to profile error:', error);
      throw error;
    }
  }

  /**
   * Accept profile invitation
   */
  public async acceptInvitation(data: AcceptInvitationRequest): Promise<ProfileResponse> {
    try {
      const invitation = await prisma.profileInvitation.findUnique({
        where: { id: data.invitationId },
        include: {
          profile: true
        }
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.isAccepted) {
        throw new Error('Invitation already accepted');
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation expired');
      }

      // Add user as member
      const member = await prisma.profileMember.create({
        data: {
          profileId: invitation.profileId,
          userId: data.userId,
          role: invitation.role,
          isActive: true
        },
        include: {
          profile: true,
          user: true
        }
      });

      // Update invitation
      await prisma.profileInvitation.update({
        where: { id: data.invitationId },
        data: {
          isAccepted: true,
          acceptedAt: new Date(),
          acceptedByUserId: data.userId
        }
      });

      return {
        message: 'Invitation accepted successfully',
        profile: this.convertPrismaProfileToProfile(member.profile)
      };
    } catch (error) {
      console.error('Accept invitation error:', error);
      throw error;
    }
  }

  /**
   * Update profile
   */
  public async updateProfile(profileId: string, userId: string, data: UpdateProfileRequest): Promise<ProfileResponse> {
    try {
      // Check if user has permission to update
      const member = await prisma.profileMember.findFirst({
        where: {
          profileId: profileId,
          userId: userId,
          isActive: true
        }
      });

      if (!member) {
        throw new Error('No permission to update this profile');
      }

      const profile = await prisma.profile.update({
        where: { id: profileId },
        data: {
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          settings: data.settings,
          metadata: data.metadata
        },
        include: {
          owner: true,
          members: {
            include: {
              user: true
            }
          },
          customerProfile: true,
          artisanProfile: true
        }
      });

      // Update cache
      this.cacheProfile(profile);

      // Emit profile updated event
      this.emitProfileEvent({
        type: 'PROFILE_UPDATED',
        profileId: profileId,
        userId: userId,
        data: data,
        timestamp: new Date()
      });

      return {
        message: 'Profile updated successfully',
        profile: this.convertPrismaProfileToProfile(profile)
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Delete profile
   */
  public async deleteProfile(profileId: string, userId: string): Promise<void> {
    try {
      // Check if user is the owner
      const profile = await prisma.profile.findFirst({
        where: {
          id: profileId,
          ownerId: userId
        }
      });

      if (!profile) {
        throw new Error('Only profile owner can delete the profile');
      }

      // Delete profile (cascade will handle related data)
      await prisma.profile.delete({
        where: { id: profileId }
      });

      // Remove from cache
      profileCache.delete(profileId);

      // Emit profile deleted event
      this.emitProfileEvent({
        type: 'PROFILE_DELETED',
        profileId: profileId,
        userId: userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Delete profile error:', error);
      throw error;
    }
  }

  /**
   * Get profile analytics
   */
  public async getProfileAnalytics(profileId: string, userId: string): Promise<ProfileAnalytics> {
    try {
      // Check if user has access
      const member = await prisma.profileMember.findFirst({
        where: {
          profileId: profileId,
          userId: userId,
          isActive: true
        }
      });

      if (!member) {
        throw new Error('No access to this profile');
      }

      const [totalSessions, activeSessions, memberCount, switchCount] = await Promise.all([
        prisma.profileSession.count({
          where: { profileId: profileId }
        }),
        prisma.profileSession.count({
          where: {
            profileId: profileId,
            status: ProfileSessionStatus.ACTIVE,
            expiresAt: { gt: new Date() }
          }
        }),
        prisma.profileMember.count({
          where: {
            profileId: profileId,
            isActive: true
          }
        }),
        prisma.profileSession.count({
          where: {
            profileId: profileId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      const lastActivity = await prisma.profileSession.findFirst({
        where: { profileId: profileId },
        orderBy: { lastActivityAt: 'desc' },
        select: { lastActivityAt: true }
      });

      return {
        profileId,
        totalSessions,
        activeSessions,
        lastActivity: lastActivity?.lastActivityAt || new Date(),
        memberCount,
        switchCount,
        averageSessionDuration: 0 // Calculate based on your needs
      };
    } catch (error) {
      console.error('Get profile analytics error:', error);
      throw error;
    }
  }

  /**
   * Cache management methods
   */
  private cacheProfile(profile: any): void {
    const cacheKey = `profile:${profile.id}`;
    profileCache.set(cacheKey, {
      profileId: profile.id,
      userId: profile.ownerId,
      profile: this.convertPrismaProfileToProfile(profile),
      lastAccessed: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });
  }

  private cacheSession(session: any): void {
    const cacheKey = `session:${session.id}`;
    sessionCache.set(cacheKey, {
      sessionId: session.id,
      profileId: session.profileId,
      userId: session.userId,
      token: session.token,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt
    });
  }

  /**
   * Event emission (in production, use a proper event system)
   */
  private emitProfileEvent(event: ProfileEvent): void {
    // In production, emit to Redis, WebSocket, or message queue
    console.log('Profile event:', event);
  }

  /**
   * Conversion methods
   */
  private convertPrismaProfileToProfile(prismaProfile: any): Profile {
    return {
      id: prismaProfile.id,
      name: prismaProfile.name,
      type: prismaProfile.type,
      status: prismaProfile.status,
      description: prismaProfile.description,
      avatar: prismaProfile.avatar,
      settings: prismaProfile.settings,
      metadata: prismaProfile.metadata,
      ownerId: prismaProfile.ownerId,
      createdAt: prismaProfile.createdAt,
      updatedAt: prismaProfile.updatedAt,
      owner: prismaProfile.owner ? this.convertPrismaUserToUser(prismaProfile.owner) : undefined,
      members: prismaProfile.members?.map((m: any) => this.convertPrismaMemberToMember(m)) || [],
      customerProfile: prismaProfile.customerProfile ? this.convertPrismaCustomerProfileToCustomerProfile(prismaProfile.customerProfile) : undefined,
      artisanProfile: prismaProfile.artisanProfile ? this.convertPrismaArtisanProfileToArtisanProfile(prismaProfile.artisanProfile) : undefined
    };
  }

  private convertPrismaMemberToMember(prismaMember: any): ProfileMember {
    return {
      id: prismaMember.id,
      profileId: prismaMember.profileId,
      userId: prismaMember.userId,
      role: prismaMember.role,
      permissions: prismaMember.permissions,
      isActive: prismaMember.isActive,
      joinedAt: prismaMember.joinedAt,
      profile: prismaMember.profile ? this.convertPrismaProfileToProfile(prismaMember.profile) : undefined,
      user: prismaMember.user ? this.convertPrismaUserToUser(prismaMember.user) : undefined
    };
  }

  private convertPrismaSessionToSession(prismaSession: any): ProfileSession {
    return {
      id: prismaSession.id,
      profileId: prismaSession.profileId,
      userId: prismaSession.userId,
      token: prismaSession.token,
      refreshToken: prismaSession.refreshToken,
      status: prismaSession.status,
      expiresAt: prismaSession.expiresAt,
      lastActivityAt: prismaSession.lastActivityAt,
      ipAddress: prismaSession.ipAddress,
      userAgent: prismaSession.userAgent,
      deviceInfo: prismaSession.deviceInfo,
      createdAt: prismaSession.createdAt,
      updatedAt: prismaSession.updatedAt,
      profile: prismaSession.profile ? this.convertPrismaProfileToProfile(prismaSession.profile) : undefined,
      user: prismaSession.user ? this.convertPrismaUserToUser(prismaSession.user) : undefined
    };
  }

  private convertPrismaInvitationToInvitation(prismaInvitation: any): ProfileInvitation {
    return {
      id: prismaInvitation.id,
      profileId: prismaInvitation.profileId,
      invitedEmail: prismaInvitation.invitedEmail,
      invitedPhone: prismaInvitation.invitedPhone,
      invitedByUserId: prismaInvitation.invitedByUserId,
      role: prismaInvitation.role,
      message: prismaInvitation.message,
      expiresAt: prismaInvitation.expiresAt,
      isAccepted: prismaInvitation.isAccepted,
      acceptedAt: prismaInvitation.acceptedAt,
      acceptedByUserId: prismaInvitation.acceptedByUserId,
      createdAt: prismaInvitation.createdAt,
      updatedAt: prismaInvitation.updatedAt,
      profile: prismaInvitation.profile ? this.convertPrismaProfileToProfile(prismaInvitation.profile) : undefined,
      invitedBy: prismaInvitation.invitedBy ? this.convertPrismaUserToUser(prismaInvitation.invitedBy) : undefined,
      acceptedBy: prismaInvitation.acceptedBy ? this.convertPrismaUserToUser(prismaInvitation.acceptedBy) : undefined
    };
  }

  private convertPrismaUserToUser(prismaUser: any): any {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      phone: prismaUser.phone,
      name: prismaUser.name,
      dateOfBirth: prismaUser.dateOfBirth,
      role: prismaUser.role,
      authProvider: prismaUser.authProvider,
      isEmailVerified: prismaUser.isEmailVerified,
      isPhoneVerified: prismaUser.isPhoneVerified,
      profileComplete: prismaUser.profileComplete,
      googleId: prismaUser.googleId,
      avatar: prismaUser.avatar,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    };
  }

  private convertPrismaCustomerProfileToCustomerProfile(prismaCustomerProfile: any): CustomerProfile {
    return {
      id: prismaCustomerProfile.id,
      profileId: prismaCustomerProfile.profileId,
      preferences: prismaCustomerProfile.preferences,
      billingAddress: prismaCustomerProfile.billingAddress,
      paymentMethods: prismaCustomerProfile.paymentMethods,
      serviceHistory: prismaCustomerProfile.serviceHistory,
      createdAt: prismaCustomerProfile.createdAt,
      updatedAt: prismaCustomerProfile.updatedAt,
      profile: prismaCustomerProfile.profile ? this.convertPrismaProfileToProfile(prismaCustomerProfile.profile) : undefined
    };
  }

  private convertPrismaArtisanProfileToArtisanProfile(prismaArtisanProfile: any): ArtisanProfile {
    return {
      id: prismaArtisanProfile.id,
      profileId: prismaArtisanProfile.profileId,
      skills: prismaArtisanProfile.skills,
      experience: prismaArtisanProfile.experience,
      portfolio: prismaArtisanProfile.portfolio,
      bio: prismaArtisanProfile.bio,
      photoUrl: prismaArtisanProfile.photoUrl,
      idDocumentUrl: prismaArtisanProfile.idDocumentUrl,
      isOnline: prismaArtisanProfile.isOnline,
      locationTracking: prismaArtisanProfile.locationTracking,
      latitude: prismaArtisanProfile.latitude,
      longitude: prismaArtisanProfile.longitude,
      lastSeen: prismaArtisanProfile.lastSeen,
      hourlyRate: prismaArtisanProfile.hourlyRate,
      availability: prismaArtisanProfile.availability,
      createdAt: prismaArtisanProfile.createdAt,
      updatedAt: prismaArtisanProfile.updatedAt,
      profile: prismaArtisanProfile.profile ? this.convertPrismaProfileToProfile(prismaArtisanProfile.profile) : undefined,
      categories: prismaArtisanProfile.categories?.map((c: any) => this.convertPrismaArtisanProfileServiceCategoryToArtisanProfileServiceCategory(c)) || []
    };
  }

  private convertPrismaArtisanProfileServiceCategoryToArtisanProfileServiceCategory(prismaCategory: any): any {
    return {
      artisanProfileId: prismaCategory.artisanProfileId,
      categoryId: prismaCategory.categoryId,
      createdAt: prismaCategory.createdAt,
      artisanProfile: prismaCategory.artisanProfile ? this.convertPrismaArtisanProfileToArtisanProfile(prismaCategory.artisanProfile) : undefined,
      category: prismaCategory.category
    };
  }
}

export default ProfileService.getInstance(); 