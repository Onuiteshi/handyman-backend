import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

// Type for category data
interface CategoryData {
  name: string;
  description?: string;
}

// Standard response type for all API responses
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Extend Response type to include our standard response
interface TypedResponse<T = any> extends Response {
  json: (body: ApiResponse<T>) => this;
}

// Create a new service category
export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;

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
};

// Get all service categories
export const getAllCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      message: 'Service categories retrieved successfully',
      categories
    });
  } catch (error) {
    next(error);
  }
};

// Get artisans by category
export const getArtisansByCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;

    const artisans = await prisma.artisanServiceCategory.findMany({
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
  } catch (error) {
    next(error);
  }
};

// Get category by ID
export const getCategoryById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await prisma.serviceCategory.findUnique({
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
      category: {
        ...category,
        artisans: formattedArtisans
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update category
export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await prisma.serviceCategory.update({
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
  } catch (error) {
    next(error);
  }
};

// Delete category
export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.serviceCategory.delete({
      where: { id }
    });

    res.json({
      message: 'Service category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add category to artisan
export const addCategoryToArtisan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { artisanId, categoryId } = req.body;

    const artisanCategory = await prisma.artisanServiceCategory.create({
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
  } catch (error) {
    next(error);
  }
};

// Remove category from artisan
export const removeCategoryFromArtisan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { artisanId, categoryId } = req.body;

    await prisma.artisanServiceCategory.delete({
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
  } catch (error) {
    next(error);
  }
};
