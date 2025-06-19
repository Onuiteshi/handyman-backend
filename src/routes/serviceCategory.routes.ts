import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware, isArtisan, isAdmin } from '../middleware/auth.middleware';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addCategoryToArtisan,
  removeCategoryFromArtisan,
} from '../controllers/serviceCategory.controller';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Validation middleware
// Validation rules
const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const validateCategoryId = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID')
];

const validateCategoryIdParam = [
  param('categoryId')
    .isUUID()
    .withMessage('Invalid category ID')
];

// Public routes
router.get('/', getAllCategories);

router.get(
  '/:id',
  validate(validateCategoryId),
  getCategoryById
);

// Admin protected routes
router.post(
  '/',
  authMiddleware,
  isAdmin,
  ...validate(validateCategory),
  createCategory
);

router.put(
  '/:id',
  authMiddleware,
  isAdmin,
  ...validate([...validateCategoryId, ...validateCategory]),
  updateCategory
);

router.delete(
  '/:id',
  authMiddleware,
  isAdmin,
  ...validate(validateCategoryId),
  deleteCategory
);

// Artisan category management
router.post(
  '/:categoryId/artisan',
  authMiddleware,
  isArtisan,
  ...validate(validateCategoryIdParam),
  addCategoryToArtisan
);

router.delete(
  '/:categoryId/artisan',
  authMiddleware,
  isArtisan,
  ...validate(validateCategoryIdParam),
  removeCategoryFromArtisan
);

export default router;