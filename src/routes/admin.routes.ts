import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, isAdmin } from '../middleware/auth.middleware';
import { 
  getPendingArtisans,
  approveArtisan,
  rejectArtisan
} from '../controllers/artisanApproval.controller';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all pending artisan applications (Requirements: 8.1, 8.7)
router.get(
  '/artisans/pending',
  (req: Request, res: Response, next: NextFunction) => {
    authMiddleware(req as AuthRequest, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    isAdmin(req as AuthRequest, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    getPendingArtisans(req as AuthRequest, res, next);
  }
);

// Approve artisan application (Requirements: 8.2, 8.7)
router.put(
  '/artisans/:id/approve',
  (req: Request, res: Response, next: NextFunction) => {
    authMiddleware(req as AuthRequest, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    isAdmin(req as AuthRequest, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    approveArtisan(req as AuthRequest, res, next);
  }
);

// Reject artisan application (Requirements: 8.3, 8.7)
router.put(
  '/artisans/:id/reject',
  (req: Request, res: Response, next: NextFunction) => {
    authMiddleware(req as AuthRequest, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    isAdmin(req as AuthRequest, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    rejectArtisan(req as AuthRequest, res, next);
  }
);

export default router;
