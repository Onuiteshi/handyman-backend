import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth.middleware';
import { MulterRequest } from '../utils/fileUpload';

// Extend MulterRequest with AuthRequest properties
type UploadRequest = MulterRequest & AuthRequest;

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const uploadArtisanPhoto = async (req: UploadRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find the artisan record for this user
    const artisan = await prisma.artisan.findUnique({
      where: { userId }
    });

    if (!artisan) {
      return res.status(404).json({ message: 'Artisan profile not found' });
    }

    // Update artisan with photo URL
    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisan.id },
      data: {
        photoUrl: `/uploads/${req.file.filename}`
      },
      include: {
        user: true
      }
    });

    res.json({
      message: 'Photo uploaded successfully',
      photoUrl: updatedArtisan.photoUrl,
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
          id: updatedArtisan.user.id,
          name: updatedArtisan.user.name,
          email: updatedArtisan.user.email,
          phone: updatedArtisan.user.phone
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadIdDocument = async (req: UploadRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find the artisan record for this user
    const artisan = await prisma.artisan.findUnique({
      where: { userId }
    });

    if (!artisan) {
      return res.status(404).json({ message: 'Artisan profile not found' });
    }

    // Update artisan with ID document URL
    const updatedArtisan = await prisma.artisan.update({
      where: { id: artisan.id },
      data: {
        idDocumentUrl: `/uploads/${req.file.filename}`
      },
      include: {
        user: true
      }
    });

    res.json({
      message: 'ID document uploaded successfully',
      idDocumentUrl: updatedArtisan.idDocumentUrl,
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
          id: updatedArtisan.user.id,
          name: updatedArtisan.user.name,
          email: updatedArtisan.user.email,
          phone: updatedArtisan.user.phone
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
