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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const index_1 = require("../index");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation middleware
const validateProfileUpdate = [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601().withMessage('Date of birth must be a valid date'),
];
// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};
// Get user profile
router.get('/profile', auth_middleware_1.authMiddleware, auth_middleware_1.isCustomer, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const user = yield index_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                customer: true
            }
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({
            message: 'Profile retrieved successfully',
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                dateOfBirth: user.dateOfBirth,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                profileComplete: user.profileComplete,
                customer: user.customer
            }
        });
    }
    catch (error) {
        next(error);
    }
}));
// Update user profile
router.put('/profile', [auth_middleware_1.authMiddleware, auth_middleware_1.isCustomer, ...validateProfileUpdate, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { name, phone, dateOfBirth } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (phone)
            updateData.phone = phone;
        if (dateOfBirth)
            updateData.dateOfBirth = new Date(dateOfBirth);
        const updatedUser = yield index_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                customer: true
            }
        });
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                phone: updatedUser.phone,
                name: updatedUser.name,
                dateOfBirth: updatedUser.dateOfBirth,
                role: updatedUser.role,
                isEmailVerified: updatedUser.isEmailVerified,
                isPhoneVerified: updatedUser.isPhoneVerified,
                profileComplete: updatedUser.profileComplete,
                customer: updatedUser.customer
            }
        });
    }
    catch (error) {
        next(error);
    }
}));
// Update customer preferences
router.put('/preferences', auth_middleware_1.authMiddleware, auth_middleware_1.isCustomer, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { preferences } = req.body;
        const updatedCustomer = yield index_1.prisma.customer.update({
            where: { userId },
            data: { preferences },
            include: {
                user: true
            }
        });
        res.json({
            message: 'Preferences updated successfully',
            customer: updatedCustomer
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
