import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authMiddleware, isUser } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validateProfileUpdate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().notEmpty().withMessage('State cannot be empty'),
  body('country').optional().notEmpty().withMessage('Country cannot be empty'),
];

// Validation error handler
const handleValidationErrors = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Get user profile
router.get('/profile', authMiddleware, isUser, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', [authMiddleware, isUser, ...validateProfileUpdate, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, phone, address, city, state, country } = req.body;

    // Check if phone is being updated and if it's already taken
    if (phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          NOT: {
            id: userId
          }
        }
      });

      if (existingUser) {
        res.status(400).json({ message: 'Phone number is already in use' });
        return;
      }
    }

    // Update user and profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        profile: {
          update: {
            address: address || undefined,
            city: city || undefined,
            state: state || undefined,
            country: country || undefined
          }
        }
      },
      include: {
        profile: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        name: updatedUser.name,
        profile: updatedUser.profile
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 