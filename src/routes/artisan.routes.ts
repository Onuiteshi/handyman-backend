import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authMiddleware, isArtisan } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validateProfileUpdate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('bio').optional().notEmpty().withMessage('Bio cannot be empty'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('portfolio').optional().isArray().withMessage('Portfolio must be an array'),
];

const validateServiceCategories = [
  body('categoryIds').isArray().withMessage('Category IDs must be an array'),
  body('categoryIds.*').isUUID().withMessage('Invalid category ID format'),
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

// Get artisan profile
router.get('/profile', authMiddleware, isArtisan, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const artisan = await prisma.artisan.findUnique({
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
        categories: artisan.categories.map((ac: any) => ac.category)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update artisan profile
router.put('/profile', [authMiddleware, isArtisan, ...validateProfileUpdate, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { name, phone, experience, bio, skills, portfolio } = req.body;

    // Update user data
    const userUpdateData: any = {};
    if (name) userUpdateData.name = name;
    if (phone) userUpdateData.phone = phone;

    // Update artisan data
    const artisanUpdateData: any = {};
    if (experience !== undefined) artisanUpdateData.experience = experience;
    if (bio !== undefined) artisanUpdateData.bio = bio;
    if (skills) artisanUpdateData.skills = skills;
    if (portfolio) artisanUpdateData.portfolio = portfolio;

    // Update both user and artisan
    const [updatedUser, updatedArtisan] = await Promise.all([
      prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      }),
      prisma.artisan.update({
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
        categories: updatedArtisan.categories.map((ac: any) => ac.category)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Add service categories to artisan
router.post('/categories', [authMiddleware, isArtisan, ...validateServiceCategories, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { categoryIds } = req.body;

    const artisan = await prisma.artisan.findUnique({
      where: { userId }
    });

    if (!artisan) {
      res.status(404).json({ message: 'Artisan profile not found' });
      return;
    }

    // Add categories
    const categoryConnections = categoryIds.map((categoryId: string) => ({
      artisanId: artisan.id,
      categoryId
    }));

    await prisma.artisanServiceCategory.createMany({
      data: categoryConnections,
      skipDuplicates: true
    });

    // Get updated artisan with categories
    const updatedArtisan = await prisma.artisan.findUnique({
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
        id: updatedArtisan!.id,
        categories: updatedArtisan!.categories.map((ac: any) => ac.category)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Remove service categories from artisan
router.delete('/categories', [authMiddleware, isArtisan, ...validateServiceCategories, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { categoryIds } = req.body;

    const artisan = await prisma.artisan.findUnique({
      where: { userId }
    });

    if (!artisan) {
      res.status(404).json({ message: 'Artisan profile not found' });
      return;
    }

    // Remove categories
    await prisma.artisanServiceCategory.deleteMany({
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
  } catch (error) {
    next(error);
  }
});

export default router; 