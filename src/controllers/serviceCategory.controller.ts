import { Response, NextFunction } from 'express';
import { prisma } from '..';
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

// Create a new service category (Admin only)
export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body as CategoryData;

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        description,
      },
    });

    const response: ApiResponse<typeof category> = {
      success: true,
      data: category,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating category:', error);
    next(error);
  }
};

// Get all service categories
export const getAllCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { name: 'asc' },
    });

    const response: ApiResponse<{ count: number; data: typeof categories }> = {
      success: true,
      data: {
        count: categories.length,
        data: categories,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    next(error);
  }
};

// Get a single category by ID
export const getCategoryById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        artisans: {
          include: {
            artisan: {
              select: {
                id: true,
                name: true,
                photoUrl: true,
                experience: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      const response: ApiResponse = {
        success: false,
        message: 'Category not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof category> = {
      success: true,
      data: category,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    next(error);
  }
};

// Update a category (Admin only)
export const updateCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body as Partial<CategoryData>;

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
    });

    const response: ApiResponse<typeof category> = {
      success: true,
      data: category,
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        message: 'Category not found',
      };
      return res.status(404).json(response);
    }
    next(error);
  }
};

// Delete a category (Admin only)
export const deleteCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // First, delete all relations in ArtisanServiceCategory
    await prisma.artisanServiceCategory.deleteMany({
      where: { categoryId: id },
    });

    await prisma.serviceCategory.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        message: 'Category not found',
      };
      return res.status(404).json(response);
    }
    next(error);
  }
};

// Add category to artisan's services
export const addCategoryToArtisan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;
    const artisanId = req.user?.id;

    if (!artisanId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check if the artisan exists
    const artisan = await prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      return res.status(404).json({
        success: false,
        error: 'Artisan not found',
      });
    }

    if (!category) {
      const response: ApiResponse = {
        success: false,
        message: 'Category not found',
      };
      return res.status(404).json(response);
    }

    // Check if the relation already exists
    const existingRelation = await prisma.artisanServiceCategory.findUnique({
      where: {
        artisanId_categoryId: {
          artisanId,
          categoryId,
        },
      },
    });

    if (existingRelation) {
      const response: ApiResponse = {
        success: false,
        message: 'Category already added to artisan',
      };
      return res.status(400).json(response);
    }

    // Create the relation
    const artisanCategory = await prisma.artisanServiceCategory.create({
      data: {
        artisanId,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    const response: ApiResponse<{ category: typeof artisanCategory.category }> = {
      success: true,
      message: 'Category added to artisan successfully',
      data: {
        category: artisanCategory.category,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding category to artisan:', error);
    
    if (error.code === 'P2002') {
      const response: ApiResponse = {
        success: false,
        message: 'Category already exists for this artisan',
      };
      return res.status(400).json(response);
    }
    
    if (error.code === 'P2003') {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid category or artisan ID',
      };
      return res.status(400).json(response);
    }
    
    next(error);
  }
};

// Remove category from artisan's services
export const removeCategoryFromArtisan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;
    const artisanId = req.user?.id;

    if (!artisanId) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
      };
      return res.status(401).json(response);
    }

    // Check if the relation exists
    const relation = await prisma.artisanServiceCategory.findUnique({
      where: {
        artisanId_categoryId: {
          artisanId,
          categoryId,
        },
      },
    });

    if (!relation) {
      const response: ApiResponse = {
        success: false,
        message: 'Category not found in artisan services',
      };
      return res.status(404).json(response);
    }

    // Delete the relation
    await prisma.artisanServiceCategory.delete({
      where: {
        artisanId_categoryId: {
          artisanId,
          categoryId,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Category removed from artisan successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error removing category from artisan:', error);
    
    if (error.code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        message: 'Category not found in artisan services',
      };
      return res.status(404).json(response);
    }
    
    next(error);
  }
};
