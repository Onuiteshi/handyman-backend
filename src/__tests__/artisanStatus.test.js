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
const prisma_1 = __importDefault(require("../lib/prisma"));
let artisanToken;
let artisanId;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean up database
    yield prisma_1.default.oTPVerification.deleteMany({});
    yield prisma_1.default.customer.deleteMany({});
    yield prisma_1.default.artisan.deleteMany({});
    yield prisma_1.default.user.deleteMany({});
    // 1. Signup as artisan
    const signupRes = yield (0, supertest_1.default)(index_1.app)
        .post('/api/auth/signup')
        .send({
        identifier: 'artisanstatus@example.com',
        name: 'Artisan Status',
        role: 'ARTISAN'
    });
    expect(signupRes.status).toBe(200);
    // 2. Get OTP from the response or database
    const otpVerification = yield prisma_1.default.oTPVerification.findFirst({
        where: { identifier: 'artisanstatus@example.com' }
    });
    expect(otpVerification).toBeTruthy();
    // 3. Verify OTP to complete signup and create artisan profile
    const verifyRes = yield (0, supertest_1.default)(index_1.app)
        .post('/api/auth/verify-signup')
        .send({
        identifier: 'artisanstatus@example.com',
        otp: otpVerification.otp,
        type: 'SIGNUP'
    });
    expect(verifyRes.status).toBe(200);
    artisanToken = verifyRes.body.token;
    // 4. Get the artisan ID from the created profile
    const user = yield prisma_1.default.user.findUnique({
        where: { email: 'artisanstatus@example.com' },
        include: { artisan: true }
    });
    expect(user).toBeTruthy();
    expect(user.artisan).toBeTruthy();
    artisanId = user.id;
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$disconnect();
}));
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    // Clean up artisan status fields for isolation if needed
    // (Optional: reset fields if your tests modify them)
}));
// Helper function to get auth header
const getAuthHeader = (token) => ({
    'Authorization': `Bearer ${token}`
});
describe('Artisan Status API', () => {
    describe('GET /api/artisan/status', () => {
        it('should return artisan status', () => __awaiter(void 0, void 0, void 0, function* () {
            // Enable online and location tracking for the artisan
            yield prisma_1.default.artisan.update({
                where: { userId: artisanId },
                data: { isOnline: true, locationTracking: true }
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/artisan/status')
                .set(getAuthHeader(artisanToken));
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('isOnline', true);
            expect(response.body).toHaveProperty('locationTracking', true);
        }));
        it('should handle missing artisan', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a customer user with proper authentication
            const customerSignupRes = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: 'customer@example.com',
                name: 'Customer User',
                role: 'CUSTOMER'
            });
            expect(customerSignupRes.status).toBe(200);
            // Get OTP for customer
            const customerOtpVerification = yield prisma_1.default.oTPVerification.findFirst({
                where: { identifier: 'customer@example.com' }
            });
            expect(customerOtpVerification).toBeTruthy();
            // Verify OTP to get customer token
            const customerVerifyRes = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/verify-signup')
                .send({
                identifier: 'customer@example.com',
                otp: customerOtpVerification.otp,
                type: 'SIGNUP'
            });
            expect(customerVerifyRes.status).toBe(200);
            const customerToken = customerVerifyRes.body.token;
            const response = yield (0, supertest_1.default)(index_1.app)
                .get('/api/artisan/status')
                .set(getAuthHeader(customerToken));
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Artisan profile not found');
        }));
    });
    describe('PUT /api/artisan/online-status', () => {
        it('should update online status', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .put('/api/artisan/online-status')
                .set(getAuthHeader(artisanToken))
                .send({ isOnline: true });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Online status updated successfully');
            expect(response.body).toHaveProperty('isOnline', true);
        }));
        it('should validate request body', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .put('/api/artisan/online-status')
                .set(getAuthHeader(artisanToken))
                .send({ isOnline: 'invalid' });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.errors[0]).toHaveProperty('message', 'isOnline must be a boolean');
        }));
    });
    describe('PUT /api/artisan/location-consent', () => {
        it('should update location tracking consent with valid data', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .put('/api/artisan/location-consent')
                .set(getAuthHeader(artisanToken))
                .send({
                locationTracking: true
            });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Location tracking preference updated successfully');
            expect(response.body).toHaveProperty('locationTracking', true);
        }));
        it('should disable location tracking when requested', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .put('/api/artisan/location-consent')
                .set(getAuthHeader(artisanToken))
                .send({ locationTracking: false });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Location tracking preference updated successfully');
            expect(response.body).toHaveProperty('locationTracking', false);
        }));
        it('should validate location data when enabling tracking', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .put('/api/artisan/location-consent')
                .set(getAuthHeader(artisanToken))
                .send({
                locationTracking: 'invalid'
            });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.errors[0]).toHaveProperty('message', 'locationTracking must be a boolean');
        }));
    });
    describe('PUT /api/artisan/location', () => {
        it('should update location when tracking is enabled', () => __awaiter(void 0, void 0, void 0, function* () {
            // Enable location tracking first
            yield prisma_1.default.artisan.update({
                where: { userId: artisanId },
                data: { locationTracking: true }
            });
            const response = yield (0, supertest_1.default)(index_1.app)
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
        }));
        it('should return error when tracking is disabled', () => __awaiter(void 0, void 0, void 0, function* () {
            // Disable location tracking
            yield prisma_1.default.artisan.update({
                where: { userId: artisanId },
                data: { locationTracking: false }
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .put('/api/artisan/location')
                .set(getAuthHeader(artisanToken))
                .send({
                latitude: 40.7128,
                longitude: -74.0060
            });
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message', 'Location tracking is disabled');
        }));
        it('should validate location data', () => __awaiter(void 0, void 0, void 0, function* () {
            // Enable location tracking first
            yield prisma_1.default.artisan.update({
                where: { userId: artisanId },
                data: { locationTracking: true }
            });
            const response = yield (0, supertest_1.default)(index_1.app)
                .put('/api/artisan/location')
                .set(getAuthHeader(artisanToken))
                .send({
                latitude: 'invalid',
                longitude: 'invalid'
            });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body.errors[0]).toHaveProperty('message', 'latitude must be a number');
        }));
    });
});
