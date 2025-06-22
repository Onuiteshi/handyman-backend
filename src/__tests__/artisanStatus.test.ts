import request from 'supertest';
import { app } from '../index';
import prisma from '../lib/prisma';

let artisanToken: string;
let artisanId: string;

beforeAll(async () => {
  // Clean up database
  await prisma.oTPVerification.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.artisan.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Signup as artisan
  const signupRes = await request(app)
    .post('/api/auth/signup')
    .send({
      identifier: 'artisanstatus@example.com',
      name: 'Artisan Status',
      role: 'ARTISAN'
    });
  expect(signupRes.status).toBe(200);

  // 2. Get OTP from the response or database
  const otpVerification = await prisma.oTPVerification.findFirst({
    where: { identifier: 'artisanstatus@example.com' }
  });
  expect(otpVerification).toBeTruthy();

  // 3. Verify OTP to complete signup and create artisan profile
  const verifyRes = await request(app)
    .post('/api/auth/verify-signup')
    .send({
      identifier: 'artisanstatus@example.com',
      otp: otpVerification!.otp,
      type: 'SIGNUP'
    });
  expect(verifyRes.status).toBe(200);
  artisanToken = verifyRes.body.token;

  // 4. Get the artisan ID from the created profile
  const user = await prisma.user.findUnique({
    where: { email: 'artisanstatus@example.com' },
    include: { artisan: true }
  });
  expect(user).toBeTruthy();
  expect(user!.artisan).toBeTruthy();
  artisanId = user!.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up artisan status fields for isolation if needed
  // (Optional: reset fields if your tests modify them)
});

// Helper function to get auth header
const getAuthHeader = (token: string) => ({
  'Authorization': `Bearer ${token}`
});

describe('Artisan Status API', () => {
  describe('GET /api/artisan/status', () => {
    it('should return artisan status', async () => {
      // Enable online and location tracking for the artisan
      await prisma.artisan.update({
        where: { userId: artisanId },
        data: { isOnline: true, locationTracking: true }
      });

      const response = await request(app)
        .get('/api/artisan/status')
        .set(getAuthHeader(artisanToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isOnline', true);
      expect(response.body).toHaveProperty('locationTracking', true);
    });

    it('should handle missing artisan', async () => {
      // Create a customer user with proper authentication
      const customerSignupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          identifier: 'customer@example.com',
          name: 'Customer User',
          role: 'CUSTOMER'
        });
      expect(customerSignupRes.status).toBe(200);

      // Get OTP for customer
      const customerOtpVerification = await prisma.oTPVerification.findFirst({
        where: { identifier: 'customer@example.com' }
      });
      expect(customerOtpVerification).toBeTruthy();

      // Verify OTP to get customer token
      const customerVerifyRes = await request(app)
        .post('/api/auth/verify-signup')
        .send({
          identifier: 'customer@example.com',
          otp: customerOtpVerification!.otp,
          type: 'SIGNUP'
        });
      expect(customerVerifyRes.status).toBe(200);
      const customerToken = customerVerifyRes.body.token;

      const response = await request(app)
        .get('/api/artisan/status')
        .set(getAuthHeader(customerToken));

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Artisan profile not found');
    });
  });

  describe('PUT /api/artisan/online-status', () => {
    it('should update online status', async () => {
      const response = await request(app)
        .put('/api/artisan/online-status')
        .set(getAuthHeader(artisanToken))
        .send({ isOnline: true });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Online status updated successfully');
      expect(response.body).toHaveProperty('isOnline', true);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .put('/api/artisan/online-status')
        .set(getAuthHeader(artisanToken))
        .send({ isOnline: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'isOnline must be a boolean');
    });
  });

  describe('PUT /api/artisan/location-consent', () => {
    it('should update location tracking consent with valid data', async () => {
      const response = await request(app)
        .put('/api/artisan/location-consent')
        .set(getAuthHeader(artisanToken))
        .send({
          locationTracking: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Location tracking preference updated successfully');
      expect(response.body).toHaveProperty('locationTracking', true);
    });

    it('should disable location tracking when requested', async () => {
      const response = await request(app)
        .put('/api/artisan/location-consent')
        .set(getAuthHeader(artisanToken))
        .send({ locationTracking: false });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Location tracking preference updated successfully');
      expect(response.body).toHaveProperty('locationTracking', false);
    });

    it('should validate location data when enabling tracking', async () => {
      const response = await request(app)
        .put('/api/artisan/location-consent')
        .set(getAuthHeader(artisanToken))
        .send({
          locationTracking: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'locationTracking must be a boolean');
    });
  });

  describe('PUT /api/artisan/location', () => {
    it('should update location when tracking is enabled', async () => {
      // Enable location tracking first
      await prisma.artisan.update({
        where: { userId: artisanId },
        data: { locationTracking: true }
      });

      const response = await request(app)
        .put('/api/artisan/location')
        .set(getAuthHeader(artisanToken))
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Location updated successfully');
      expect(response.body).toHaveProperty('latitude', 40.7128);
      expect(response.body).toHaveProperty('longitude', -74.0060);
    });

    it('should return error when tracking is disabled', async () => {
      // Disable location tracking
      await prisma.artisan.update({
        where: { userId: artisanId },
        data: { locationTracking: false }
      });

      const response = await request(app)
        .put('/api/artisan/location')
        .set(getAuthHeader(artisanToken))
        .send({
          latitude: 40.7128,
          longitude: -74.0060
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Location tracking is disabled');
    });

    it('should validate location data', async () => {
      // Enable location tracking first
      await prisma.artisan.update({
        where: { userId: artisanId },
        data: { locationTracking: true }
      });

      const response = await request(app)
        .put('/api/artisan/location')
        .set(getAuthHeader(artisanToken))
        .send({
          latitude: 'invalid',
          longitude: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors[0]).toHaveProperty('message', 'latitude must be a number');
    });
  });
});
