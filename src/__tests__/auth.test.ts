import request from 'supertest';
import { PrismaClient, UserRole, AuthProvider, OTPType } from '../generated/prisma';
import { app } from '../index';

const prisma = new PrismaClient();

describe('Authentication System', () => {
  beforeAll(async () => {
    // Clean up database before tests
    await prisma.oTPVerification.deleteMany();
    await prisma.artisan.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Customer Signup Flow', () => {
    it('should send OTP for customer signup with email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'customer@example.com',
          name: 'John Customer',
          role: UserRole.CUSTOMER,
          authProvider: AuthProvider.EMAIL
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.identifier).toBe('customer@example.com');
      expect(response.body.expiresIn).toBe(300);
    });

    it('should send OTP for customer signup with phone', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: '+1234567890',
          name: 'Jane Customer',
          role: UserRole.CUSTOMER,
          authProvider: AuthProvider.PHONE
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
      expect(response.body.error.message).toBe('Validation failed');
    });
  });

  describe('Artisan Signup Flow', () => {
    it('should send OTP for artisan signup', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'artisan@example.com',
          name: 'Bob Artisan',
          role: UserRole.ARTISAN,
          authProvider: AuthProvider.EMAIL
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.identifier).toBe('artisan@example.com');
    });
  });

  describe('OTP Verification', () => {
    let signupResponse: any;

    beforeEach(async () => {
      // Create a test signup
      signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'test@example.com',
          name: 'Test User',
          role: UserRole.CUSTOMER
        });
    });

    it('should verify valid OTP and complete signup', async () => {
      // Get the OTP from the database (in development, it's logged)
      const otpRecord = await prisma.oTPVerification.findFirst({
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
      expect(response.body.user.role).toBe(UserRole.CUSTOMER);
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
      const user = await prisma.user.create({
        data: {
          email: 'login@example.com',
          name: 'Login User',
          role: UserRole.CUSTOMER,
          authProvider: AuthProvider.EMAIL,
          isEmailVerified: true
        }
      });

      await prisma.customer.create({
        data: { userId: user.id }
      });
    });

    it('should send OTP for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'login@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.identifier).toBe('login@example.com');
    });

    it('should verify login OTP and authenticate user', async () => {
      // Send login OTP
      await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'login@example.com'
        });

      // Get the OTP from database
      const otpRecord = await prisma.oTPVerification.findFirst({
        where: {
          identifier: 'login@example.com',
          type: OTPType.LOGIN,
          isUsed: false
        }
      });

      expect(otpRecord).toBeTruthy();

      const response = await request(app)
        .post('/api/auth/verify-login')
        .send({
          identifier: 'login@example.com',
          otp: otpRecord!.otp,
          type: OTPType.LOGIN
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeTruthy();
      expect(response.body.user.email).toBe('login@example.com');
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
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
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
          email: 'admin@example.com',
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
          email: 'admin@example.com',
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