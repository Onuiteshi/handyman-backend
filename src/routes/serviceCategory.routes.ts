import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authMiddleware, isAdmin } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addCategoryToArtisan,
  removeCategoryFromArtisan,
  getArtisansByCategory
} from '../controllers/serviceCategory.controller';

const router = Router();

// Validation middleware
const validateCategory = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
];

const validateArtisanCategory = [
  body('artisanId').isUUID().withMessage('Invalid artisan ID'),
  body('categoryId').isUUID().withMessage('Invalid category ID'),
];

// Validation error handler
const handleValidationErrors = (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.get('/:categoryId/artisans', getArtisansByCategory);

// Protected routes (Admin only)
router.post('/', [
  authMiddleware,
  isAdmin,
  ...validateCategory,
  handleValidationErrors
], createCategory);

router.put('/:id', [
  authMiddleware,
  isAdmin,
  ...validateCategory,
  handleValidationErrors
], updateCategory);

router.delete('/:id', [
  authMiddleware,
  isAdmin
], deleteCategory);

// Artisan category management
router.post('/artisan/add', [
  authMiddleware,
  ...validateArtisanCategory,
  handleValidationErrors
], addCategoryToArtisan);

router.delete('/artisan/remove', [
  authMiddleware,
  ...validateArtisanCategory,
  handleValidationErrors
], removeCategoryFromArtisan);

export default router;