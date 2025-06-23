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
exports.AuthService = void 0;
const prisma_1 = require("../generated/prisma");
const auth_utils_1 = require("../utils/auth.utils");
const otp_service_1 = __importDefault(require("./otp.service"));
const oauth_service_1 = __importDefault(require("./oauth.service"));
const prisma = new prisma_1.PrismaClient();
class AuthService {
    constructor() { }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    /**
     * Convert Prisma User to our User interface
     */
    convertPrismaUserToUser(prismaUser) {
        return {
            id: prismaUser.id,
            email: prismaUser.email || undefined,
            phone: prismaUser.phone || undefined,
            name: prismaUser.name,
            dateOfBirth: prismaUser.dateOfBirth || undefined,
            role: prismaUser.role,
            authProvider: prismaUser.authProvider,
            isEmailVerified: prismaUser.isEmailVerified,
            isPhoneVerified: prismaUser.isPhoneVerified,
            profileComplete: prismaUser.profileComplete,
            googleId: prismaUser.googleId || undefined,
            avatar: prismaUser.avatar || undefined,
            password: prismaUser.password || undefined,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt
        };
    }
    /**
     * User signup with OTP
     */
    signup(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { identifier, name, dateOfBirth, role = prisma_1.UserRole.CUSTOMER, authProvider } = data;
                // Validate identifier format
                const isEmail = this.isEmail(identifier);
                const isPhone = this.isPhone(identifier);
                if (!isEmail && !isPhone) {
                    throw new Error('Invalid identifier format. Please provide a valid email or phone number.');
                }
                // Check if user already exists
                const existingUser = yield prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: isEmail ? identifier : undefined },
                            { phone: isPhone ? identifier : undefined }
                        ]
                    }
                });
                if (existingUser) {
                    throw new Error('User already exists with this email or phone number.');
                }
                // Create user record (without verification)
                const userData = {
                    name,
                    authProvider: authProvider || (isEmail ? prisma_1.AuthProvider.EMAIL : prisma_1.AuthProvider.PHONE),
                    role,
                    profileComplete: false
                };
                if (isEmail) {
                    userData.email = identifier;
                    userData.isEmailVerified = false;
                }
                else {
                    userData.phone = identifier;
                    userData.isPhoneVerified = false;
                }
                if (dateOfBirth) {
                    userData.dateOfBirth = new Date(dateOfBirth);
                }
                const user = yield prisma.user.create({
                    data: userData
                });
                // Send OTP
                const otpSent = yield otp_service_1.default.sendOTP(identifier, prisma_1.OTPType.SIGNUP, user.id);
                if (!otpSent) {
                    // Clean up user if OTP sending fails
                    yield prisma.user.delete({ where: { id: user.id } });
                    throw new Error('Failed to send OTP. Please try again.');
                }
                return {
                    message: 'OTP sent successfully',
                    identifier,
                    expiresIn: 300 // 5 minutes
                };
            }
            catch (error) {
                console.error('Signup error:', error);
                throw error;
            }
        });
    }
    /**
     * Verify OTP and complete signup
     */
    verifyOTP(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { identifier, otp, type } = data;
                // Verify OTP
                const isValidOTP = yield otp_service_1.default.verifyOTP(identifier, otp, type);
                if (!isValidOTP) {
                    throw new Error('Invalid or expired OTP.');
                }
                // Find user
                const user = yield prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: identifier },
                            { phone: identifier }
                        ]
                    },
                    include: {
                        customer: true,
                        artisan: true
                    }
                });
                if (!user) {
                    throw new Error('User not found.');
                }
                // Update verification status
                const updateData = {};
                if (this.isEmail(identifier)) {
                    updateData.isEmailVerified = true;
                }
                else {
                    updateData.isPhoneVerified = true;
                }
                const updatedUser = yield prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                    include: {
                        customer: true,
                        artisan: true
                    }
                });
                // Create customer or artisan record if not exists
                if (updatedUser.role === prisma_1.UserRole.CUSTOMER && !updatedUser.customer) {
                    yield prisma.customer.create({
                        data: { userId: updatedUser.id }
                    });
                }
                else if (updatedUser.role === prisma_1.UserRole.ARTISAN && !updatedUser.artisan) {
                    yield prisma.artisan.create({
                        data: {
                            userId: updatedUser.id,
                            skills: [],
                            experience: 0,
                            portfolio: [],
                            isProfileComplete: false
                        }
                    });
                }
                // Generate token
                const tokenPayload = {
                    id: updatedUser.id,
                    role: updatedUser.role,
                    authProvider: updatedUser.authProvider,
                    isEmailVerified: updatedUser.isEmailVerified,
                    isPhoneVerified: updatedUser.isPhoneVerified,
                    profileComplete: updatedUser.profileComplete
                };
                const token = (0, auth_utils_1.generateToken)(tokenPayload);
                // Check if profile completion is required
                const requiresProfileCompletion = updatedUser.role === prisma_1.UserRole.ARTISAN && !updatedUser.profileComplete;
                return {
                    message: 'Signup completed successfully',
                    token,
                    user: this.convertPrismaUserToUser(updatedUser),
                    requiresProfileCompletion
                };
            }
            catch (error) {
                console.error('OTP verification error:', error);
                throw error;
            }
        });
    }
    /**
     * User login with OTP
     */
    login(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { identifier } = data;
                // Find user
                const user = yield prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: identifier },
                            { phone: identifier }
                        ]
                    }
                });
                if (!user) {
                    throw new Error('User not found.');
                }
                // Send OTP
                const otpSent = yield otp_service_1.default.sendOTP(identifier, prisma_1.OTPType.LOGIN, user.id);
                if (!otpSent) {
                    throw new Error('Failed to send OTP. Please try again.');
                }
                return {
                    message: 'OTP sent successfully',
                    identifier,
                    expiresIn: 300 // 5 minutes
                };
            }
            catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        });
    }
    /**
     * Verify login OTP
     */
    verifyLoginOTP(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { identifier, otp, type } = data;
                // Verify OTP
                const isValidOTP = yield otp_service_1.default.verifyOTP(identifier, otp, type);
                if (!isValidOTP) {
                    throw new Error('Invalid or expired OTP.');
                }
                // Find user
                const user = yield prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: identifier },
                            { phone: identifier }
                        ]
                    },
                    include: {
                        customer: true,
                        artisan: true
                    }
                });
                if (!user) {
                    throw new Error('User not found.');
                }
                // Generate token
                const tokenPayload = {
                    id: user.id,
                    role: user.role,
                    authProvider: user.authProvider,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                    profileComplete: user.profileComplete
                };
                const token = (0, auth_utils_1.generateToken)(tokenPayload);
                // Check if profile completion is required
                const requiresProfileCompletion = user.role === prisma_1.UserRole.ARTISAN && !user.profileComplete;
                return {
                    message: 'Login successful',
                    token,
                    user: this.convertPrismaUserToUser(user),
                    requiresProfileCompletion
                };
            }
            catch (error) {
                console.error('Login OTP verification error:', error);
                throw error;
            }
        });
    }
    /**
     * Google OAuth authentication
     */
    oauthGoogle(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { googleToken, name, dateOfBirth, role = prisma_1.UserRole.CUSTOMER } = data;
                // Verify Google token
                const googleUserInfo = yield oauth_service_1.default.verifyGoogleToken(googleToken);
                if (!googleUserInfo) {
                    throw new Error('Invalid Google token.');
                }
                // Find or create user
                const user = yield oauth_service_1.default.findOrCreateGoogleUser(googleUserInfo, role);
                // Generate token
                const tokenPayload = {
                    id: user.id,
                    role: user.role,
                    authProvider: user.authProvider,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                    profileComplete: user.profileComplete
                };
                const token = (0, auth_utils_1.generateToken)(tokenPayload);
                // Check if profile completion is required
                const requiresProfileCompletion = user.role === prisma_1.UserRole.ARTISAN && !user.profileComplete;
                return {
                    message: 'Google authentication successful',
                    token,
                    user: this.convertPrismaUserToUser(user),
                    requiresProfileCompletion
                };
            }
            catch (error) {
                console.error('Google OAuth error:', error);
                throw error;
            }
        });
    }
    /**
     * Admin login (email/password only)
     */
    adminLogin(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = data;
                // Find admin user
                const user = yield prisma.user.findFirst({
                    where: {
                        email,
                        role: prisma_1.UserRole.ADMIN
                    },
                    include: {
                        customer: true,
                        artisan: true
                    }
                });
                if (!user || !user.password) {
                    throw new Error('Invalid credentials.');
                }
                // Verify password
                const isValidPassword = yield (0, auth_utils_1.comparePassword)(password, user.password);
                if (!isValidPassword) {
                    throw new Error('Invalid credentials.');
                }
                // Generate token
                const tokenPayload = {
                    id: user.id,
                    role: user.role,
                    authProvider: user.authProvider,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                    profileComplete: user.profileComplete
                };
                const token = (0, auth_utils_1.generateToken)(tokenPayload);
                return {
                    message: 'Admin login successful',
                    token,
                    user: this.convertPrismaUserToUser(user)
                };
            }
            catch (error) {
                console.error('Admin login error:', error);
                throw error;
            }
        });
    }
    /**
     * Refresh token
     */
    refreshToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // TODO: Implement token refresh logic
                // For now, return the same token
                return {
                    message: 'Token refreshed successfully',
                    token
                };
            }
            catch (error) {
                console.error('Token refresh error:', error);
                throw error;
            }
        });
    }
    /**
     * Logout
     */
    logout(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // TODO: Implement token blacklisting
                // For now, just return success
                console.log('User logged out:', token);
            }
            catch (error) {
                console.error('Logout error:', error);
                throw error;
            }
        });
    }
    /**
     * Check if identifier is email
     */
    isEmail(identifier) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(identifier);
    }
    /**
     * Check if identifier is phone
     */
    isPhone(identifier) {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        return phoneRegex.test(identifier) && identifier.length >= 10;
    }
}
exports.AuthService = AuthService;
exports.default = AuthService.getInstance();
