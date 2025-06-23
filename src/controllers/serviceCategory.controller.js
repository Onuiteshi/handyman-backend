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
exports.removeCategoryFromArtisan = exports.addCategoryToArtisan = exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getArtisansByCategory = exports.getAllCategories = exports.createCategory = void 0;
const index_1 = require("../index");
// Create a new service category
const createCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        const category = yield index_1.prisma.serviceCategory.create({
            data: {
                name,
                description
            }
        });
        res.status(201).json({
            message: 'Service category created successfully',
            category
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createCategory = createCategory;
// Get all service categories
const getAllCategories = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield index_1.prisma.serviceCategory.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({
            message: 'Service categories retrieved successfully',
            categories
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllCategories = getAllCategories;
// Get artisans by category
const getArtisansByCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId } = req.params;
        const artisans = yield index_1.prisma.artisanServiceCategory.findMany({
            where: {
                categoryId
            },
            include: {
                artisan: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });
        const formattedArtisans = artisans.map(ac => ({
            id: ac.artisan.id,
            userId: ac.artisan.userId,
            skills: ac.artisan.skills,
            experience: ac.artisan.experience,
            portfolio: ac.artisan.portfolio,
            isProfileComplete: ac.artisan.isProfileComplete,
            bio: ac.artisan.bio,
            photoUrl: ac.artisan.photoUrl,
            isOnline: ac.artisan.isOnline,
            locationTracking: ac.artisan.locationTracking,
            latitude: ac.artisan.latitude,
            longitude: ac.artisan.longitude,
            lastSeen: ac.artisan.lastSeen,
            user: ac.artisan.user
        }));
        res.json({
            message: 'Artisans retrieved successfully',
            artisans: formattedArtisans
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getArtisansByCategory = getArtisansByCategory;
// Get category by ID
const getCategoryById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const category = yield index_1.prisma.serviceCategory.findUnique({
            where: { id },
            include: {
                artisans: {
                    include: {
                        artisan: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        phone: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!category) {
            res.status(404).json({ message: 'Service category not found' });
            return;
        }
        const formattedArtisans = category.artisans.map(ac => ({
            id: ac.artisan.id,
            userId: ac.artisan.userId,
            skills: ac.artisan.skills,
            experience: ac.artisan.experience,
            portfolio: ac.artisan.portfolio,
            isProfileComplete: ac.artisan.isProfileComplete,
            bio: ac.artisan.bio,
            photoUrl: ac.artisan.photoUrl,
            isOnline: ac.artisan.isOnline,
            locationTracking: ac.artisan.locationTracking,
            latitude: ac.artisan.latitude,
            longitude: ac.artisan.longitude,
            lastSeen: ac.artisan.lastSeen,
            user: ac.artisan.user
        }));
        res.json({
            message: 'Service category retrieved successfully',
            category: Object.assign(Object.assign({}, category), { artisans: formattedArtisans })
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getCategoryById = getCategoryById;
// Update category
const updateCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const category = yield index_1.prisma.serviceCategory.update({
            where: { id },
            data: {
                name,
                description
            }
        });
        res.json({
            message: 'Service category updated successfully',
            category
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateCategory = updateCategory;
// Delete category
const deleteCategory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield index_1.prisma.serviceCategory.delete({
            where: { id }
        });
        res.json({
            message: 'Service category deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteCategory = deleteCategory;
// Add category to artisan
const addCategoryToArtisan = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artisanId, categoryId } = req.body;
        const artisanCategory = yield index_1.prisma.artisanServiceCategory.create({
            data: {
                artisanId,
                categoryId
            },
            include: {
                artisan: true,
                category: true
            }
        });
        res.status(201).json({
            message: 'Category added to artisan successfully',
            artisanCategory
        });
    }
    catch (error) {
        next(error);
    }
});
exports.addCategoryToArtisan = addCategoryToArtisan;
// Remove category from artisan
const removeCategoryFromArtisan = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artisanId, categoryId } = req.body;
        yield index_1.prisma.artisanServiceCategory.delete({
            where: {
                artisanId_categoryId: {
                    artisanId,
                    categoryId
                }
            }
        });
        res.json({
            message: 'Category removed from artisan successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.removeCategoryFromArtisan = removeCategoryFromArtisan;
