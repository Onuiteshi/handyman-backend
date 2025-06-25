import request from 'supertest';
import { app } from '../index';
import { prisma } from '../index';
import { JobStatus } from '../types/job.types';
import { calculateDistance, calculateMatchScore } from '../utils/geolocation';

// Mock the notification service
jest.mock('../services/notification.service', () => ({
  sendJobNotification: jest.fn().mockResolvedValue({ successCount: 1 }),
  sendToDevice: jest.fn().mockResolvedValue('mock-message-id'),
}));

describe('Job Management System', () => {
  let testUser: any;
  let testArtisan: any;
  let testService: any;
  let authToken: string;
  let artisanAuthToken: string;

  beforeAll(async () => {
    // Create test service category
    testService = await prisma.serviceCategory.create({
      data: {
        name: 'Test Plumbing',
        description: 'Test plumbing service',
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'testcustomer@example.com',
        name: 'Test Customer',
        role: 'CUSTOMER',
        isEmailVerified: true,
        profileComplete: true,
      },
    });

    // Create test artisan
    const artisanUser = await prisma.user.create({
      data: {
        email: 'testartisan@example.com',
        name: 'Test Artisan',
        role: 'ARTISAN',
        isEmailVerified: true,
        profileComplete: true,
      },
    });

    testArtisan = await prisma.artisan.create({
      data: {
        userId: artisanUser.id,
        skills: ['plumbing', 'electrical'],
        experience: 5,
        isOnline: true,
        locationTracking: true,
        latitude: 6.5244,
        longitude: 3.3792,
        averageRating: 4.5,
        serviceRadiusKm: 10.0,
      },
    });

    // Link artisan to service category
    await prisma.artisanServiceCategory.create({
      data: {
        artisanId: testArtisan.id,
        categoryId: testService.id,
        specializationLevel: 4,
      },
    });

    // Generate auth tokens
    const userResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testcustomer@example.com',
        password: 'password123',
      });

    const artisanResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testartisan@example.com',
        password: 'password123',
      });

    authToken = userResponse.body.data?.token || 'mock-token';
    artisanAuthToken = artisanResponse.body.data?.token || 'mock-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.jobMatchingLog.deleteMany({
      where: {
        job: {
          userId: testUser.id,
        },
      },
    });

    await prisma.job.deleteMany({
      where: {
        userId: testUser.id,
      },
    });

    await prisma.artisanServiceCategory.deleteMany({
      where: {
        artisanId: testArtisan.id,
      },
    });

    await prisma.artisan.delete({
      where: { id: testArtisan.id },
    });

    await prisma.serviceCategory.delete({
      where: { id: testService.id },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [testUser.id, testArtisan.userId] },
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/jobs', () => {
    it('should create a new job successfully', async () => {
      const jobData = {
        serviceId: testService.id,
        description: 'Need plumbing repair for leaking faucet',
        photoUrls: ['https://example.com/photo1.jpg'],
        latitude: 6.5244,
        longitude: 3.3792,
        preferredTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.job).toMatchObject({
        serviceId: testService.id,
        description: jobData.description,
        photoUrls: jobData.photoUrls,
        latitude: jobData.latitude,
        longitude: jobData.longitude,
        status: JobStatus.PENDING,
      });
    });

    it('should reject job creation with invalid coordinates', async () => {
      const jobData = {
        serviceId: testService.id,
        description: 'Test job',
        photoUrls: ['https://example.com/photo1.jpg'],
        latitude: 100, // Invalid latitude
        longitude: 3.3792,
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData);

      expect(response.status).toBe(400);
    });

    it('should reject job creation with invalid service ID', async () => {
      const jobData = {
        serviceId: 'invalid-uuid',
        description: 'Test job',
        photoUrls: ['https://example.com/photo1.jpg'],
        latitude: 6.5244,
        longitude: 3.3792,
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/estimate', () => {
    it('should return cost estimate for a service', async () => {
      const response = await request(app)
        .get('/api/estimate')
        .query({ serviceId: testService.id })
        .send({
          description: 'Plumbing repair needed',
          photoUrls: ['https://example.com/photo1.jpg'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estimate).toMatchObject({
        serviceId: testService.id,
        serviceName: testService.name,
        estimatedRange: {
          min: expect.any(Number),
          max: expect.any(Number),
          currency: 'NGN',
        },
        confidence: expect.any(Number),
        factors: expect.any(Array),
      });
    });

    it('should reject estimate request with invalid service ID', async () => {
      const response = await request(app)
        .get('/api/estimate')
        .query({ serviceId: 'invalid-uuid' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/jobs/:jobId/matches', () => {
    let testJob: any;

    beforeEach(async () => {
      // Create a test job
      testJob = await prisma.job.create({
        data: {
          userId: testUser.id,
          serviceId: testService.id,
          description: 'Test job for matching',
          photoUrls: ['https://example.com/photo1.jpg'],
          latitude: 6.5244,
          longitude: 3.3792,
          status: JobStatus.PENDING,
        },
      });
    });

    afterEach(async () => {
      // Clean up test job
      await prisma.jobMatchingLog.deleteMany({
        where: { jobId: testJob.id },
      });
      await prisma.job.delete({
        where: { id: testJob.id },
      });
    });

    it('should return matching artisans for a job', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJob.id}/matches`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBeInstanceOf(Array);
      
      if (response.body.data.matches.length > 0) {
        const match = response.body.data.matches[0];
        expect(match).toMatchObject({
          artisanId: expect.any(String),
          artisanName: expect.any(String),
          matchScore: expect.any(Number),
          distanceKm: expect.any(Number),
          rating: expect.any(Number),
          specializationLevel: expect.any(Number),
          isOnline: expect.any(Boolean),
          serviceRadiusKm: expect.any(Number),
        });
      }
    });

    it('should reject access to job matches for unauthorized user', async () => {
      const response = await request(app)
        .get(`/api/jobs/${testJob.id}/matches`)
        .set('Authorization', `Bearer invalid-token`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/jobs/my-jobs', () => {
    it('should return user jobs', async () => {
      const response = await request(app)
        .get('/api/jobs/my-jobs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toBeInstanceOf(Array);
    });
  });

  describe('PUT /api/jobs/:jobId/status', () => {
    let testJob: any;

    beforeEach(async () => {
      testJob = await prisma.job.create({
        data: {
          userId: testUser.id,
          serviceId: testService.id,
          description: 'Test job for status update',
          photoUrls: ['https://example.com/photo1.jpg'],
          latitude: 6.5244,
          longitude: 3.3792,
          status: JobStatus.PENDING,
        },
      });
    });

    afterEach(async () => {
      await prisma.job.delete({
        where: { id: testJob.id },
      });
    });

    it('should update job status successfully', async () => {
      const response = await request(app)
        .put(`/api/jobs/${testJob.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: JobStatus.ASSIGNED });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.job.status).toBe(JobStatus.ASSIGNED);
    });

    it('should reject invalid job status', async () => {
      const response = await request(app)
        .put(`/api/jobs/${testJob.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
    });
  });

  describe('Geolocation Utilities', () => {
    it('should calculate distance correctly', () => {
      const distance = calculateDistance(6.5244, 3.3792, 6.5245, 3.3793);
      expect(distance).toBeGreaterThan(0);
      expect(typeof distance).toBe('number');
    });

    it('should calculate match score correctly', () => {
      const score = calculateMatchScore(5.0, 4.5, 4, true);
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });
  });

  describe('Job Analytics (Admin)', () => {
    it('should return matching analytics for admin', async () => {
      // Create admin user and token
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
          isEmailVerified: true,
          profileComplete: true,
        },
      });

      const adminResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        });

      const adminToken = adminResponse.body.data?.token || 'mock-admin-token';

      const response = await request(app)
        .get('/api/jobs/analytics/matching')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toMatchObject({
        totalMatches: expect.any(Number),
        selectedMatches: expect.any(Number),
        selectionRate: expect.any(Number),
        averageMatchScore: expect.any(Number),
        averageDistance: expect.any(Number),
        averageRating: expect.any(Number),
      });

      // Clean up admin user
      await prisma.user.delete({
        where: { id: adminUser.id },
      });
    });
  });
}); 