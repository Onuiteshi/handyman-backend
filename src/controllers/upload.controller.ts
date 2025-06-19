import { Response, NextFunction } from 'express';
import { prisma } from '..';
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

export const uploadArtisanPhoto = async (
  req: UploadRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const filePath = `/uploads/${req.file.filename}`;

    // Update artisan with photo URL
    const updatedArtisan = await prisma.artisan.update({
      where: { id: req.user.id },
      data: { photoUrl: filePath },
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
      message: 'Photo uploaded successfully',
      photoUrl: filePath,
      artisan: {
        id: updatedArtisan.id,
        name: updatedArtisan.name,
        email: updatedArtisan.email,
        photoUrl: updatedArtisan.photoUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadIdDocument = async (
  req: UploadRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const filePath = `/uploads/${req.file.filename}`;

    // Update artisan with ID document URL
    const updatedArtisan = await prisma.artisan.update({
      where: { id: req.user.id },
      data: { idDocumentUrl: filePath },
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
      message: 'ID document uploaded successfully',
      idDocumentUrl: filePath,
      artisan: {
        id: updatedArtisan.id,
        name: updatedArtisan.name,
        email: updatedArtisan.email,
        idDocumentUrl: updatedArtisan.idDocumentUrl
      }
    });
  } catch (error) {
    next(error);
  }
};
