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
exports.validateProfileData = exports.rateLimitProfileSwitch = exports.requireActiveProfile = exports.logProfileAccess = exports.validateAndRefreshProfileSession = exports.requireProfileOwner = exports.requireProfilePermission = exports.requireProfileAccess = exports.profileAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
/**
 * Middleware to authenticate profile sessions
 */
const profileAuthMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({
                error: {
                    message: 'Profile authentication required',
                    code: 'PROFILE_AUTH_REQUIRED'
                }
            });
            return;
        }
        // Verify the profile token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Check if session exists and is active
        const session = yield prisma.profileSession.findFirst({
            where: {
                token: token,
                status: prisma_1.ProfileSessionStatus.ACTIVE,
                expiresAt: { gt: new Date() }
            },
            include: {
                profile: true,
                user: true
            }
        });
        if (!session) {
            res.status(401).json({
                error: {
                    message: 'Invalid or expired profile session',
                    code: 'INVALID_PROFILE_SESSION'
                }
            });
            return;
        }
        // Update last activity
        yield prisma.profileSession.update({
            where: { id: session.id },
            data: { lastActivityAt: new Date() }
        });
        req.profileUser = decoded;
        req.currentProfile = session.profile;
        next();
    }
    catch (error) {
        res.status(401).json({
            error: {
                message: 'Invalid profile token',
                code: 'INVALID_PROFILE_TOKEN'
            }
        });
    }
});
exports.profileAuthMiddleware = profileAuthMiddleware;
/**
 * Middleware to check if user has access to a specific profile
 */
const requireProfileAccess = (profileId) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const targetProfileId = profileId || req.params.profileId || req.body.profileId;
            if (!targetProfileId) {
                res.status(400).json({
                    error: {
                        message: 'Profile ID is required',
                        code: 'PROFILE_ID_REQUIRED'
                    }
                });
                return;
            }
            if (((_a = req.profileUser) === null || _a === void 0 ? void 0 : _a.profileId) !== targetProfileId) {
                res.status(403).json({
                    error: {
                        message: 'Access denied to this profile',
                        code: 'PROFILE_ACCESS_DENIED'
                    }
                });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({
                error: {
                    message: 'Profile access check failed',
                    code: 'PROFILE_ACCESS_CHECK_FAILED'
                }
            });
        }
    });
};
exports.requireProfileAccess = requireProfileAccess;
/**
 * Middleware to check profile permissions
 */
const requireProfilePermission = (permission) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.profileUser) {
                res.status(401).json({
                    error: {
                        message: 'Profile authentication required',
                        code: 'PROFILE_AUTH_REQUIRED'
                    }
                });
                return;
            }
            // Check if user has the required permission
            const member = yield prisma.profileMember.findFirst({
                where: {
                    profileId: req.profileUser.profileId,
                    userId: req.profileUser.userId,
                    isActive: true
                }
            });
            if (!member) {
                res.status(403).json({
                    error: {
                        message: 'No access to this profile',
                        code: 'NO_PROFILE_ACCESS'
                    }
                });
                return;
            }
            const permissions = member.permissions || {};
            if (!permissions[permission] && !permissions.owner) {
                res.status(403).json({
                    error: {
                        message: `Permission '${permission}' required`,
                        code: 'INSUFFICIENT_PERMISSIONS'
                    }
                });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({
                error: {
                    message: 'Permission check failed',
                    code: 'PERMISSION_CHECK_FAILED'
                }
            });
        }
    });
};
exports.requireProfilePermission = requireProfilePermission;
/**
 * Middleware to check if user is profile owner
 */
const requireProfileOwner = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.profileUser) {
            res.status(401).json({
                error: {
                    message: 'Profile authentication required',
                    code: 'PROFILE_AUTH_REQUIRED'
                }
            });
            return;
        }
        const profile = yield prisma.profile.findFirst({
            where: {
                id: req.profileUser.profileId,
                ownerId: req.profileUser.userId
            }
        });
        if (!profile) {
            res.status(403).json({
                error: {
                    message: 'Only profile owner can perform this action',
                    code: 'OWNER_ONLY_ACTION'
                }
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            error: {
                message: 'Profile owner check failed',
                code: 'OWNER_CHECK_FAILED'
            }
        });
    }
});
exports.requireProfileOwner = requireProfileOwner;
/**
 * Middleware to validate profile session and refresh if needed
 */
const validateAndRefreshProfileSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            next();
            return;
        }
        const session = yield prisma.profileSession.findFirst({
            where: {
                token: token,
                status: prisma_1.ProfileSessionStatus.ACTIVE
            }
        });
        if (session && session.expiresAt < new Date()) {
            // Session expired, but don't block the request
            // The client should handle token refresh
            res.setHeader('X-Session-Expired', 'true');
        }
        next();
    }
    catch (error) {
        // Don't block the request for session validation errors
        next();
    }
});
exports.validateAndRefreshProfileSession = validateAndRefreshProfileSession;
/**
 * Middleware to log profile access
 */
const logProfileAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.profileUser) {
            // Log profile access (in production, use a proper logging service)
            console.log(`Profile access: User ${req.profileUser.userId} accessed profile ${req.profileUser.profileId} at ${new Date().toISOString()}`);
        }
        next();
    }
    catch (error) {
        // Don't block the request for logging errors
        next();
    }
});
exports.logProfileAccess = logProfileAccess;
/**
 * Middleware to check profile status
 */
const requireActiveProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.currentProfile) {
            res.status(400).json({
                error: {
                    message: 'No profile context',
                    code: 'NO_PROFILE_CONTEXT'
                }
            });
            return;
        }
        if (req.currentProfile.status !== 'ACTIVE') {
            res.status(403).json({
                error: {
                    message: 'Profile is not active',
                    code: 'PROFILE_NOT_ACTIVE'
                }
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            error: {
                message: 'Profile status check failed',
                code: 'PROFILE_STATUS_CHECK_FAILED'
            }
        });
    }
});
exports.requireActiveProfile = requireActiveProfile;
/**
 * Middleware to rate limit profile switches
 */
const rateLimitProfileSwitch = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.userId || req.query.userId;
        if (!userId) {
            next();
            return;
        }
        // Check recent profile switches (last 5 minutes)
        const recentSwitches = yield prisma.profileSession.count({
            where: {
                userId: userId,
                createdAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
                }
            }
        });
        if (recentSwitches > 10) { // Max 10 switches per 5 minutes
            res.status(429).json({
                error: {
                    message: 'Too many profile switches. Please wait before trying again.',
                    code: 'RATE_LIMIT_EXCEEDED'
                }
            });
            return;
        }
        next();
    }
    catch (error) {
        // Don't block the request for rate limiting errors
        next();
    }
});
exports.rateLimitProfileSwitch = rateLimitProfileSwitch;
/**
 * Middleware to validate profile data
 */
const validateProfileData = (req, res, next) => {
    try {
        const { name, type } = req.body;
        if (name && (typeof name !== 'string' || name.length < 2 || name.length > 50)) {
            res.status(400).json({
                error: {
                    message: 'Profile name must be between 2 and 50 characters',
                    code: 'INVALID_PROFILE_NAME'
                }
            });
            return;
        }
        if (type && !['PERSONAL', 'BUSINESS', 'FREELANCE', 'CORPORATE'].includes(type)) {
            res.status(400).json({
                error: {
                    message: 'Invalid profile type',
                    code: 'INVALID_PROFILE_TYPE'
                }
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            error: {
                message: 'Profile data validation failed',
                code: 'PROFILE_VALIDATION_FAILED'
            }
        });
    }
};
exports.validateProfileData = validateProfileData;
