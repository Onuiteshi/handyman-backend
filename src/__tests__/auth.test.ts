import request from 'supertest';
import { PrismaClient, UserRole, AuthProvider, OTPType } from '@prisma/client';
import { app } from '../index';
import prisma from '../lib/prisma';

const prismaClient = new PrismaClient();

describe('Authentication System', () => {
  beforeAll(async () => {
    // Clean up database before tests
    await prismaClient.oTPVerification.deleteMany();
    await prismaClient.artisan.deleteMany();
    await prismaClient.customer.deleteMany();
    await prismaClient.user.deleteMany();
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
  });

  beforeEach(async () => {
    // Clean up all relevant tables before each test
    await prisma.oTPVerification.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.artisan.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Customer Signup Flow', () => {
    it('should send OTP for customer signup with email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'customer@example.com',
          name: 'John Doe',
          role: UserRole.CUSTOMER
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.identifier).toBe('customer@example.com');
    });

    it('should send OTP for customer signup with phone', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: '+1234567890',
          name: 'Jane Smith',
          role: UserRole.CUSTOMER
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.identifier).toBe('+1234567890');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'invalid-email',
          name: 'Test User',
          role: UserRole.CUSTOMER
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should reject invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: '123',
          name: 'Test User',
          role: UserRole.CUSTOMER
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Invalid identifier format. Please provide a valid email or phone number.');
    });
  });

  describe('Artisan Signup Flow', () => {
    it('should send OTP for artisan signup', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'artisan@example.com',
          name: 'Artisan User',
          role: UserRole.ARTISAN
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.identifier).toBe('artisan@example.com');
    });
  });

  describe('OTP Verification', () => {
    it('should verify valid OTP and complete signup', async () => {
      // First send OTP
      await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'test@example.com',
          name: 'Test User',
          role: UserRole.CUSTOMER
        });

      // Get the OTP from database
      const otpRecord = await prismaClient.oTPVerification.findFirst({
        where: {
          identifier: 'test@example.com',
          type: OTPType.SIGNUP,
          isUsed: false
        }
      });

      expect(otpRecord).toBeTruthy();

      const response = await request(app)
        .post('/api/auth/verify-signup')
        .send({
          identifier: 'test@example.com',
          otp: otpRecord!.otp,
          type: OTPType.SIGNUP
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Signup completed successfully');
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/auth/verify-signup')
        .send({
          identifier: 'test@example.com',
          otp: '000000',
          type: OTPType.SIGNUP
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Invalid or expired OTP.');
    });
  });

  describe('Login Flow', () => {
    beforeEach(async () => {
      // Create a verified user
      const user = await prismaClient.user.create({
        data: {
          email: 'loginflow@example.com',
          name: 'Login User',
          role: UserRole.CUSTOMER,
          authProvider: AuthProvider.EMAIL,
          isEmailVerified: true
        }
      });

      await prismaClient.customer.create({
        data: { userId: user.id }
      });
    });

    it('should send OTP for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'loginflow@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.identifier).toBe('loginflow@example.com');
    });

    it('should verify login OTP and authenticate user', async () => {
      // Send login OTP
      await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'loginflow@example.com'
        });

      // Get the OTP from database
      const otpRecord = await prismaClient.oTPVerification.findFirst({
        where: {
          identifier: 'loginflow@example.com',
          type: OTPType.LOGIN,
          isUsed: false
        }
      });

      expect(otpRecord).toBeTruthy();

      const response = await request(app)
        .post('/api/auth/verify-login')
        .send({
          identifier: 'loginflow@example.com',
          otp: otpRecord!.otp,
          type: OTPType.LOGIN
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toBe('loginflow@example.com');
    });
  });

  describe('Google OAuth', () => {
    it('should handle Google OAuth authentication', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({
          googleToken: 'mock_google_token',
          name: 'Google User',
          role: UserRole.CUSTOMER
        });

      // In development mode, this should work with mock data
      if (process.env.NODE_ENV === 'development') {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Google authentication successful');
        expect(response.body.token).toBeTruthy();
      } else {
        // In production, this would fail without real Google token
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Admin Authentication', () => {
    beforeEach(async () => {
      // Create an admin user with password
      const hashedPassword = await require('bcryptjs').hash('admin123', 10);
      await prismaClient.user.create({
        data: {
          email: 'adminauth@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
          authProvider: AuthProvider.EMAIL,
          password: hashedPassword,
          isEmailVerified: true
        }
      });
    });

    it('should authenticate admin with email and password', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'adminauth@example.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin login successful');
      expect(response.body.token).toBeTruthy();
      expect(response.body.user.role).toBe(UserRole.ADMIN);
    });

    it('should reject admin login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'adminauth@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Invalid credentials.');
    });
  });

  describe('Token Management', () => {
    it('should refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          token: 'mock_token'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Token refreshed successfully');
    });

    it('should handle logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          token: 'mock_token'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should handle duplicate user signup', async () => {
      // First signup
      await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'duplicate@example.com',
          name: 'First User',
          role: UserRole.CUSTOMER
        });

      // Second signup with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'duplicate@example.com',
          name: 'Second User',
          role: UserRole.CUSTOMER
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('User already exists with this email or phone number.');
    });
  });
}); 