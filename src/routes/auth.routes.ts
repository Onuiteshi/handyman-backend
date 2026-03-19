import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { UserRole, AuthProvider, OTPType } from '@prisma/client';
import authService from '../services/auth.service';
import { 
  SignupRequest, 
  LoginRequest, 
  OTPVerificationRequest, 
  OAuthGoogleRequest, 
  AdminLoginRequest,
  CompleteProfileRequest
} from '../types/auth.types';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validateSignup = [
  body('identifier')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom((value) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(value) || value.length < 10) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  body('role')
    .optional()
    .isIn([UserRole.CUSTOMER, UserRole.ARTISAN])
    .withMessage('Role must be either CUSTOMER or ARTISAN')
];

const validateLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required')
];

const validateOTPVerification = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('type')
    .notEmpty()
    .withMessage('OTP type is required')
    .isIn([OTPType.SIGNUP, OTPType.LOGIN, OTPType.VERIFICATION])
    .withMessage('Invalid OTP type')
];

const validateOAuthGoogle = [
  body('googleToken')
    .notEmpty()
    .withMessage('Google token is required'),
  body('role')
    .optional()
    .isIn([UserRole.CUSTOMER, UserRole.ARTISAN])
    .withMessage('Role must be either CUSTOMER or ARTISAN')
];

const validateCompleteProfile = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('address')
    .optional()
    .notEmpty()
    .withMessage('Address cannot be empty if provided'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body()
    .custom((value) => {
      // Either address or (latitude and longitude) must be provided
      if (!value.address && (!value.latitude || !value.longitude)) {
        throw new Error('Either address or both latitude and longitude must be provided');
      }
      return true;
    })
];

const validateAdminLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
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

// User signup
router.post('/signup', [...validateSignup, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signupData: SignupRequest = req.body;
    const result = await authService.signup(signupData);
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

// Verify OTP (for signup)
router.post('/verify-signup', [...validateOTPVerification, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const otpData: OTPVerificationRequest = {
      ...req.body,
      type: OTPType.SIGNUP
    };
    const result = await authService.verifyOTP(otpData);
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

// User login
router.post('/login', [...validateLogin, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginData: LoginRequest = req.body;
    const result = await authService.login(loginData);
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

// Verify OTP (for login)
router.post('/verify-login', [...validateOTPVerification, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const otpData: OTPVerificationRequest = {
      ...req.body,
      type: OTPType.LOGIN
    };
    const result = await authService.verifyLoginOTP(otpData);
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

// Google OAuth
router.post('/google', [...validateOAuthGoogle, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oauthData: OAuthGoogleRequest = req.body;
    const result = await authService.oauthGoogle(oauthData);
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

// Admin login (email/password only)
router.post('/admin/login', [...validateAdminLogin, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminData: AdminLoginRequest = req.body;
    const result = await authService.adminLogin(adminData);
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

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ 
        error: {
          message: 'Token is required',
          status: 400
        }
      });
      return;
    }
    const result = await authService.refreshToken(token);
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

// Logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ 
        error: {
          message: 'Token is required',
          status: 400
        }
      });
      return;
    }
    await authService.logout(token);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(400).json({ 
      error: {
        message: error.message,
        status: 400
      }
    });
  }
});

// Complete profile (after OTP verification or Google OAuth)
router.post('/complete-profile', [authMiddleware, ...validateCompleteProfile, handleValidationErrors], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ 
        error: {
          message: 'Authentication required',
          status: 401
        }
      });
      return;
    }

    const profileData: CompleteProfileRequest = req.body;
    const result = await authService.completeProfile(userId, profileData);
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

export default router; 