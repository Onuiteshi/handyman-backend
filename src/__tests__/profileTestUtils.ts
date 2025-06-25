const { PrismaClient } = require('@prisma/client');
import { generateToken, generateProfileToken, generateRefreshToken } from '../utils/auth.utils';
import { UserRole, AuthProvider } from '../types/auth.types';

// Define ProfileType locally to avoid import issues
enum ProfileType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  FREELANCE = 'FREELANCE',
  CORPORATE = 'CORPORATE'
}

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}

export interface TestProfile {
  id: string;
  name: string;
  type: ProfileType;
  ownerId: string;
  profileToken?: string;
  refreshToken?: string;
}

export interface TestInvitation {
  id: string;
  profileId: string;
  invitedEmail: string;
  role: UserRole;
}

export class ProfileTestUtils {
  private static testUsers: TestUser[] = [];
  private static testProfiles: TestProfile[] = [];
  private static testInvitations: TestInvitation[] = [];

  /**
   * Create a test user with specified role
   */
  static async createTestUser(
    email: string,
    name: string,
    role: UserRole = UserRole.CUSTOMER
  ): Promise<TestUser> {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        authProvider: AuthProvider.EMAIL,
        isEmailVerified: true,
        isPhoneVerified: false,
        profileComplete: true,
        password: '$2a$10$test.hash'
      }
    });

    const token = generateToken({
      id: user.id,
      role,
      authProvider: AuthProvider.EMAIL,
      isEmailVerified: true,
      isPhoneVerified: false,
      profileComplete: true
    });

    const testUser: TestUser = {
      id: user.id,
      email: user.email || '',
      name: user.name,
      role: user.role,
      token
    };

    this.testUsers.push(testUser);
    return testUser;
  }

  /**
   * Create a test profile for a user
   */
  static async createTestProfile(
    ownerId: string,
    name: string,
    type: ProfileType = ProfileType.PERSONAL,
    description?: string
  ): Promise<TestProfile> {
    const profile = await prisma.profile.create({
      data: {
        name,
        type,
        description: description || `Test ${type.toLowerCase()} profile`,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: UserRole.CUSTOMER,
            permissions: { invite: true, edit: true, delete: true },
            isActive: true
          }
        }
      }
    });

    const testProfile: TestProfile = {
      id: profile.id,
      name: profile.name,
      type: profile.type,
      ownerId: profile.ownerId
    };

    this.testProfiles.push(testProfile);
    return testProfile;
  }

  /**
   * Create a test profile with session tokens
   */
  static async createTestProfileWithSession(
    ownerId: string,
    name: string,
    type: ProfileType = ProfileType.PERSONAL
  ): Promise<TestProfile> {
    const profile = await this.createTestProfile(ownerId, name, type);

    // Create a profile session
    const session = await prisma.profileSession.create({
      data: {
        profileId: profile.id,
        userId: ownerId,
        token: generateRefreshToken(),
        refreshToken: generateRefreshToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    const profileToken = generateProfileToken({
      id: session.id,
      profileId: profile.id,
      userId: ownerId,
      role: UserRole.CUSTOMER,
      profileType: type
    });

    const refreshToken = generateRefreshToken();

    profile.profileToken = profileToken;
    profile.refreshToken = refreshToken;

    return profile;
  }

  /**
   * Create a test invitation
   */
  static async createTestInvitation(
    profileId: string,
    invitedEmail: string,
    role: UserRole = UserRole.CUSTOMER,
    invitedByUserId?: string
  ): Promise<TestInvitation> {
    const invitation = await prisma.profileInvitation.create({
      data: {
        profileId,
        invitedEmail,
        invitedByUserId: invitedByUserId || this.testUsers[0]?.id || '',
        role,
        message: 'Test invitation',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    const testInvitation: TestInvitation = {
      id: invitation.id,
      profileId: invitation.profileId,
      invitedEmail: invitation.invitedEmail || '',
      role: invitation.role
    };

    this.testInvitations.push(testInvitation);
    return testInvitation;
  }

  /**
   * Create customer profile data
   */
  static createCustomerProfileData() {
    return {
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: false,
          sms: true
        }
      },
      billingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      paymentMethods: {
        default: 'card',
        cards: ['visa', 'mastercard'],
        savedMethods: [
          {
            id: 'card_1',
            type: 'card',
            last4: '4242',
            brand: 'visa'
          }
        ]
      },
      serviceHistory: {
        totalServices: 15,
        totalSpent: 1250.00,
        favoriteCategories: ['Plumbing', 'Electrical']
      }
    };
  }

  /**
   * Create artisan profile data
   */
  static createArtisanProfileData() {
    return {
      skills: ['Plumbing', 'Electrical', 'Carpentry', 'Painting'],
      experience: 8,
      portfolio: [
        'https://example.com/work1.jpg',
        'https://example.com/work2.jpg',
        'https://example.com/work3.jpg'
      ],
      bio: 'Experienced handyman with 8+ years of professional experience in residential and commercial projects.',
      photoUrl: 'https://example.com/artisan-photo.jpg',
      hourlyRate: 35.00,
      availability: {
        monday: { start: '08:00', end: '18:00', available: true },
        tuesday: { start: '08:00', end: '18:00', available: true },
        wednesday: { start: '08:00', end: '18:00', available: true },
        thursday: { start: '08:00', end: '18:00', available: true },
        friday: { start: '08:00', end: '18:00', available: true },
        saturday: { start: '09:00', end: '16:00', available: true },
        sunday: { start: '10:00', end: '14:00', available: false }
      },
      certifications: [
        {
          name: 'Licensed Plumber',
          issuer: 'State Board',
          issueDate: '2020-01-15',
          expiryDate: '2025-01-15'
        },
        {
          name: 'Electrical Safety Certification',
          issuer: 'Safety Institute',
          issueDate: '2019-06-20',
          expiryDate: '2024-06-20'
        }
      ],
      insurance: {
        hasInsurance: true,
        provider: 'Professional Insurance Co',
        policyNumber: 'POL-123456',
        coverageAmount: 1000000
      },
      serviceAreas: [
        {
          city: 'New York',
          state: 'NY',
          radius: 25
        },
        {
          city: 'Brooklyn',
          state: 'NY',
          radius: 20
        }
      ]
    };
  }

  /**
   * Create business profile data
   */
  static createBusinessProfileData() {
    return {
      businessInfo: {
        name: 'Test Business LLC',
        type: 'LLC',
        taxId: '12-3456789',
        founded: '2020-01-01',
        website: 'https://testbusiness.com',
        phone: '+1-555-0123'
      },
      address: {
        street: '456 Business Ave',
        city: 'Business City',
        state: 'BC',
        zipCode: '54321',
        country: 'Business Country'
      },
      team: {
        size: 5,
        roles: ['Manager', 'Technician', 'Customer Service'],
        specialties: ['Residential', 'Commercial', 'Emergency Services']
      },
      services: {
        categories: ['Plumbing', 'Electrical', 'HVAC', 'General Repairs'],
        pricing: {
          hourlyRate: 45.00,
          emergencyRate: 75.00,
          minimumCharge: 50.00
        }
      },
      operatingHours: {
        monday: { open: '07:00', close: '19:00' },
        tuesday: { open: '07:00', close: '19:00' },
        wednesday: { open: '07:00', close: '19:00' },
        thursday: { open: '07:00', close: '19:00' },
        friday: { open: '07:00', close: '19:00' },
        saturday: { open: '08:00', close: '17:00' },
        sunday: { open: '09:00', close: '15:00' }
      }
    };
  }

  /**
   * Clean up all test data
   */
  static async cleanup() {
    try {
      // Clean up in reverse order to respect foreign key constraints
      await prisma.profileSession.deleteMany({
        where: {
          userId: { in: this.testUsers.map(u => u.id) }
        }
      });

      await prisma.profileInvitation.deleteMany({
        where: {
          id: { in: this.testInvitations.map(i => i.id) }
        }
      });

      await prisma.profile.deleteMany({
        where: {
          id: { in: this.testProfiles.map(p => p.id) }
        }
      });

      await prisma.user.deleteMany({
        where: {
          id: { in: this.testUsers.map(u => u.id) }
        }
      });
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn('Cleanup error (ignored):', error);
    }

    // Clear arrays
    this.testUsers = [];
    this.testProfiles = [];
    this.testInvitations = [];
  }

  /**
   * Get a test user by email
   */
  static getTestUserByEmail(email: string): TestUser | undefined {
    return this.testUsers.find(user => user.email === email);
  }

  /**
   * Get a test profile by name
   */
  static getTestProfileByName(name: string): TestProfile | undefined {
    return this.testProfiles.find(profile => profile.name === name);
  }

  /**
   * Generate a valid OTP for testing
   */
  static generateTestOTP(): string {
    return '123456';
  }

  /**
   * Create a complete test scenario with user, profile, and session
   */
  static async createCompleteTestScenario(
    userEmail: string,
    userName: string,
    userRole: UserRole,
    profileName: string,
    profileType: ProfileType
  ) {
    const user = await this.createTestUser(userEmail, userName, userRole);
    const profile = await this.createTestProfileWithSession(user.id, profileName, profileType);
    
    return { user, profile };
  }
}

export default ProfileTestUtils; 