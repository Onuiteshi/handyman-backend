import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authMiddleware, isCustomer } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validateProfileUpdate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please enter a valid email address'),
  body('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Date of birth must be a valid date'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('latitude').optional().isFloat().withMessage('Latitude must be a number'),
  body('longitude').optional().isFloat().withMessage('Longitude must be a number'),
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
router.get('/profile', authMiddleware, isCustomer, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', [authMiddleware, isCustomer, ...validateProfileUpdate, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { name, email, phone, dateOfBirth, address, latitude, longitude } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (address) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    // Set profileComplete to true if name and address are provided
    if (name && address) {
      updateData.profileComplete = true;
    }

    const updatedUser = await prisma.user.update({
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
        address: updatedUser.address,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
        customer: updatedUser.customer
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update customer preferences
router.put('/preferences', authMiddleware, isCustomer, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { preferences } = req.body;

    const updatedCustomer = await prisma.customer.update({
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
  } catch (error) {
    next(error);
  }
});

export default router; 