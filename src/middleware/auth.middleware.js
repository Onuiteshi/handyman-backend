"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireProfileComplete = exports.requireVerifiedPhone = exports.requireVerifiedEmail = exports.isAdmin = exports.isCustomer = exports.isArtisan = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../generated/prisma");
const authMiddleware = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
const isArtisan = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== prisma_1.UserRole.ARTISAN) {
        res.status(403).json({ message: 'Access denied. Artisan only.' });
        return;
    }
    next();
};
exports.isArtisan = isArtisan;
const isCustomer = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== prisma_1.UserRole.CUSTOMER) {
        res.status(403).json({ message: 'Access denied. Customer only.' });
        return;
    }
    next();
};
exports.isCustomer = isCustomer;
const isAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== prisma_1.UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin only.' });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
const requireVerifiedEmail = (req, res, next) => {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.isEmailVerified)) {
        res.status(403).json({ message: 'Email verification required.' });
        return;
    }
    next();
};
exports.requireVerifiedEmail = requireVerifiedEmail;
const requireVerifiedPhone = (req, res, next) => {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.isPhoneVerified)) {
        res.status(403).json({ message: 'Phone verification required.' });
        return;
    }
    next();
};
exports.requireVerifiedPhone = requireVerifiedPhone;
const requireProfileComplete = (req, res, next) => {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.profileComplete)) {
        res.status(403).json({ message: 'Profile completion required.' });
        return;
    }
    next();
};
exports.requireProfileComplete = requireProfileComplete;
