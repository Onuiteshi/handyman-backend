import request from 'supertest';
import { app } from '../index'; // Update the import path to use the correct file
import { prismaMock } from './testSetup';
import { testUsers, getAuthHeader } from './testUtils';

describe('Artisan Status API', () => {
  const artisanToken = testUsers.artisan.token;
  const artisanId = testUsers.artisan.id;
  
  // Mock the Prisma client methods
  const mockArtisan = {
    id: artisanId,
    isOnline: false,
    locationTracking: false,
    latitude: null,
    longitude: null,
    lastSeen: null,
  };
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    prismaMock.artisan.findUnique.mockResolvedValue(mockArtisan);
    prismaMock.artisan.update.mockImplementation(({ data }:any) =>
      Promise.resolve({ ...mockArtisan, ...data })
    );
  });

  afterEach(() => {
    // Reset all mocks after each test
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Clean up any resources if needed
    jest.restoreAllMocks();
  });

  describe('GET /api/artisan/status', () => {
    it('should return artisan status', async () => {
      // Mock the findUnique response
      prismaMock.artisan.findUnique.mockResolvedValueOnce({
        ...mockArtisan,
        isOnline: true,
        locationTracking: true
      });
      
      const response = await request(app)
        .get('/api/artisan/status')
        .set(getAuthHeader(artisanToken));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('isOnline', true);
      expect(response.body.data).toHaveProperty('locationTracking', true);
      
      // Verify the correct method was called
      expect(prismaMock.artisan.findUnique).toHaveBeenCalledWith({
        where: { id: artisanId },
        select: expect.any(Object)
      });
    });
    
    it('should handle missing artisan', async () => {
      // Mock the findUnique to return null (artisan not found)
      prismaMock.artisan.findUnique.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .get('/api/artisan/status')
        .set(getAuthHeader(artisanToken));
        
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Artisan not found');
    });
  });

  describe('PUT /api/artisan/online-status', () => {
    it('should update online status', async () => {
      // Mock the update response
      const updatedArtisan = { ...mockArtisan, isOnline: true, lastSeen: new Date() };
      prismaMock.artisan.update.mockResolvedValueOnce(updatedArtisan);
      
      const response = await request(app)
        .put('/api/artisan/online-status')
        .set(getAuthHeader(artisanToken))
        .send({ isOnline: true });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('isOnline', true);
      
      // Verify the update was called with correct parameters
      expect(prismaMock.artisan.update).toHaveBeenCalledWith({
        where: { id: artisanId },
        data: { 
          isOnline: true,
          lastSeen: expect.any(Date)
        },
        select: expect.any(Object)
      });
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .put('/api/artisan/online-status')
        .set(getAuthHeader(artisanToken))
        .send({ isOnline: 'not-a-boolean' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      
      // Verify no update was attempted
      expect(prismaMock.artisan.update).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/artisan/location-consent', () => {
    it('should update location tracking consent with valid data', async () => {
      const testLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        lastSeen: new Date()
      };
      
      // Mock the update response
      prismaMock.artisan.update.mockResolvedValueOnce({
        ...mockArtisan,
        ...testLocation,
        locationTracking: true
      });
      
      const response = await request(app)
        .put('/api/artisan/location-consent')
        .set(getAuthHeader(artisanToken))
        .send({
          locationTracking: true,
          latitude: testLocation.latitude,
          longitude: testLocation.longitude
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('locationTracking', true);
      expect(response.body.data.location).toEqual({
        latitude: testLocation.latitude,
        longitude: testLocation.longitude,
        lastUpdated: expect.any(String)
      });
      
      // Verify the update was called with correct parameters
      expect(prismaMock.artisan.update).toHaveBeenCalledWith({
        where: { id: artisanId },
        data: {
          locationTracking: true,
          latitude: testLocation.latitude,
          longitude: testLocation.longitude,
          lastSeen: expect.any(Date)
        },
        select: expect.any(Object)
      });
    });
    
    it('should disable location tracking when requested', async () => {
      // Mock the update response
      prismaMock.artisan.update.mockResolvedValueOnce({
        ...mockArtisan,
        locationTracking: false,
        latitude: null,
        longitude: null
      });
      
      const response = await request(app)
        .put('/api/artisan/location-consent')
        .set(getAuthHeader(artisanToken))
        .send({
          locationTracking: false
        });
        
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('locationTracking', false);
      expect(response.body.data).not.toHaveProperty('location');
      
      // Verify the update was called with correct parameters
      expect(prismaMock.artisan.update).toHaveBeenCalledWith({
        where: { id: artisanId },
        data: {
          locationTracking: false,
          latitude: null,
          longitude: null
        },
        select: expect.any(Object)
      });
    });

    it('should validate location data when enabling tracking', async () => {
      const response = await request(app)
        .put('/api/artisan/location-consent')
        .set(getAuthHeader(artisanToken))
        .send({
          locationTracking: true,
          latitude: 'not-a-number',
          longitude: 200 // Invalid longitude
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      
      // Verify no update was attempted
      expect(prismaMock.artisan.update).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/artisan/location', () => {
    const testLocation = {
      latitude: 34.0522,
      longitude: -118.2437
    };
    
    it('should update location when tracking is enabled', async () => {
      // Mock the findUnique to return an artisan with tracking enabled
      prismaMock.artisan.findUnique.mockResolvedValueOnce({
        ...mockArtisan,
        locationTracking: true
      });
      
      // Mock the update response
      const updatedArtisan = {
        ...mockArtisan,
        ...testLocation,
        locationTracking: true,
        lastSeen: new Date()
      };
      prismaMock.artisan.update.mockResolvedValueOnce(updatedArtisan);

      const response = await request(app)
        .put('/api/artisan/location')
        .set(getAuthHeader(artisanToken))
        .send(testLocation);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.location).toEqual({
        latitude: testLocation.latitude,
        longitude: testLocation.longitude,
        lastUpdated: expect.any(String)
      });
      
      // Verify the update was called with correct parameters
      expect(prismaMock.artisan.update).toHaveBeenCalledWith({
        where: { 
          id: artisanId,
          locationTracking: true
        },
        data: {
          latitude: testLocation.latitude,
          longitude: testLocation.longitude,
          lastSeen: expect.any(Date),
          isOnline: true
        },
        select: expect.any(Object)
      });
    });

    it('should return error when tracking is disabled', async () => {
      // Mock the findUnique to return an artisan with tracking disabled
      prismaMock.artisan.findUnique.mockResolvedValueOnce({
        ...mockArtisan,
        locationTracking: false
      });

      const response = await request(app)
        .put('/api/artisan/location')
        .set(getAuthHeader(artisanToken))
        .send(testLocation);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Location tracking is not enabled for this artisan');
      
      // Verify no update was attempted
      expect(prismaMock.artisan.update).not.toHaveBeenCalled();
    });
    
    it('should validate location data', async () => {
      const response = await request(app)
        .put('/api/artisan/location')
        .set(getAuthHeader(artisanToken))
        .send({
          latitude: 'invalid',
          longitude: 200 // Invalid longitude
        });
        
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      
      // Verify no database operations were performed
      expect(prismaMock.artisan.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.artisan.update).not.toHaveBeenCalled();
    });
  });
});
