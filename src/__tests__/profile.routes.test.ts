import request from 'supertest';
import { app } from '../index';
import { PrismaClient, ProfileType, UserRole } from '../generated/prisma';
import { generateToken } from '../utils/auth.utils';

const prisma = new PrismaClient();

describe('Profile Routes', () => {
  let customerToken: string;
  let artisanToken: string;
  let adminToken: string;
  let testUserId: string;
  let testProfileId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        name: 'Test User',
        role: UserRole.CUSTOMER,
        authProvider: 'EMAIL',
        isEmailVerified: true,
        isPhoneVerified: false,
        profileComplete: true
      }
    });
    testUserId = testUser.id;

    // Create test artisan
    const testArtisan = await prisma.user.create({
      data: {
        email: 'testartisan@example.com',
        name: 'Test Artisan',
        role: UserRole.ARTISAN,
        authProvider: 'EMAIL',
        isEmailVerified: true,
        isPhoneVerified: false,
        profileComplete: true
      }
    });

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        authProvider: 'EMAIL',
        isEmailVerified: true,
        isPhoneVerified: false,
        profileComplete: true,
        password: '$2a$10$test.hash'
      }
    });

    // Generate tokens
    customerToken = generateToken({
      id: testUser.id,
      role: UserRole.CUSTOMER,
      authProvider: 'EMAIL',
      isEmailVerified: true,
      isPhoneVerified: false,
      profileComplete: true
    });

    artisanToken = generateToken({
      id: testArtisan.id,
      role: UserRole.ARTISAN,
      authProvider: 'EMAIL',
      isEmailVerified: true,
      isPhoneVerified: false,
      profileComplete: true
    });

    adminToken = generateToken({
      id: adminUser.id,
      role: UserRole.ADMIN,
      authProvider: 'EMAIL',
      isEmailVerified: true,
      isPhoneVerified: false,
      profileComplete: true
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.profileSession.deleteMany({
      where: {
        userId: { in: [testUserId] }
      }
    });
    await prisma.profile.deleteMany({
      where: {
        ownerId: testUserId
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['testuser@example.com', 'testartisan@example.com', 'admin@test.com'] }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/profiles/create', () => {
    it('should create a personal profile successfully', async () => {
      const profileData = {
        name: 'My Personal Profile',
        type: ProfileType.PERSONAL,
        description: 'My personal profile for handyman services',
        avatar: 'https://example.com/avatar.jpg',
        settings: { notifications: true },
        metadata: { test: 'data' }
      };

      const response = await request(app)
        .post('/api/profiles/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body.message).toBe('Profile created successfully');
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.name).toBe('My Personal Profile');
      expect(response.body.profile.type).toBe(ProfileType.PERSONAL);

      testProfileId = response.body.profile.id;
    });

    it('should create a business profile successfully', async () => {
      const profileData = {
        name: 'My Business Profile',
        type: ProfileType.BUSINESS,
        description: 'My business profile for professional services',
        settings: { notifications: false, privacy: 'private' }
      };

      const response = await request(app)
        .post('/api/profiles/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body.message).toBe('Profile created successfully');
      expect(response.body.profile.type).toBe(ProfileType.BUSINESS);
    });

    it('should create a freelance profile successfully', async () => {
      const profileData = {
        name: 'My Freelance Profile',
        type: ProfileType.FREELANCE,
        description: 'My freelance profile for independent work'
      };

      const response = await request(app)
        .post('/api/profiles/create')
        .set('Authorization', `Bearer ${artisanToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body.message).toBe('Profile created successfully');
      expect(response.body.profile.type).toBe(ProfileType.FREELANCE);
    });

    it('should return 400 for invalid profile type', async () => {
      const profileData = {
        name: 'Invalid Profile',
        type: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/api/profiles/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(profileData)
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should return 401 without authentication', async () => {
      const profileData = {
        name: 'Unauthorized Profile',
        type: ProfileType.PERSONAL
      };

      await request(app)
        .post('/api/profiles/create')
        .send(profileData)
        .expect(401);
    });
  });

  describe('GET /api/profiles/my-profiles', () => {
    it('should return user profiles successfully', async () => {
      const response = await request(app)
        .get('/api/profiles/my-profiles')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Profiles retrieved successfully');
      expect(response.body.profiles).toBeDefined();
      expect(Array.isArray(response.body.profiles)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/profiles/my-profiles')
        .expect(401);
    });
  });

  describe('POST /api/profiles/switch', () => {
    it('should switch to profile successfully', async () => {
      const switchData = {
        profileId: testProfileId,
        identifier: 'testuser@example.com'
      };

      const response = await request(app)
        .post('/api/profiles/switch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(switchData)
        .expect(200);

      expect(response.body.message).toBe('Profile switched successfully');
      expect(response.body.requiresAuthentication).toBeDefined();
      expect(response.body.profile).toBeDefined();
    });

    it('should return 400 for invalid profile ID', async () => {
      const switchData = {
        profileId: 'invalid-uuid',
        identifier: 'testuser@example.com'
      };

      const response = await request(app)
        .post('/api/profiles/switch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(switchData)
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should return 400 for invalid identifier', async () => {
      const switchData = {
        profileId: testProfileId,
        identifier: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/profiles/switch')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(switchData)
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });
  });

  describe('POST /api/profiles/authenticate', () => {
    it('should authenticate profile switch successfully', async () => {
      const authData = {
        profileId: testProfileId,
        identifier: 'testuser@example.com',
        otp: '123456'
      };

      const response = await request(app)
        .post('/api/profiles/authenticate')
        .send(authData)
        .expect(200);

      expect(response.body.message).toBe('Profile authentication successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should return 400 for invalid OTP', async () => {
      const authData = {
        profileId: testProfileId,
        identifier: 'testuser@example.com',
        otp: '123' // Too short
      };

      const response = await request(app)
        .post('/api/profiles/authenticate')
        .send(authData)
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });
  });

  describe('POST /api/profiles/refresh-session', () => {
    it('should refresh session successfully', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const response = await request(app)
        .post('/api/profiles/refresh-session')
        .send(refreshData)
        .expect(200);

      expect(response.body.message).toBe('Session refreshed successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/profiles/refresh-session')
        .send({})
        .expect(400);

      expect(response.body.error.message).toBe('Refresh token is required');
    });
  });

  describe('PUT /api/profiles/:profileId', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Profile Name',
        description: 'Updated description',
        avatar: 'https://example.com/new-avatar.jpg'
      };

      const response = await request(app)
        .put(`/api/profiles/${testProfileId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.profile).toBeDefined();
    });

    it('should return 400 for invalid profile data', async () => {
      const updateData = {
        name: 'A'.repeat(100) // Too long
      };

      const response = await request(app)
        .put(`/api/profiles/${testProfileId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        name: 'Unauthorized Update'
      };

      await request(app)
        .put(`/api/profiles/${testProfileId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/profiles/:profileId', () => {
    it('should delete profile successfully', async () => {
      const response = await request(app)
        .delete(`/api/profiles/${testProfileId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Profile deleted successfully');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/api/profiles/${testProfileId}`)
        .expect(401);
    });
  });

  describe('POST /api/profiles/:profileId/invite', () => {
    let newProfileId: string;

    beforeAll(async () => {
      // Create a new profile for testing invitations
      const profile = await prisma.profile.create({
        data: {
          name: 'Invitation Test Profile',
          type: ProfileType.BUSINESS,
          ownerId: testUserId,
          members: {
            create: {
              userId: testUserId,
              role: UserRole.CUSTOMER,
              permissions: { invite: true },
              isActive: true
            }
          }
        }
      });
      newProfileId = profile.id;
    });

    it('should create invitation successfully', async () => {
      const inviteData = {
        invitedEmail: 'newuser@example.com',
        role: UserRole.CUSTOMER,
        message: 'Join our team!'
      };

      const response = await request(app)
        .post(`/api/profiles/${newProfileId}/invite`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(inviteData)
        .expect(201);

      expect(response.body.message).toBe('Invitation sent successfully');
      expect(response.body.invitation).toBeDefined();
    });

    it('should return 400 for invalid invitation data', async () => {
      const inviteData = {
        invitedEmail: 'invalid-email',
        role: 'INVALID_ROLE'
      };

      const response = await request(app)
        .post(`/api/profiles/${newProfileId}/invite`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(inviteData)
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });
  });

  describe('POST /api/profiles/invitations/:invitationId/accept', () => {
    let invitationId: string;

    beforeAll(async () => {
      // Create a test invitation
      const invitation = await prisma.profileInvitation.create({
        data: {
          profileId: testProfileId,
          invitedEmail: 'accepttest@example.com',
          invitedByUserId: testUserId,
          role: UserRole.CUSTOMER,
          message: 'Test invitation',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      invitationId = invitation.id;
    });

    it('should accept invitation successfully', async () => {
      const acceptData = {
        userId: testUserId
      };

      const response = await request(app)
        .post(`/api/profiles/invitations/${invitationId}/accept`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(acceptData)
        .expect(200);

      expect(response.body.message).toBe('Invitation accepted successfully');
      expect(response.body.profile).toBeDefined();
    });

    it('should return 400 for invalid invitation ID', async () => {
      const acceptData = {
        userId: testUserId
      };

      const response = await request(app)
        .post('/api/profiles/invitations/invalid-uuid/accept')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(acceptData)
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });
  });

  describe('GET /api/profiles/:profileId/analytics', () => {
    it('should return profile analytics successfully', async () => {
      const response = await request(app)
        .get(`/api/profiles/${testProfileId}/analytics`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Analytics retrieved successfully');
      expect(response.body.analytics).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/profiles/${testProfileId}/analytics`)
        .expect(401);
    });
  });

  describe('PUT /api/profiles/:profileId/customer', () => {
    it('should update customer profile data successfully', async () => {
      const customerData = {
        preferences: {
          language: 'en',
          timezone: 'UTC'
        },
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          zipCode: '10001'
        },
        paymentMethods: {
          default: 'card',
          cards: ['visa', 'mastercard']
        }
      };

      const response = await request(app)
        .put(`/api/profiles/${testProfileId}/customer`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(customerData)
        .expect(200);

      expect(response.body.message).toBe('Customer profile updated successfully');
      expect(response.body.profileId).toBe(testProfileId);
    });
  });

  describe('PUT /api/profiles/:profileId/artisan', () => {
    it('should update artisan profile data successfully', async () => {
      const artisanData = {
        skills: ['Plumbing', 'Electrical', 'Carpentry'],
        experience: 5,
        portfolio: ['https://example.com/work1.jpg'],
        bio: 'Experienced handyman',
        photoUrl: 'https://example.com/photo.jpg',
        hourlyRate: 25.50,
        availability: {
          monday: { start: '09:00', end: '17:00' }
        }
      };

      const response = await request(app)
        .put(`/api/profiles/${testProfileId}/artisan`)
        .set('Authorization', `Bearer ${artisanToken}`)
        .send(artisanData)
        .expect(200);

      expect(response.body.message).toBe('Artisan profile updated successfully');
      expect(response.body.profileId).toBe(testProfileId);
    });

    it('should return 400 for invalid artisan data', async () => {
      const artisanData = {
        skills: 'not-an-array',
        experience: 'not-a-number'
      };

      const response = await request(app)
        .put(`/api/profiles/${testProfileId}/artisan`)
        .set('Authorization', `Bearer ${artisanToken}`)
        .send(artisanData)
        .expect(400);

      expect(response.body.error.message).toBe('Validation failed');
    });
  });

  describe('GET /api/profiles/:profileId/invitations', () => {
    it('should return profile invitations successfully', async () => {
      const response = await request(app)
        .get(`/api/profiles/${testProfileId}/invitations`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Invitations retrieved successfully');
      expect(response.body.profileId).toBe(testProfileId);
      expect(response.body.invitations).toBeDefined();
    });
  });

  describe('GET /api/profiles/:profileId/members', () => {
    it('should return profile members successfully', async () => {
      const response = await request(app)
        .get(`/api/profiles/${testProfileId}/members`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Members retrieved successfully');
      expect(response.body.profileId).toBe(testProfileId);
      expect(response.body.members).toBeDefined();
    });
  });

  describe('DELETE /api/profiles/sessions/:sessionId', () => {
    it('should revoke profile session successfully', async () => {
      const response = await request(app)
        .delete('/api/profiles/sessions/test-session-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Session revoked successfully');
    });
  });
}); 