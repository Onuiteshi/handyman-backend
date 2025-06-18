import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authMiddleware, isArtisan } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { ArtisanServiceCategory, ServiceCategory } from '@prisma/client';

const router = Router();

// Validation middleware
const validateProfileUpdate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
  body('bio').optional().notEmpty().withMessage('Bio cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('city').optional().notEmpty().withMessage('City cannot be empty'),
  body('state').optional().notEmpty().withMessage('State cannot be empty'),
  body('country').optional().notEmpty().withMessage('Country cannot be empty'),
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
router.get('/profile', authMiddleware, isArtisan, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const artisanId = req.user?.id;

    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      include: {
        profile: true,
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    if (!artisan) {
      res.status(404).json({ message: 'Artisan not found' });
      return;
    }

    res.json({
      artisan: {
        id: artisan.id,
        email: artisan.email,
        phone: artisan.phone,
        name: artisan.name,
        experience: artisan.experience,
        bio: artisan.bio,
        photoUrl: artisan.photoUrl,
        idDocumentUrl: artisan.idDocumentUrl,
        profile: artisan.profile,
        categories: artisan.categories.map((ac: ArtisanServiceCategory & { category: ServiceCategory }) => ac.category)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update artisan profile
router.put('/profile', [authMiddleware, isArtisan, ...validateProfileUpdate, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const artisanId = req.user?.id;
    const { name, phone, experience, bio, address, city, state, country } = req.body;

    // Check if phone is being updated and if it's already taken
    if (phone) {
      const existingArtisan = await prisma.artisan.findFirst({
        where: {
          phone,
          NOT: {
            id: artisanId
          }
        }
      });

      if (existingArtisan) {
        res.status(400).json({ message: 'Phone number is already in use' });
        return;
      }
    }

    // Update artisan and profile
    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisanId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        experience: experience || undefined,
        bio: bio || undefined,
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
        profile: true,
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    res.json({
      message: 'Profile updated successfully',
      artisan: {
        id: updatedArtisan.id,
        email: updatedArtisan.email,
        phone: updatedArtisan.phone,
        name: updatedArtisan.name,
        experience: updatedArtisan.experience,
        bio: updatedArtisan.bio,
        photoUrl: updatedArtisan.photoUrl,
        idDocumentUrl: updatedArtisan.idDocumentUrl,
        profile: updatedArtisan.profile,
        categories: updatedArtisan.categories.map((ac: ArtisanServiceCategory & { category: ServiceCategory }) => ac.category)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update artisan service categories
router.put('/categories', [authMiddleware, isArtisan, ...validateServiceCategories, handleValidationErrors], async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const artisanId = req.user?.id;
    const { categoryIds } = req.body;

    // Delete existing categories
    await prisma.artisanServiceCategory.deleteMany({
      where: { artisanId }
    });

    // Add new categories
    await prisma.artisanServiceCategory.createMany({
      data: categoryIds.map((categoryId: string) => ({
        artisanId,
        categoryId
      }))
    });

    // Get updated artisan with categories
    const updatedArtisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    res.json({
      message: 'Service categories updated successfully',
      categories: updatedArtisan?.categories.map((ac: ArtisanServiceCategory & { category: ServiceCategory }) => ac.category) || []
    });
  } catch (error) {
    next(error);
  }
});

export default router; 