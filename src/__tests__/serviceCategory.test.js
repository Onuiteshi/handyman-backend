"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const testSetup_1 = require("./testSetup");
const testUtils_1 = require("./testUtils");
// Import the mock to ensure it's loaded before the tests
require("../__mocks__/@prisma/client");
// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn((token, secret, callback) => {
        if (token === testUtils_1.testUsers.admin.token) {
            callback(null, { id: testUtils_1.testUsers.admin.id, role: 'ADMIN' });
        }
        else if (token === testUtils_1.testUsers.artisan.token) {
            callback(null, { id: testUtils_1.testUsers.artisan.id, role: 'ARTISAN' });
        }
        else if (token === testUtils_1.testUsers.user.token) {
            callback(null, { id: testUtils_1.testUsers.user.id, role: 'USER' });
        }
        else {
            callback(new Error('Invalid token'), null);
        }
    }),
}));
describe('Service Category API', () => {
    // Helper function to get auth header
    const getAuthHeader = (token) => ({
        'Authorization': `Bearer ${token}`,
    });
    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock implementations
        testSetup_1.prismaMock.serviceCategory.findMany.mockResolvedValue([testUtils_1.mockCategory]);
        testSetup_1.prismaMock.serviceCategory.findUnique.mockResolvedValue(testUtils_1.mockCategory);
        testSetup_1.prismaMock.serviceCategory.create.mockResolvedValue(testUtils_1.mockCategory);
        testSetup_1.prismaMock.serviceCategory.update.mockResolvedValue(testUtils_1.mockCategory);
        testSetup_1.prismaMock.serviceCategory.delete.mockResolvedValue(testUtils_1.mockCategory);
        testSetup_1.prismaMock.artisan.findUnique.mockResolvedValue(testUtils_1.mockArtisan);
        testSetup_1.prismaMock.artisanServiceCategory.findUnique.mockResolvedValue(null);
        testSetup_1.prismaMock.artisanServiceCategory.create.mockResolvedValue({
            id: 'test-artisan-category-id',
            artisanId: testUtils_1.mockArtisan.id,
            categoryId: testUtils_1.mockCategory.id,
        });
    });
    describe('GET /api/service-categories', () => {
        it('should return all service categories', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
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
        }));
    });
    describe('POST /api/service-categories', () => {
        it('should create a new category (admin only)', () => __awaiter(void 0, void 0, void 0, function* () {
            const newCategory = {
                name: 'New Category',
                description: 'A new service category',
            };
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/service-categories')
                .set(getAuthHeader(testUtils_1.testUsers.admin.token))
                .send(newCategory)
                .expect(201);
            expect(response.body).toEqual(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    name: 'New Category',
                    description: 'A new service category',
                })
            }));
        }));
        it('should return 400 for invalid input', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/service-categories')
                .set(getAuthHeader(testUtils_1.testUsers.admin.token))
                .send({}) // Missing required name field
                .expect(400);
            expect(response.body).toEqual(expect.objectContaining({
                success: false,
                error: 'Name is required',
            }));
        }));
        it('should return 403 for non-admin users', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/service-categories')
                .set(getAuthHeader(testUtils_1.testUsers.user.token))
                .send({ name: 'New Category' })
                .expect(403);
            expect(response.body).toEqual({
                success: false,
                error: 'Access denied. Admin only.',
            });
            expect(testSetup_1.prismaMock.serviceCategory.create).not.toHaveBeenCalled();
        }));
    });
    describe('GET /api/service-categories/:id', () => {
        it('should return a category by ID', () => __awaiter(void 0, void 0, void 0, function* () {
            const categoryId = 'test-category-id';
            const testCategory = Object.assign(Object.assign({}, testUtils_1.mockCategory), { id: categoryId, name: 'Test Category' });
            testSetup_1.prismaMock.serviceCategory.findUnique.mockResolvedValueOnce(testCategory);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get(`/api/service-categories/${categoryId}`)
                .expect(200);
            expect(response.body).toEqual(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: categoryId,
                    name: 'Test Category'
                })
            }));
        }));
        it('should return 404 for non-existent category', () => __awaiter(void 0, void 0, void 0, function* () {
            testSetup_1.prismaMock.serviceCategory.findUnique.mockResolvedValueOnce(null);
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/service-categories/non-existent-id')
                .expect(404);
            expect(response.body).toEqual({
                success: false,
                error: 'Category not found',
            });
        }));
    });
    describe('PUT /api/service-categories/:id', () => {
        const updatedData = {
            name: 'Updated Category',
            description: 'Updated description',
        };
        it('should update a category (admin only)', () => __awaiter(void 0, void 0, void 0, function* () {
            const updatedCategory = Object.assign(Object.assign({}, testUtils_1.mockCategory), updatedData);
            testSetup_1.prismaMock.serviceCategory.update.mockResolvedValueOnce(updatedCategory);
            const response = yield (0, supertest_1.default)(index_1.app)
                .put(`/api/service-categories/${testUtils_1.mockCategory.id}`)
                .set(getAuthHeader(testUtils_1.testUsers.admin.token))
                .send(updatedData)
                .expect(200);
            expect(response.body).toEqual(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    name: 'Updated Category',
                    description: 'Updated description'
                })
            }));
            expect(testSetup_1.prismaMock.serviceCategory.update).toHaveBeenCalledWith({
                where: { id: testUtils_1.mockCategory.id },
                data: updatedData,
            });
        }));
        it('should return 400 for invalid input', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .put(`/api/service-categories/${testUtils_1.mockCategory.id}`)
                .set(getAuthHeader(testUtils_1.testUsers.admin.token))
                .send({ name: '' }) // Invalid: empty name
                .expect(400);
            expect(response.body).toEqual(expect.objectContaining({
                success: false,
                error: 'Name is required',
            }));
        }));
        it('should return 403 for non-admin users', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .put(`/api/service-categories/${testUtils_1.mockCategory.id}`)
                .set(getAuthHeader(testUtils_1.testUsers.user.token))
                .send(updatedData)
                .expect(403);
            expect(response.body).toEqual({
                success: false,
                error: 'Access denied. Admin only.',
            });
            expect(testSetup_1.prismaMock.serviceCategory.update).not.toHaveBeenCalled();
        }));
        it('should return 404 if category not found', () => __awaiter(void 0, void 0, void 0, function* () {
            testSetup_1.prismaMock.serviceCategory.update.mockRejectedValueOnce(new Error('Record not found'));
            const response = yield (0, supertest_1.default)(index_1.app)
                .put('/api/service-categories/non-existent-id')
                .set(getAuthHeader(testUtils_1.testUsers.admin.token))
                .send(updatedData)
                .expect(404);
            expect(response.body).toEqual({
                success: false,
                error: 'Category not found',
            });
        }));
    });
    describe('DELETE /api/service-categories/:id', () => {
        it('should delete a category (admin only)', () => __awaiter(void 0, void 0, void 0, function* () {
            testSetup_1.prismaMock.serviceCategory.delete.mockResolvedValueOnce(testUtils_1.mockCategory);
            const response = yield (0, supertest_1.default)(index_1.app)
                .delete(`/api/service-categories/${testUtils_1.mockCategory.id}`)
                .set(getAuthHeader(testUtils_1.testUsers.admin.token))
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                data: { id: testUtils_1.mockCategory.id },
            });
            expect(testSetup_1.prismaMock.serviceCategory.delete).toHaveBeenCalledWith({
                where: { id: testUtils_1.mockCategory.id },
            });
        }));
        it('should return 403 for non-admin users', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .delete(`/api/service-categories/${testUtils_1.mockCategory.id}`)
                .set(getAuthHeader(testUtils_1.testUsers.user.token))
                .expect(403);
            expect(response.body).toEqual({
                success: false,
                error: 'Access denied. Admin only.',
            });
            expect(testSetup_1.prismaMock.serviceCategory.delete).not.toHaveBeenCalled();
        }));
    });
    describe('Artisan Category Management', () => {
        describe('POST /api/artisans/:id/categories', () => {
            it('should add a category to an artisan', () => __awaiter(void 0, void 0, void 0, function* () {
                const artisanCategory = {
                    id: 'test-artisan-category-id',
                    artisanId: testUtils_1.testUsers.artisan.id,
                    categoryId: testUtils_1.mockCategory.id,
                };
                testSetup_1.prismaMock.artisanServiceCategory.create.mockResolvedValueOnce(artisanCategory);
                const response = yield (0, supertest_1.default)(index_1.app)
                    .post(`/api/artisans/${testUtils_1.testUsers.artisan.id}/categories`)
                    .set(getAuthHeader(testUtils_1.testUsers.artisan.token))
                    .send({ categoryId: testUtils_1.mockCategory.id })
                    .expect(201);
                expect(response.body).toEqual(expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        artisanId: testUtils_1.testUsers.artisan.id,
                        categoryId: testUtils_1.mockCategory.id
                    })
                }));
            }));
            it('should return 400 if category already added', () => __awaiter(void 0, void 0, void 0, function* () {
                testSetup_1.prismaMock.artisanServiceCategory.findUnique.mockResolvedValueOnce({
                    id: 'existing-artisan-category-id',
                    artisanId: testUtils_1.testUsers.artisan.id,
                    categoryId: testUtils_1.mockCategory.id,
                });
                const response = yield (0, supertest_1.default)(index_1.app)
                    .post(`/api/artisans/${testUtils_1.testUsers.artisan.id}/categories`)
                    .set(getAuthHeader(testUtils_1.testUsers.artisan.token))
                    .send({ categoryId: testUtils_1.mockCategory.id })
                    .expect(400);
                expect(response.body).toEqual({
                    success: false,
                    error: 'Category already added to artisan',
                });
            }));
        });
        describe('DELETE /api/artisans/:artisanId/categories/:categoryId', () => {
            it('should remove a category from an artisan', () => __awaiter(void 0, void 0, void 0, function* () {
                testSetup_1.prismaMock.artisanServiceCategory.delete.mockResolvedValueOnce({
                    id: 'test-artisan-category-id',
                    artisanId: testUtils_1.testUsers.artisan.id,
                    categoryId: testUtils_1.mockCategory.id,
                });
                const response = yield (0, supertest_1.default)(index_1.app)
                    .delete(`/api/artisans/${testUtils_1.testUsers.artisan.id}/categories/${testUtils_1.mockCategory.id}`)
                    .set(getAuthHeader(testUtils_1.testUsers.artisan.token))
                    .expect(200);
                expect(response.body).toEqual({
                    success: true,
                    data: { id: 'test-artisan-category-id' },
                });
            }));
            it('should return 404 if category not found for artisan', () => __awaiter(void 0, void 0, void 0, function* () {
                testSetup_1.prismaMock.artisanServiceCategory.delete.mockRejectedValueOnce(new Error('Record not found'));
                const response = yield (0, supertest_1.default)(index_1.app)
                    .delete(`/api/artisans/${testUtils_1.testUsers.artisan.id}/categories/non-existent-category`)
                    .set(getAuthHeader(testUtils_1.testUsers.artisan.token))
                    .expect(404);
                expect(response.body).toEqual({
                    success: false,
                    error: 'Category not found for this artisan',
                });
            }));
        });
    });
});
