import {Router, type RequestHandler, type Request, type Response, NextFunction} from 'express';
import { 
  updateOnlineStatus, 
  updateLocationConsent,
  updateLocation,
  getStatus
} from '../controllers/artisanStatus.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { handleValidationErrors } from '../middleware/validation.middleware';
import { body } from 'express-validator';

// Type for our authenticated request
type AuthenticatedRequest = Request & {
  user: {
    id: string;
    type: 'user' | 'artisan' | 'admin';
  };
};

const router = Router();

// Apply JWT authentication to all routes
router.use(authMiddleware);

// Update online status
router.put('/online-status', [
  body('isOnline').isBoolean().withMessage('isOnline must be a boolean'),
  handleValidationErrors
], updateOnlineStatus);

// Update location consent
router.put('/location-consent', [
  body('locationTracking').isBoolean().withMessage('locationTracking must be a boolean'),
  handleValidationErrors
], updateLocationConsent);

// Update location
router.put('/location', [
  body('latitude').isFloat().withMessage('latitude must be a number'),
  body('longitude').isFloat().withMessage('longitude must be a number'),
  handleValidationErrors
], updateLocation);

// Get current status
router.get('/status', getStatus);

export default router;
