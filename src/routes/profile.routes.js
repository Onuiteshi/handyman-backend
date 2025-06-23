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
const profile_service_1 = __importDefault(require("../services/profile.service"));
const profile_middleware_1 = require("../middleware/profile.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation middleware
const validateCreateProfile = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Profile name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Profile name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('Profile type is required')
        .isIn([prisma_1.ProfileType.PERSONAL, prisma_1.ProfileType.BUSINESS, prisma_1.ProfileType.FREELANCE, prisma_1.ProfileType.CORPORATE])
        .withMessage('Invalid profile type'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    (0, express_validator_1.body)('avatar')
        .optional()
        .isURL()
        .withMessage('Avatar must be a valid URL'),
    (0, express_validator_1.body)('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be an object'),
    (0, express_validator_1.body)('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object')
];
const validateSwitchProfile = [
    (0, express_validator_1.body)('profileId')
        .notEmpty()
        .withMessage('Profile ID is required')
        .isUUID()
        .withMessage('Profile ID must be a valid UUID'),
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
    })
];
const validateProfileAuthentication = [
    (0, express_validator_1.body)('profileId')
        .notEmpty()
        .withMessage('Profile ID is required')
        .isUUID()
        .withMessage('Profile ID must be a valid UUID'),
    (0, express_validator_1.body)('identifier')
        .notEmpty()
        .withMessage('Email or phone number is required'),
    (0, express_validator_1.body)('otp')
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
];
const validateInviteToProfile = [
    (0, express_validator_1.body)('profileId')
        .notEmpty()
        .withMessage('Profile ID is required')
        .isUUID()
        .withMessage('Profile ID must be a valid UUID'),
    (0, express_validator_1.body)('invitedEmail')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('invitedPhone')
        .optional()
        .custom((value) => {
        if (value) {
            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
            if (!phoneRegex.test(value)) {
                throw new Error('Please provide a valid phone number');
            }
        }
        return true;
    }),
    (0, express_validator_1.body)('role')
        .notEmpty()
        .withMessage('Role is required')
        .isIn([prisma_1.UserRole.CUSTOMER, prisma_1.UserRole.ARTISAN])
        .withMessage('Role must be either CUSTOMER or ARTISAN'),
    (0, express_validator_1.body)('message')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Message must be less than 200 characters')
];
const validateAcceptInvitation = [
    (0, express_validator_1.body)('invitationId')
        .notEmpty()
        .withMessage('Invitation ID is required')
        .isUUID()
        .withMessage('Invitation ID must be a valid UUID'),
    (0, express_validator_1.body)('userId')
        .notEmpty()
        .withMessage('User ID is required')
        .isUUID()
        .withMessage('User ID must be a valid UUID')
];
const validateCustomerProfile = [
    (0, express_validator_1.body)('preferences')
        .optional()
        .isObject()
        .withMessage('Preferences must be an object'),
    (0, express_validator_1.body)('billingAddress')
        .optional()
        .isObject()
        .withMessage('Billing address must be an object'),
    (0, express_validator_1.body)('paymentMethods')
        .optional()
        .isObject()
        .withMessage('Payment methods must be an object')
];
const validateArtisanProfile = [
    (0, express_validator_1.body)('skills')
        .isArray()
        .withMessage('Skills must be an array'),
    (0, express_validator_1.body)('skills.*')
        .isString()
        .withMessage('Each skill must be a string'),
    (0, express_validator_1.body)('experience')
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience must be between 0 and 50 years'),
    (0, express_validator_1.body)('portfolio')
        .optional()
        .isArray()
        .withMessage('Portfolio must be an array'),
    (0, express_validator_1.body)('portfolio.*')
        .optional()
        .isURL()
        .withMessage('Portfolio items must be valid URLs'),
    (0, express_validator_1.body)('bio')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Bio must be less than 1000 characters'),
    (0, express_validator_1.body)('photoUrl')
        .optional()
        .isURL()
        .withMessage('Photo URL must be a valid URL'),
    (0, express_validator_1.body)('idDocumentUrl')
        .optional()
        .isURL()
        .withMessage('ID document URL must be a valid URL'),
    (0, express_validator_1.body)('hourlyRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Hourly rate must be a positive number'),
    (0, express_validator_1.body)('availability')
        .optional()
        .isObject()
        .withMessage('Availability must be an object')
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
// Create a new profile
router.post('/create', [
    auth_middleware_1.authMiddleware,
    ...validateCreateProfile,
    profile_middleware_1.validateProfileData,
    handleValidationErrors
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const profileData = req.body;
        const result = yield profile_service_1.default.createProfile(userId, profileData);
        res.status(201).json(result);
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
// Get user's profiles
router.get('/my-profiles', [
    auth_middleware_1.authMiddleware
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const result = yield profile_service_1.default.getUserProfiles(userId);
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
// Switch to a profile
router.post('/switch', [
    auth_middleware_1.authMiddleware,
    ...validateSwitchProfile,
    profile_middleware_1.rateLimitProfileSwitch,
    handleValidationErrors
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const switchData = req.body;
        const result = yield profile_service_1.default.switchProfile(userId, switchData);
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
// Authenticate for profile switch
router.post('/authenticate', [
    ...validateProfileAuthentication,
    handleValidationErrors
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authData = req.body;
        const result = yield profile_service_1.default.authenticateProfileSwitch(authData);
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
// Refresh profile session
router.post('/refresh-session', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({
                error: {
                    message: 'Refresh token is required',
                    status: 400
                }
            });
            return;
        }
        const result = yield profile_service_1.default.refreshProfileSession(refreshToken);
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
// Revoke profile session
router.delete('/sessions/:sessionId', [
    profile_middleware_1.profileAuthMiddleware,
    profile_middleware_1.logProfileAccess
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = req.params.sessionId;
        const userId = req.profileUser.userId;
        yield profile_service_1.default.revokeProfileSession(sessionId, userId);
        res.status(200).json({ message: 'Session revoked successfully' });
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
// Update profile
router.put('/:profileId', [
    profile_middleware_1.profileAuthMiddleware,
    (0, profile_middleware_1.requireProfileAccess)(),
    (0, profile_middleware_1.requireProfilePermission)('edit'),
    profile_middleware_1.requireActiveProfile,
    profile_middleware_1.logProfileAccess,
    ...validateCreateProfile.slice(1), // Skip name validation for updates
    profile_middleware_1.validateProfileData,
    handleValidationErrors
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const userId = req.profileUser.userId;
        const updateData = req.body;
        const result = yield profile_service_1.default.updateProfile(profileId, userId, updateData);
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
// Delete profile
router.delete('/:profileId', [
    profile_middleware_1.profileAuthMiddleware,
    (0, profile_middleware_1.requireProfileAccess)(),
    profile_middleware_1.requireProfileOwner,
    profile_middleware_1.logProfileAccess
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const userId = req.profileUser.userId;
        yield profile_service_1.default.deleteProfile(profileId, userId);
        res.status(200).json({ message: 'Profile deleted successfully' });
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
// Invite user to profile
router.post('/:profileId/invite', [
    profile_middleware_1.profileAuthMiddleware,
    (0, profile_middleware_1.requireProfileAccess)(),
    (0, profile_middleware_1.requireProfilePermission)('invite'),
    profile_middleware_1.requireActiveProfile,
    profile_middleware_1.logProfileAccess,
    ...validateInviteToProfile.slice(1), // Skip profileId validation since it's in URL
    handleValidationErrors
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const inviterId = req.profileUser.userId;
        const inviteData = Object.assign(Object.assign({}, req.body), { profileId });
        const result = yield profile_service_1.default.inviteToProfile(inviterId, inviteData);
        res.status(201).json(result);
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
// Accept profile invitation
router.post('/invitations/:invitationId/accept', [
    auth_middleware_1.authMiddleware,
    ...validateAcceptInvitation.slice(1), // Skip invitationId validation since it's in URL
    handleValidationErrors
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invitationId = req.params.invitationId;
        const userId = req.user.id;
        const acceptData = {
            invitationId,
            userId
        };
        const result = yield profile_service_1.default.acceptInvitation(acceptData);
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
// Get profile analytics
router.get('/:profileId/analytics', [
    profile_middleware_1.profileAuthMiddleware,
    (0, profile_middleware_1.requireProfileAccess)(),
    (0, profile_middleware_1.requireProfilePermission)('view_analytics'),
    profile_middleware_1.requireActiveProfile,
    profile_middleware_1.logProfileAccess
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const userId = req.profileUser.userId;
        const analytics = yield profile_service_1.default.getProfileAnalytics(profileId, userId);
        res.status(200).json({
            message: 'Analytics retrieved successfully',
            analytics
        });
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
// Update customer profile data
router.put('/:profileId/customer', [
    profile_middleware_1.profileAuthMiddleware,
    (0, profile_middleware_1.requireProfileAccess)(),
    (0, profile_middleware_1.requireProfilePermission)('edit'),
    profile_middleware_1.requireActiveProfile,
    profile_middleware_1.logProfileAccess,
    ...validateCustomerProfile,
    handleValidationErrors
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const userId = req.profileUser.userId;
        const customerData = req.body;
        // This would be implemented in the profile service
        // For now, return a placeholder response
        res.status(200).json({
            message: 'Customer profile updated successfully',
            profileId,
            customerData
        });
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
// Update artisan profile data
router.put('/:profileId/artisan', [
    profile_middleware_1.profileAuthMiddleware,
    (0, profile_middleware_1.requireProfileAccess)(),
    (0, profile_middleware_1.requireProfilePermission)('edit'),
    profile_middleware_1.requireActiveProfile,
    profile_middleware_1.logProfileAccess,
    ...validateArtisanProfile,
    handleValidationErrors
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        const userId = req.profileUser.userId;
        const artisanData = req.body;
        // This would be implemented in the profile service
        // For now, return a placeholder response
        res.status(200).json({
            message: 'Artisan profile updated successfully',
            profileId,
            artisanData
        });
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
// Get profile invitations
router.get('/:profileId/invitations', [
    profile_middleware_1.profileAuthMiddleware,
    (0, profile_middleware_1.requireProfileAccess)(),
    (0, profile_middleware_1.requireProfilePermission)('view_invitations'),
    profile_middleware_1.requireActiveProfile,
    profile_middleware_1.logProfileAccess
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        // This would be implemented in the profile service
        // For now, return a placeholder response
        res.status(200).json({
            message: 'Invitations retrieved successfully',
            profileId,
            invitations: []
        });
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
// Get profile members
router.get('/:profileId/members', [
    profile_middleware_1.profileAuthMiddleware,
    (0, profile_middleware_1.requireProfileAccess)(),
    (0, profile_middleware_1.requireProfilePermission)('view_members'),
    profile_middleware_1.requireActiveProfile,
    profile_middleware_1.logProfileAccess
], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const profileId = req.params.profileId;
        // This would be implemented in the profile service
        // For now, return a placeholder response
        res.status(200).json({
            message: 'Members retrieved successfully',
            profileId,
            members: []
        });
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
