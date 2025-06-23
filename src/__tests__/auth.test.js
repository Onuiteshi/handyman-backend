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
const prisma_1 = require("../generated/prisma");
const index_1 = require("../index");
const prisma_2 = __importDefault(require("../lib/prisma"));
const prismaClient = new prisma_1.PrismaClient();
describe('Authentication System', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up database before tests
        yield prismaClient.oTPVerification.deleteMany();
        yield prismaClient.artisan.deleteMany();
        yield prismaClient.customer.deleteMany();
        yield prismaClient.user.deleteMany();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prismaClient.$disconnect();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up all relevant tables before each test
        yield prisma_2.default.oTPVerification.deleteMany({});
        yield prisma_2.default.customer.deleteMany({});
        yield prisma_2.default.artisan.deleteMany({});
        yield prisma_2.default.user.deleteMany({});
    }));
    describe('Customer Signup Flow', () => {
        it('should send OTP for customer signup with email', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: 'customer@example.com',
                name: 'John Doe',
                role: prisma_1.UserRole.CUSTOMER
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('OTP sent successfully');
            expect(response.body.identifier).toBe('customer@example.com');
        }));
        it('should send OTP for customer signup with phone', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: '+1234567890',
                name: 'Jane Smith',
                role: prisma_1.UserRole.CUSTOMER
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('OTP sent successfully');
            expect(response.body.identifier).toBe('+1234567890');
        }));
        it('should reject invalid email format', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: 'invalid-email',
                name: 'Test User',
                role: prisma_1.UserRole.CUSTOMER
            });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Validation failed');
        }));
        it('should reject invalid phone format', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: '123',
                name: 'Test User',
                role: prisma_1.UserRole.CUSTOMER
            });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Invalid identifier format. Please provide a valid email or phone number.');
        }));
    });
    describe('Artisan Signup Flow', () => {
        it('should send OTP for artisan signup', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: 'artisan@example.com',
                name: 'Artisan User',
                role: prisma_1.UserRole.ARTISAN
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('OTP sent successfully');
            expect(response.body.identifier).toBe('artisan@example.com');
        }));
    });
    describe('OTP Verification', () => {
        it('should verify valid OTP and complete signup', () => __awaiter(void 0, void 0, void 0, function* () {
            // First send OTP
            yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: 'test@example.com',
                name: 'Test User',
                role: prisma_1.UserRole.CUSTOMER
            });
            // Get the OTP from database
            const otpRecord = yield prismaClient.oTPVerification.findFirst({
                where: {
                    identifier: 'test@example.com',
                    type: prisma_1.OTPType.SIGNUP,
                    isUsed: false
                }
            });
            expect(otpRecord).toBeTruthy();
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/verify-signup')
                .send({
                identifier: 'test@example.com',
                otp: otpRecord.otp,
                type: prisma_1.OTPType.SIGNUP
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Signup completed successfully');
            expect(response.body.token).toBeTruthy();
            expect(response.body.user).toBeTruthy();
            expect(response.body.user.email).toBe('test@example.com');
        }));
        it('should reject invalid OTP', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/verify-signup')
                .send({
                identifier: 'test@example.com',
                otp: '000000',
                type: prisma_1.OTPType.SIGNUP
            });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Invalid or expired OTP.');
        }));
    });
    describe('Login Flow', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create a verified user
            const user = yield prismaClient.user.create({
                data: {
                    email: 'loginflow@example.com',
                    name: 'Login User',
                    role: prisma_1.UserRole.CUSTOMER,
                    authProvider: prisma_1.AuthProvider.EMAIL,
                    isEmailVerified: true
                }
            });
            yield prismaClient.customer.create({
                data: { userId: user.id }
            });
        }));
        it('should send OTP for login', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send({
                identifier: 'loginflow@example.com'
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('OTP sent successfully');
            expect(response.body.identifier).toBe('loginflow@example.com');
        }));
        it('should verify login OTP and authenticate user', () => __awaiter(void 0, void 0, void 0, function* () {
            // Send login OTP
            yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send({
                identifier: 'loginflow@example.com'
            });
            // Get the OTP from database
            const otpRecord = yield prismaClient.oTPVerification.findFirst({
                where: {
                    identifier: 'loginflow@example.com',
                    type: prisma_1.OTPType.LOGIN,
                    isUsed: false
                }
            });
            expect(otpRecord).toBeTruthy();
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/verify-login')
                .send({
                identifier: 'loginflow@example.com',
                otp: otpRecord.otp,
                type: prisma_1.OTPType.LOGIN
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.token).toBeTruthy();
            expect(response.body.user).toBeTruthy();
            expect(response.body.user.email).toBe('loginflow@example.com');
        }));
    });
    describe('Google OAuth', () => {
        it('should handle Google OAuth authentication', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/google')
                .send({
                googleToken: 'mock_google_token',
                name: 'Google User',
                role: prisma_1.UserRole.CUSTOMER
            });
            // In development mode, this should work with mock data
            if (process.env.NODE_ENV === 'development') {
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Google authentication successful');
                expect(response.body.token).toBeTruthy();
            }
            else {
                // In production, this would fail without real Google token
                expect(response.status).toBe(400);
            }
        }));
    });
    describe('Admin Authentication', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Create an admin user with password
            const hashedPassword = yield require('bcryptjs').hash('admin123', 10);
            yield prismaClient.user.create({
                data: {
                    email: 'adminauth@example.com',
                    name: 'Admin User',
                    role: prisma_1.UserRole.ADMIN,
                    authProvider: prisma_1.AuthProvider.EMAIL,
                    password: hashedPassword,
                    isEmailVerified: true
                }
            });
        }));
        it('should authenticate admin with email and password', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/admin/login')
                .send({
                email: 'adminauth@example.com',
                password: 'admin123'
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Admin login successful');
            expect(response.body.token).toBeTruthy();
            expect(response.body.user.role).toBe(prisma_1.UserRole.ADMIN);
        }));
        it('should reject admin login with wrong password', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/admin/login')
                .send({
                email: 'adminauth@example.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Invalid credentials.');
        }));
    });
    describe('Token Management', () => {
        it('should refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/refresh')
                .send({
                token: 'mock_token'
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Token refreshed successfully');
        }));
        it('should handle logout', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/logout')
                .send({
                token: 'mock_token'
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Logged out successfully');
        }));
    });
    describe('Error Handling', () => {
        it('should handle missing required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('Validation failed');
        }));
        it('should handle duplicate user signup', () => __awaiter(void 0, void 0, void 0, function* () {
            // First signup
            yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: 'duplicate@example.com',
                name: 'First User',
                role: prisma_1.UserRole.CUSTOMER
            });
            // Second signup with same email
            const response = yield (0, supertest_1.default)(index_1.app)
                .post('/api/auth/signup')
                .send({
                identifier: 'duplicate@example.com',
                name: 'Second User',
                role: prisma_1.UserRole.CUSTOMER
            });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toBe('User already exists with this email or phone number.');
        }));
    });
});
