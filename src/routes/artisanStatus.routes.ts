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

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        type: 'user' | 'artisan' | 'admin';
      };
    }
  }
}

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

// Type for our route handlers
type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * @route   GET /api/artisan/status
 * @desc    Get artisan's current status and location
 * @access  Private (Artisan)
 */
router.get('/status', getStatus as unknown as RequestHandler);

/**
 * @route   PUT /api/artisan/online-status
 * @desc    Update artisan's online status
 * @access  Private (Artisan)
 */
router.put(
  '/online-status',
  [
    body('isOnline')
      .isBoolean()
      .withMessage('isOnline must be a boolean value')
  ],
  handleValidationErrors,
  updateOnlineStatus as unknown as RequestHandler
);

/**
 * @route   PUT /api/artisan/location-consent
 * @desc    Update location tracking consent and set initial location
 * @access  Private (Artisan)
 */
router.put(
  '/location-consent',
  [
    body('locationTracking')
      .isBoolean()
      .withMessage('locationTracking must be a boolean value'),
    body('latitude')
      .if(body('locationTracking').equals(String(true)))
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .if(body('locationTracking').equals(String(true)))
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  ],
  handleValidationErrors,
  updateLocationConsent as unknown as RequestHandler
);

/**
 * @route   PUT /api/artisan/location
 * @desc    Update artisan's current location
 * @access  Private (Artisan)
 */
router.put(
  '/location',
  [
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  ],
  handleValidationErrors,
  updateLocation as unknown as RequestHandler
);

export default router;
