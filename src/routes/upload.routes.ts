import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, isArtisan } from '../middleware/auth.middleware';
import { 
  uploadArtisanPhoto, 
  uploadIdDocument,
  uploadArtisanRegistrationPhoto,
  uploadArtisanRegistrationDocument
} from '../controllers/upload.controller';
import upload from '../utils/fileUpload';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Upload artisan photo
router.post(
  '/artisan/photo',
  (req: Request, res: Response, next: NextFunction) => {
    authMiddleware(req as AuthRequest, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    isArtisan(req as AuthRequest, res, next);
  },
  upload.single('photo'),
  (req: Request, res: Response, next: NextFunction) => {
    uploadArtisanPhoto(req as any, res, next);
  }
);

// Upload ID document
router.post(
  '/artisan/id-document',
  (req: Request, res: Response, next: NextFunction) => {
    authMiddleware(req as AuthRequest, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    isArtisan(req as AuthRequest, res, next);
  },
  upload.single('document'),
  (req: Request, res: Response, next: NextFunction) => {
    uploadIdDocument(req as any, res, next);
  }
);

// Registration-specific endpoints (no auth required, before artisan profile exists)

// Upload artisan registration photo
router.post(
  '/artisan-registration-photo',
  upload.single('photo'),
  (req: Request, res: Response, next: NextFunction) => {
    uploadArtisanRegistrationPhoto(req as any, res, next);
  }
);

// Upload artisan registration document
router.post(
  '/artisan-registration-document',
  upload.single('document'),
  (req: Request, res: Response, next: NextFunction) => {
    uploadArtisanRegistrationDocument(req as any, res, next);
  }
);

export default router;
