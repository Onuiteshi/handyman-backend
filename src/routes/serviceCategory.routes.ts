import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware, isAdmin, isArtisan } from '../middleware/auth.middleware';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addCategoryToArtisan,
  removeCategoryFromArtisan,
} from '../controllers/serviceCategory.controller';
import { handleValidationErrors } from '../middleware/validation.middleware';

const router = Router();

// Validation middleware
const validateCategory = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim(),
];

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin protected routes
router.post(
  '/',
  [authMiddleware, isAdmin, ...validateCategory, handleValidationErrors],
  createCategory
);

router.put(
  '/:id',
  [authMiddleware, isAdmin, ...validateCategory, handleValidationErrors],
  updateCategory
);

router.delete('/:id', [authMiddleware, isAdmin], deleteCategory);

// Artisan category management
router.post(
  '/:categoryId/artisan',
  [authMiddleware, isArtisan],
  addCategoryToArtisan
);

router.delete(
  '/:categoryId/artisan',
  [authMiddleware, isArtisan],
  removeCategoryFromArtisan
);

export default router;