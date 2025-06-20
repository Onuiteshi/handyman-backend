import request from 'supertest';
import { app } from '../index';
import { prismaMock } from './testSetup';
import { testUsers, mockCategory, mockArtisan } from './testUtils';

// Import the mock to ensure it's loaded before the tests
import '../__mocks__/@prisma/client';

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn((token, secret, callback) => {
    if (token === testUsers.admin.token) {
      callback(null, { id: testUsers.admin.id, role: 'ADMIN' });
    } else if (token === testUsers.artisan.token) {
      callback(null, { id: testUsers.artisan.id, role: 'ARTISAN' });
    } else if (token === testUsers.user.token) {
      callback(null, { id: testUsers.user.id, role: 'USER' });
    } else {
      callback(new Error('Invalid token'), null);
    }
  }),
}));

describe('Service Category API', () => {
  // Helper function to get auth header
  const getAuthHeader = (token: string) => ({
    'Authorization': `Bearer ${token}`,
  });

  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    prismaMock.serviceCategory.findMany.mockResolvedValue([mockCategory]);
    prismaMock.serviceCategory.findUnique.mockResolvedValue(mockCategory);
    prismaMock.serviceCategory.create.mockResolvedValue(mockCategory);
    prismaMock.serviceCategory.update.mockResolvedValue(mockCategory);
    prismaMock.serviceCategory.delete.mockResolvedValue(mockCategory);
    
    prismaMock.artisan.findUnique.mockResolvedValue(mockArtisan);
    prismaMock.artisanServiceCategory.findUnique.mockResolvedValue(null);
    prismaMock.artisanServiceCategory.create.mockResolvedValue({
      id: 'test-artisan-category-id',
      artisanId: mockArtisan.id,
      categoryId: mockCategory.id,
    });
  });

  describe('GET /api/service-categories', () => {
    it('should return all service categories', async () => {
      const response = await request(app)
        .get('/api/service-categories')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          })
        ])
      }));
    });
  });

  describe('POST /api/service-categories', () => {
    it('should create a new category (admin only)', async () => {
      const newCategory = {
        name: 'New Category',
        description: 'A new service category',
      };

      const response = await request(app)
        .post('/api/service-categories')
        .set(getAuthHeader(testUsers.admin.token))
        .send(newCategory)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          name: 'New Category',
          description: 'A new service category',
        })
      }));
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/service-categories')
        .set(getAuthHeader(testUsers.admin.token))
        .send({}) // Missing required name field
        .expect(400);

      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        error: 'Name is required',
      }));
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/service-categories')
        .set(getAuthHeader(testUsers.user.token))
        .send({ name: 'New Category' })
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Access denied. Admin only.',
      });
      expect(prismaMock.serviceCategory.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/service-categories/:id', () => {
    it('should return a category by ID', async () => {
      const categoryId = 'test-category-id';
      const testCategory = {
        ...mockCategory,
        id: categoryId,
        name: 'Test Category',
      };

      prismaMock.serviceCategory.findUnique.mockResolvedValueOnce(testCategory);

      const response = await request(app)
        .get(`/api/service-categories/${categoryId}`)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: categoryId,
          name: 'Test Category'
        })
      }));
    });

    it('should return 404 for non-existent category', async () => {
      prismaMock.serviceCategory.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/service-categories/non-existent-id')
        .expect(404);
      
      expect(response.body).toEqual({
        success: false,
        error: 'Category not found',
      });
    });
  });

  describe('PUT /api/service-categories/:id', () => {
    const updatedData = {
      name: 'Updated Category',
      description: 'Updated description',
    };

    it('should update a category (admin only)', async () => {
      const updatedCategory = {
        ...mockCategory,
        ...updatedData,
      };

      prismaMock.serviceCategory.update.mockResolvedValueOnce(updatedCategory);

      const response = await request(app)
        .put(`/api/service-categories/${mockCategory.id}`)
        .set(getAuthHeader(testUsers.admin.token))
        .send(updatedData)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          name: 'Updated Category',
          description: 'Updated description'
        })
      }));

      expect(prismaMock.serviceCategory.update).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: updatedData,
      });
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .put(`/api/service-categories/${mockCategory.id}`)
        .set(getAuthHeader(testUsers.admin.token))
        .send({ name: '' }) // Invalid: empty name
        .expect(400);

      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        error: 'Name is required',
      }));
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`/api/service-categories/${mockCategory.id}`)
        .set(getAuthHeader(testUsers.user.token))
        .send(updatedData)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Access denied. Admin only.',
      });
      expect(prismaMock.serviceCategory.update).not.toHaveBeenCalled();
    });

    it('should return 404 if category not found', async () => {
      prismaMock.serviceCategory.update.mockRejectedValueOnce(
        new Error('Record not found')
      );

      const response = await request(app)
        .put('/api/service-categories/non-existent-id')
        .set(getAuthHeader(testUsers.admin.token))
        .send(updatedData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Category not found',
      });
    });
  });

  describe('DELETE /api/service-categories/:id', () => {
    it('should delete a category (admin only)', async () => {
      prismaMock.serviceCategory.delete.mockResolvedValueOnce(mockCategory);

      const response = await request(app)
        .delete(`/api/service-categories/${mockCategory.id}`)
        .set(getAuthHeader(testUsers.admin.token))
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { id: mockCategory.id },
      });

      expect(prismaMock.serviceCategory.delete).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/service-categories/${mockCategory.id}`)
        .set(getAuthHeader(testUsers.user.token))
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Access denied. Admin only.',
      });
      expect(prismaMock.serviceCategory.delete).not.toHaveBeenCalled();
    });
  });

  describe('Artisan Category Management', () => {
    describe('POST /api/artisans/:id/categories', () => {
      it('should add a category to an artisan', async () => {
        const artisanCategory = {
          id: 'test-artisan-category-id',
          artisanId: testUsers.artisan.id,
          categoryId: mockCategory.id,
        };

        prismaMock.artisanServiceCategory.create.mockResolvedValueOnce(artisanCategory);

        const response = await request(app)
          .post(`/api/artisans/${testUsers.artisan.id}/categories`)
          .set(getAuthHeader(testUsers.artisan.token))
          .send({ categoryId: mockCategory.id })
          .expect(201);

        expect(response.body).toEqual(expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artisanId: testUsers.artisan.id,
            categoryId: mockCategory.id
          })
        }));
      });

      it('should return 400 if category already added', async () => {
        prismaMock.artisanServiceCategory.findUnique.mockResolvedValueOnce({
          id: 'existing-artisan-category-id',
          artisanId: testUsers.artisan.id,
          categoryId: mockCategory.id,
        });

        const response = await request(app)
          .post(`/api/artisans/${testUsers.artisan.id}/categories`)
          .set(getAuthHeader(testUsers.artisan.token))
          .send({ categoryId: mockCategory.id })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Category already added to artisan',
        });
      });
    });

    describe('DELETE /api/artisans/:artisanId/categories/:categoryId', () => {
      it('should remove a category from an artisan', async () => {
        prismaMock.artisanServiceCategory.delete.mockResolvedValueOnce({
          id: 'test-artisan-category-id',
          artisanId: testUsers.artisan.id,
          categoryId: mockCategory.id,
        });

        const response = await request(app)
          .delete(`/api/artisans/${testUsers.artisan.id}/categories/${mockCategory.id}`)
          .set(getAuthHeader(testUsers.artisan.token))
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: { id: 'test-artisan-category-id' },
        });
      });

      it('should return 404 if category not found for artisan', async () => {
        prismaMock.artisanServiceCategory.delete.mockRejectedValueOnce(
          new Error('Record not found')
        );

        const response = await request(app)
          .delete(`/api/artisans/${testUsers.artisan.id}/categories/non-existent-category`)
          .set(getAuthHeader(testUsers.artisan.token))
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: 'Category not found for this artisan',
        });
      });
    });
  });
});
