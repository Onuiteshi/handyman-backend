import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ProfileType, UserRole } from '../generated/prisma';
import profileService from '../services/profile.service';
import { 
  profileAuthMiddleware, 
  requireProfileAccess, 
  requireProfilePermission, 
  requireProfileOwner,
  requireActiveProfile,
  rateLimitProfileSwitch,
  validateProfileData,
  logProfileAccess
} from '../middleware/profile.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  CreateProfileRequest,
  UpdateProfileRequest,
  SwitchProfileRequest,
  ProfileAuthenticationRequest,
  InviteToProfileRequest,
  AcceptInvitationRequest,
  CustomerProfileRequest,
  ArtisanProfileRequest
} from '../types/profile.types';

const router = Router();

// Validation middleware
const validateCreateProfile = [
  body('name')
    .notEmpty()
    .withMessage('Profile name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Profile name must be between 2 and 50 characters'),
  body('type')
    .notEmpty()
    .withMessage('Profile type is required')
    .isIn([ProfileType.PERSONAL, ProfileType.BUSINESS, ProfileType.FREELANCE, ProfileType.CORPORATE])
    .withMessage('Invalid profile type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const validateSwitchProfile = [
  body('profileId')
    .notEmpty()
    .withMessage('Profile ID is required')
    .isUUID()
    .withMessage('Profile ID must be a valid UUID'),
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required')
    .custom((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Please provide a valid email or phone number');
      }
      return true;
    })
];

const validateProfileAuthentication = [
  body('profileId')
    .notEmpty()
    .withMessage('Profile ID is required')
    .isUUID()
    .withMessage('Profile ID must be a valid UUID'),
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
];

const validateInviteToProfile = [
  body('profileId')
    .notEmpty()
    .withMessage('Profile ID is required')
    .isUUID()
    .withMessage('Profile ID must be a valid UUID'),
  body('invitedEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('invitedPhone')
    .optional()
    .custom((value) => {
      if (value) {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(value)) {
          throw new Error('Please provide a valid phone number');
        }
      }
      return true;
    }),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn([UserRole.CUSTOMER, UserRole.ARTISAN])
    .withMessage('Role must be either CUSTOMER or ARTISAN'),
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Message must be less than 200 characters')
];

const validateAcceptInvitation = [
  body('invitationId')
    .notEmpty()
    .withMessage('Invitation ID is required')
    .isUUID()
    .withMessage('Invitation ID must be a valid UUID'),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('User ID must be a valid UUID')
];

const validateCustomerProfile = [
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
  body('billingAddress')
    .optional()
    .isObject()
    .withMessage('Billing address must be an object'),
  body('paymentMethods')
    .optional()
    .isObject()
    .withMessage('Payment methods must be an object')
];

const validateArtisanProfile = [
  body('skills')
    .isArray()
    .withMessage('Skills must be an array'),
  body('skills.*')
    .isString()
    .withMessage('Each skill must be a string'),
  body('experience')
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  body('portfolio')
    .optional()
    .isArray()
    .withMessage('Portfolio must be an array'),
  body('portfolio.*')
    .optional()
    .isURL()
    .withMessage('Portfolio items must be valid URLs'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
  body('photoUrl')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL'),
  body('idDocumentUrl')
    .optional()
    .isURL()
    .withMessage('ID document URL must be a valid URL'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('availability')
    .optional()
    .isObject()
    .withMessage('Availability must be an object')
];

// Validation error handler
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: {
        message: 'Validation failed',
        status: 400,
        details: errors.array()
      }
    });
    return;
  }
  next();
};

// Create a new profile
router.post('/create', [
  authMiddleware,
  ...validateCreateProfile,
  validateProfileData,
  handleValidationErrors
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const profileData: CreateProfileRequest = req.body;
    
    const result = await profileService.createProfile(userId, profileData);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Get user's profiles
router.get('/my-profiles', [
  authMiddleware
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const result = await profileService.getUserProfiles(userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Switch to a profile
router.post('/switch', [
  authMiddleware,
  ...validateSwitchProfile,
  rateLimitProfileSwitch,
  handleValidationErrors
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const switchData: SwitchProfileRequest = req.body;
    
    const result = await profileService.switchProfile(userId, switchData);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Authenticate for profile switch
router.post('/authenticate', [
  ...validateProfileAuthentication,
  handleValidationErrors
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authData: ProfileAuthenticationRequest = req.body;
    const result = await profileService.authenticateProfileSwitch(authData);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Refresh profile session
router.post('/refresh-session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ 
        error: {
          message: 'Refresh token is required',
          status: 400
        }
      });
      return;
    }
    
    const result = await profileService.refreshProfileSession(refreshToken);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Revoke profile session
router.delete('/sessions/:sessionId', [
  profileAuthMiddleware,
  logProfileAccess
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = (req as any).profileUser.userId;
    
    await profileService.revokeProfileSession(sessionId, userId);
    res.status(200).json({ message: 'Session revoked successfully' });
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Update profile
router.put('/:profileId', [
  profileAuthMiddleware,
  requireProfileAccess(),
  requireProfilePermission('edit'),
  requireActiveProfile,
  logProfileAccess,
  ...validateCreateProfile.slice(1), // Skip name validation for updates
  validateProfileData,
  handleValidationErrors
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.params.profileId;
    const userId = (req as any).profileUser.userId;
    const updateData: UpdateProfileRequest = req.body;
    
    const result = await profileService.updateProfile(profileId, userId, updateData);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Delete profile
router.delete('/:profileId', [
  profileAuthMiddleware,
  requireProfileAccess(),
  requireProfileOwner,
  logProfileAccess
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.params.profileId;
    const userId = (req as any).profileUser.userId;
    
    await profileService.deleteProfile(profileId, userId);
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Invite user to profile
router.post('/:profileId/invite', [
  profileAuthMiddleware,
  requireProfileAccess(),
  requireProfilePermission('invite'),
  requireActiveProfile,
  logProfileAccess,
  ...validateInviteToProfile.slice(1), // Skip profileId validation since it's in URL
  handleValidationErrors
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.params.profileId;
    const inviterId = (req as any).profileUser.userId;
    const inviteData: InviteToProfileRequest = {
      ...req.body,
      profileId
    };
    
    const result = await profileService.inviteToProfile(inviterId, inviteData);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Accept profile invitation
router.post('/invitations/:invitationId/accept', [
  authMiddleware,
  ...validateAcceptInvitation.slice(1), // Skip invitationId validation since it's in URL
  handleValidationErrors
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invitationId = req.params.invitationId;
    const userId = (req as any).user.id;
    const acceptData: AcceptInvitationRequest = {
      invitationId,
      userId
    };
    
    const result = await profileService.acceptInvitation(acceptData);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Get profile analytics
router.get('/:profileId/analytics', [
  profileAuthMiddleware,
  requireProfileAccess(),
  requireProfilePermission('view_analytics'),
  requireActiveProfile,
  logProfileAccess
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.params.profileId;
    const userId = (req as any).profileUser.userId;
    
    const analytics = await profileService.getProfileAnalytics(profileId, userId);
    res.status(200).json({
      message: 'Analytics retrieved successfully',
      analytics
    });
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Update customer profile data
router.put('/:profileId/customer', [
  profileAuthMiddleware,
  requireProfileAccess(),
  requireProfilePermission('edit'),
  requireActiveProfile,
  logProfileAccess,
  ...validateCustomerProfile,
  handleValidationErrors
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.params.profileId;
    const userId = (req as any).profileUser.userId;
    const customerData: CustomerProfileRequest = req.body;
    
    // This would be implemented in the profile service
    // For now, return a placeholder response
    res.status(200).json({
      message: 'Customer profile updated successfully',
      profileId,
      customerData
    });
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Update artisan profile data
router.put('/:profileId/artisan', [
  profileAuthMiddleware,
  requireProfileAccess(),
  requireProfilePermission('edit'),
  requireActiveProfile,
  logProfileAccess,
  ...validateArtisanProfile,
  handleValidationErrors
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.params.profileId;
    const userId = (req as any).profileUser.userId;
    const artisanData: ArtisanProfileRequest = req.body;
    
    // This would be implemented in the profile service
    // For now, return a placeholder response
    res.status(200).json({
      message: 'Artisan profile updated successfully',
      profileId,
      artisanData
    });
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Get profile invitations
router.get('/:profileId/invitations', [
  profileAuthMiddleware,
  requireProfileAccess(),
  requireProfilePermission('view_invitations'),
  requireActiveProfile,
  logProfileAccess
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.params.profileId;
    
    // This would be implemented in the profile service
    // For now, return a placeholder response
    res.status(200).json({
      message: 'Invitations retrieved successfully',
      profileId,
      invitations: []
    });
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Get profile members
router.get('/:profileId/members', [
  profileAuthMiddleware,
  requireProfileAccess(),
  requireProfilePermission('view_members'),
  requireActiveProfile,
  logProfileAccess
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = req.params.profileId;
    
    // This would be implemented in the profile service
    // For now, return a placeholder response
    res.status(200).json({
      message: 'Members retrieved successfully',
      profileId,
      members: []
    });
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

export default router; 