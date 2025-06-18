import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validateCategory = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
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

// Get all service categories
router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// Create service category (admin only)
router.post('/', [authMiddleware, ...validateCategory, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { name }
    });

    if (existingCategory) {
      res.status(400).json({ message: 'Service category already exists' });
      return;
    }

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      message: 'Service category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
});

// Update service category (admin only)
router.put('/:id', [authMiddleware, ...validateCategory, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if category exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      res.status(404).json({ message: 'Service category not found' });
      return;
    }

    // Check if new name is already taken
    if (name !== existingCategory.name) {
      const nameExists = await prisma.serviceCategory.findUnique({
        where: { name }
      });

      if (nameExists) {
        res.status(400).json({ message: 'Service category name already exists' });
        return;
      }
    }

    const updatedCategory = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name,
        description
      }
    });

    res.json({
      message: 'Service category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    next(error);
  }
});

// Delete service category (admin only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      res.status(404).json({ message: 'Service category not found' });
      return;
    }

    // Delete category
    await prisma.serviceCategory.delete({
      where: { id }
    });

    res.json({
      message: 'Service category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 