import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Register a new artisan with skills and documents
 * POST /api/artisan/register
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 9.5, 9.6
 */
export const registerArtisan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    // Validate user authentication
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { skills, profilePhotoUrl, documentUrls } = req.body;

    // Validate required fields (Requirements 5.2, 5.3)
    const validationErrors: string[] = [];
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      validationErrors.push('Skills array is required and must not be empty');
    }
    
    if (!profilePhotoUrl || typeof profilePhotoUrl !== 'string') {
      validationErrors.push('Profile photo URL is required');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }

    // Use Prisma transaction for User and Artisan creation (Requirements 5.8, 9.5, 9.6)
    const result = await prisma.$transaction(async (tx) => {
      // Update user role to ARTISAN
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role: 'ARTISAN' }
      });

      // Create Artisan record with PENDING_VERIFICATION status (Requirements 5.4, 5.5, 5.6)
      const artisan = await tx.artisan.create({
        data: {
          userId,
          skills,
          experience: 0, // Default value
          portfolio: [],
          status: 'PENDING_VERIFICATION',
          photoUrl: profilePhotoUrl,
          idDocumentUrl: documentUrls && documentUrls.length > 0 ? documentUrls[0] : null,
          isProfileComplete: false
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              role: true
            }
          }
        }
      });

      return { artisan, user: updatedUser };
    });

    // Return HTTP 201 with created profile data (Requirement 5.7)
    return res.status(201).json({
      message: 'Artisan registration successful',
      artisan: {
        id: result.artisan.id,
        userId: result.artisan.userId,
        skills: result.artisan.skills,
        photoUrl: result.artisan.photoUrl,
        idDocumentUrl: result.artisan.idDocumentUrl,
        isProfileComplete: result.artisan.isProfileComplete,
        user: result.artisan.user
      }
    });
  } catch (error) {
    // Handle database errors (Requirement 5.8)
    console.error('Artisan registration error:', error);
    return res.status(500).json({ 
      message: 'Database error occurred during registration'
    });
  }
};
