"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const serviceCategory_controller_1 = require("../controllers/serviceCategory.controller");
const router = (0, express_1.Router)();
// Validation middleware
const validateCategory = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('description').optional().isString().withMessage('Description must be a string'),
];
const validateArtisanCategory = [
    (0, express_validator_1.body)('artisanId').isUUID().withMessage('Invalid artisan ID'),
    (0, express_validator_1.body)('categoryId').isUUID().withMessage('Invalid category ID'),
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
// Public routes
router.get('/', serviceCategory_controller_1.getAllCategories);
router.get('/:id', serviceCategory_controller_1.getCategoryById);
router.get('/:categoryId/artisans', serviceCategory_controller_1.getArtisansByCategory);
// Protected routes (Admin only)
router.post('/', [
    auth_middleware_1.authMiddleware,
    auth_middleware_1.isAdmin,
    ...validateCategory,
    handleValidationErrors
], serviceCategory_controller_1.createCategory);
router.put('/:id', [
    auth_middleware_1.authMiddleware,
    auth_middleware_1.isAdmin,
    ...validateCategory,
    handleValidationErrors
], serviceCategory_controller_1.updateCategory);
router.delete('/:id', [
    auth_middleware_1.authMiddleware,
    auth_middleware_1.isAdmin
], serviceCategory_controller_1.deleteCategory);
// Artisan category management
router.post('/artisan/add', [
    auth_middleware_1.authMiddleware,
    ...validateArtisanCategory,
    handleValidationErrors
], serviceCategory_controller_1.addCategoryToArtisan);
router.delete('/artisan/remove', [
    auth_middleware_1.authMiddleware,
    ...validateArtisanCategory,
    handleValidationErrors
], serviceCategory_controller_1.removeCategoryFromArtisan);
exports.default = router;
