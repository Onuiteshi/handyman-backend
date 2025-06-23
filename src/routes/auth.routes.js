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
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = require("../generated/prisma");
const auth_service_1 = __importDefault(require("../services/auth.service"));
const router = (0, express_1.Router)();
// Validation middleware
const validateSignup = [
    (0, express_validator_1.body)('identifier')
        .notEmpty()
        .withMessage('Email or phone number is required')
        .custom((value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
            throw new Error('Please provide a valid email or phone number');
        }
        return true;
    }),
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn([prisma_1.UserRole.CUSTOMER, prisma_1.UserRole.ARTISAN])
        .withMessage('Role must be either CUSTOMER or ARTISAN'),
    (0, express_validator_1.body)('authProvider')
        .optional()
        .isIn([prisma_1.AuthProvider.EMAIL, prisma_1.AuthProvider.PHONE])
        .withMessage('Auth provider must be either EMAIL or PHONE')
];
const validateLogin = [
    (0, express_validator_1.body)('identifier')
        .notEmpty()
        .withMessage('Email or phone number is required')
];
const validateOTPVerification = [
    (0, express_validator_1.body)('identifier')
        .notEmpty()
        .withMessage('Email or phone number is required'),
    (0, express_validator_1.body)('otp')
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('OTP type is required')
        .isIn([prisma_1.OTPType.SIGNUP, prisma_1.OTPType.LOGIN, prisma_1.OTPType.VERIFICATION])
        .withMessage('Invalid OTP type')
];
const validateOAuthGoogle = [
    (0, express_validator_1.body)('googleToken')
        .notEmpty()
        .withMessage('Google token is required'),
    (0, express_validator_1.body)('name')
        .optional()
        .notEmpty()
        .withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn([prisma_1.UserRole.CUSTOMER, prisma_1.UserRole.ARTISAN])
        .withMessage('Role must be either CUSTOMER or ARTISAN')
];
const validateAdminLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];
// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: {
                message: 'Validation failed',
                status: 400,
                details: errors.array()
            }
        });
        return;
    }
    next();
};
// User signup
router.post('/signup', [...validateSignup, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const signupData = req.body;
        const result = yield auth_service_1.default.signup(signupData);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: {
                message: error.message,
                status: 400
            }
        });
    }
}));
// Verify OTP (for signup)
router.post('/verify-signup', [...validateOTPVerification, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const otpData = Object.assign(Object.assign({}, req.body), { type: prisma_1.OTPType.SIGNUP });
        const result = yield auth_service_1.default.verifyOTP(otpData);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: {
                message: error.message,
                status: 400
            }
        });
    }
}));
// User login
router.post('/login', [...validateLogin, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginData = req.body;
        const result = yield auth_service_1.default.login(loginData);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: {
                message: error.message,
                status: 400
            }
        });
    }
}));
// Verify OTP (for login)
router.post('/verify-login', [...validateOTPVerification, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const otpData = Object.assign(Object.assign({}, req.body), { type: prisma_1.OTPType.LOGIN });
        const result = yield auth_service_1.default.verifyLoginOTP(otpData);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: {
                message: error.message,
                status: 400
            }
        });
    }
}));
// Google OAuth
router.post('/google', [...validateOAuthGoogle, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const oauthData = req.body;
        const result = yield auth_service_1.default.oauthGoogle(oauthData);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: {
                message: error.message,
                status: 400
            }
        });
    }
}));
// Admin login (email/password only)
router.post('/admin/login', [...validateAdminLogin, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminData = req.body;
        const result = yield auth_service_1.default.adminLogin(adminData);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: {
                message: error.message,
                status: 400
            }
        });
    }
}));
// Refresh token
router.post('/refresh', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({
                error: {
                    message: 'Token is required',
                    status: 400
                }
            });
            return;
        }
        const result = yield auth_service_1.default.refreshToken(token);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({
            error: {
                message: error.message,
                status: 400
            }
        });
    }
}));
// Logout
router.post('/logout', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({
                error: {
                    message: 'Token is required',
                    status: 400
                }
            });
            return;
        }
        yield auth_service_1.default.logout(token);
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(400).json({
            error: {
                message: error.message,
                status: 400
            }
        });
    }
}));
exports.default = router;
