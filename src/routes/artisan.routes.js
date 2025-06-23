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
    (0, express_validator_1.body)('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    (0, express_validator_1.body)('bio').optional().notEmpty().withMessage('Bio cannot be empty'),
    (0, express_validator_1.body)('skills').optional().isArray().withMessage('Skills must be an array'),
    (0, express_validator_1.body)('portfolio').optional().isArray().withMessage('Portfolio must be an array'),
];
const validateServiceCategories = [
    (0, express_validator_1.body)('categoryIds').isArray().withMessage('Category IDs must be an array'),
    (0, express_validator_1.body)('categoryIds.*').isUUID().withMessage('Invalid category ID format'),
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
// Get artisan profile
router.get('/profile', auth_middleware_1.authMiddleware, auth_middleware_1.isArtisan, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId },
            include: {
                user: true,
                categories: {
                    include: {
                        category: true
                    }
                }
            }
        });
        if (!artisan) {
            res.status(404).json({ message: 'Artisan profile not found' });
            return;
        }
        res.json({
            message: 'Profile retrieved successfully',
            artisan: {
                id: artisan.id,
                userId: artisan.userId,
                skills: artisan.skills,
                experience: artisan.experience,
                portfolio: artisan.portfolio,
                isProfileComplete: artisan.isProfileComplete,
                bio: artisan.bio,
                photoUrl: artisan.photoUrl,
                idDocumentUrl: artisan.idDocumentUrl,
                isOnline: artisan.isOnline,
                locationTracking: artisan.locationTracking,
                latitude: artisan.latitude,
                longitude: artisan.longitude,
                lastSeen: artisan.lastSeen,
                user: {
                    id: artisan.user.id,
                    email: artisan.user.email,
                    phone: artisan.user.phone,
                    name: artisan.user.name,
                    dateOfBirth: artisan.user.dateOfBirth,
                    role: artisan.user.role,
                    isEmailVerified: artisan.user.isEmailVerified,
                    isPhoneVerified: artisan.user.isPhoneVerified,
                    profileComplete: artisan.user.profileComplete
                },
                categories: artisan.categories.map(ac => ac.category)
            }
        });
    }
    catch (error) {
        next(error);
    }
}));
// Update artisan profile
router.put('/profile', [auth_middleware_1.authMiddleware, auth_middleware_1.isArtisan, ...validateProfileUpdate, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { name, phone, experience, bio, skills, portfolio } = req.body;
        // Update user data
        const userUpdateData = {};
        if (name)
            userUpdateData.name = name;
        if (phone)
            userUpdateData.phone = phone;
        // Update artisan data
        const artisanUpdateData = {};
        if (experience !== undefined)
            artisanUpdateData.experience = experience;
        if (bio !== undefined)
            artisanUpdateData.bio = bio;
        if (skills)
            artisanUpdateData.skills = skills;
        if (portfolio)
            artisanUpdateData.portfolio = portfolio;
        // Update both user and artisan
        const [updatedUser, updatedArtisan] = yield Promise.all([
            index_1.prisma.user.update({
                where: { id: userId },
                data: userUpdateData
            }),
            index_1.prisma.artisan.update({
                where: { userId },
                data: artisanUpdateData,
                include: {
                    user: true,
                    categories: {
                        include: {
                            category: true
                        }
                    }
                }
            })
        ]);
        res.json({
            message: 'Profile updated successfully',
            artisan: {
                id: updatedArtisan.id,
                userId: updatedArtisan.userId,
                skills: updatedArtisan.skills,
                experience: updatedArtisan.experience,
                portfolio: updatedArtisan.portfolio,
                isProfileComplete: updatedArtisan.isProfileComplete,
                bio: updatedArtisan.bio,
                photoUrl: updatedArtisan.photoUrl,
                idDocumentUrl: updatedArtisan.idDocumentUrl,
                isOnline: updatedArtisan.isOnline,
                locationTracking: updatedArtisan.locationTracking,
                latitude: updatedArtisan.latitude,
                longitude: updatedArtisan.longitude,
                lastSeen: updatedArtisan.lastSeen,
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    name: updatedUser.name,
                    dateOfBirth: updatedUser.dateOfBirth,
                    role: updatedUser.role,
                    isEmailVerified: updatedUser.isEmailVerified,
                    isPhoneVerified: updatedUser.isPhoneVerified,
                    profileComplete: updatedUser.profileComplete
                },
                categories: updatedArtisan.categories.map(ac => ac.category)
            }
        });
    }
    catch (error) {
        next(error);
    }
}));
// Add service categories to artisan
router.post('/categories', [auth_middleware_1.authMiddleware, auth_middleware_1.isArtisan, ...validateServiceCategories, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { categoryIds } = req.body;
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId }
        });
        if (!artisan) {
            res.status(404).json({ message: 'Artisan profile not found' });
            return;
        }
        // Add categories
        const categoryConnections = categoryIds.map((categoryId) => ({
            artisanId: artisan.id,
            categoryId
        }));
        yield index_1.prisma.artisanServiceCategory.createMany({
            data: categoryConnections,
            skipDuplicates: true
        });
        // Get updated artisan with categories
        const updatedArtisan = yield index_1.prisma.artisan.findUnique({
            where: { id: artisan.id },
            include: {
                user: true,
                categories: {
                    include: {
                        category: true
                    }
                }
            }
        });
        res.json({
            message: 'Categories added successfully',
            artisan: {
                id: updatedArtisan.id,
                categories: updatedArtisan.categories.map(ac => ac.category)
            }
        });
    }
    catch (error) {
        next(error);
    }
}));
// Remove service categories from artisan
router.delete('/categories', [auth_middleware_1.authMiddleware, auth_middleware_1.isArtisan, ...validateServiceCategories, handleValidationErrors], (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        const { categoryIds } = req.body;
        const artisan = yield index_1.prisma.artisan.findUnique({
            where: { userId }
        });
        if (!artisan) {
            res.status(404).json({ message: 'Artisan profile not found' });
            return;
        }
        // Remove categories
        yield index_1.prisma.artisanServiceCategory.deleteMany({
            where: {
                artisanId: artisan.id,
                categoryId: {
                    in: categoryIds
                }
            }
        });
        res.json({
            message: 'Categories removed successfully'
        });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
