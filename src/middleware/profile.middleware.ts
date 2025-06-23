import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, ProfileSessionStatus } from '../generated/prisma';
import { ProfileTokenPayload } from '../types/profile.types';

const prisma = new PrismaClient();

export interface ProfileRequest extends Request {
  profileUser?: ProfileTokenPayload;
  currentProfile?: any;
}

// Extend the Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      profileUser?: ProfileTokenPayload;
      currentProfile?: any;
    }
  }
}

/**
 * Middleware to authenticate profile sessions
 */
export const profileAuthMiddleware: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ 
        error: {
          message: 'Profile authentication required',
          code: 'PROFILE_AUTH_REQUIRED'
        }
      });
      return;
    }

    // Verify the profile token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as ProfileTokenPayload;

    // Check if session exists and is active
    const session = await prisma.profileSession.findFirst({
      where: {
        token: token,
        status: ProfileSessionStatus.ACTIVE,
        expiresAt: { gt: new Date() }
      },
      include: {
        profile: true,
        user: true
      }
    });

    if (!session) {
      res.status(401).json({ 
        error: {
          message: 'Invalid or expired profile session',
          code: 'INVALID_PROFILE_SESSION'
        }
      });
      return;
    }

    // Update last activity
    await prisma.profileSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    });

    req.profileUser = decoded;
    req.currentProfile = session.profile;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: {
        message: 'Invalid profile token',
        code: 'INVALID_PROFILE_TOKEN'
      }
    });
  }
};

/**
 * Middleware to check if user has access to a specific profile
 */
export const requireProfileAccess = (profileId?: string): RequestHandler => {
  return async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
      const targetProfileId = profileId || req.params.profileId || req.body.profileId;
      
      if (!targetProfileId) {
        res.status(400).json({ 
          error: {
            message: 'Profile ID is required',
            code: 'PROFILE_ID_REQUIRED'
          }
        });
        return;
      }

      if (req.profileUser?.profileId !== targetProfileId) {
        res.status(403).json({ 
          error: {
            message: 'Access denied to this profile',
            code: 'PROFILE_ACCESS_DENIED'
          }
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        error: {
          message: 'Profile access check failed',
          code: 'PROFILE_ACCESS_CHECK_FAILED'
        }
      });
    }
  };
};

/**
 * Middleware to check profile permissions
 */
export const requireProfilePermission = (permission: string): RequestHandler => {
  return async (req: ProfileRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.profileUser) {
        res.status(401).json({ 
          error: {
            message: 'Profile authentication required',
            code: 'PROFILE_AUTH_REQUIRED'
          }
        });
        return;
      }

      // Check if user has the required permission
      const member = await prisma.profileMember.findFirst({
        where: {
          profileId: req.profileUser.profileId,
          userId: req.profileUser.userId,
          isActive: true
        }
      });

      if (!member) {
        res.status(403).json({ 
          error: {
            message: 'No access to this profile',
            code: 'NO_PROFILE_ACCESS'
          }
        });
        return;
      }

      const permissions = member.permissions as Record<string, any> || {};
      
      if (!permissions[permission] && !permissions.owner) {
        res.status(403).json({ 
          error: {
            message: `Permission '${permission}' required`,
            code: 'INSUFFICIENT_PERMISSIONS'
          }
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        error: {
          message: 'Permission check failed',
          code: 'PERMISSION_CHECK_FAILED'
        }
      });
    }
  };
};

/**
 * Middleware to check if user is profile owner
 */
export const requireProfileOwner: RequestHandler = async (req: ProfileRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.profileUser) {
      res.status(401).json({ 
        error: {
          message: 'Profile authentication required',
          code: 'PROFILE_AUTH_REQUIRED'
        }
      });
      return;
    }

    const profile = await prisma.profile.findFirst({
      where: {
        id: req.profileUser.profileId,
        ownerId: req.profileUser.userId
      }
    });

    if (!profile) {
      res.status(403).json({ 
        error: {
          message: 'Only profile owner can perform this action',
          code: 'OWNER_ONLY_ACTION'
        }
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      error: {
        message: 'Profile owner check failed',
        code: 'OWNER_CHECK_FAILED'
      }
    });
  }
};

/**
 * Middleware to validate profile session and refresh if needed
 */
export const validateAndRefreshProfileSession: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      next();
      return;
    }

    const session = await prisma.profileSession.findFirst({
      where: {
        token: token,
        status: ProfileSessionStatus.ACTIVE
      }
    });

    if (session && session.expiresAt < new Date()) {
      // Session expired, but don't block the request
      // The client should handle token refresh
      res.setHeader('X-Session-Expired', 'true');
    }

    next();
  } catch (error) {
    // Don't block the request for session validation errors
    next();
  }
};

/**
 * Middleware to log profile access
 */
export const logProfileAccess: RequestHandler = async (req: ProfileRequest, res: Response, next: NextFunction) => {
  try {
    if (req.profileUser) {
      // Log profile access (in production, use a proper logging service)
      console.log(`Profile access: User ${req.profileUser.userId} accessed profile ${req.profileUser.profileId} at ${new Date().toISOString()}`);
    }
    next();
  } catch (error) {
    // Don't block the request for logging errors
    next();
  }
};

/**
 * Middleware to check profile status
 */
export const requireActiveProfile: RequestHandler = async (req: ProfileRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.currentProfile) {
      res.status(400).json({ 
        error: {
          message: 'No profile context',
          code: 'NO_PROFILE_CONTEXT'
        }
      });
      return;
    }

    if (req.currentProfile.status !== 'ACTIVE') {
      res.status(403).json({ 
        error: {
          message: 'Profile is not active',
          code: 'PROFILE_NOT_ACTIVE'
        }
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      error: {
        message: 'Profile status check failed',
        code: 'PROFILE_STATUS_CHECK_FAILED'
      }
    });
  }
};

/**
 * Middleware to rate limit profile switches
 */
export const rateLimitProfileSwitch: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId || req.query.userId;
    
    if (!userId) {
      next();
      return;
    }

    // Check recent profile switches (last 5 minutes)
    const recentSwitches = await prisma.profileSession.count({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
        }
      }
    });

    if (recentSwitches > 10) { // Max 10 switches per 5 minutes
      res.status(429).json({ 
        error: {
          message: 'Too many profile switches. Please wait before trying again.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
      return;
    }

    next();
  } catch (error) {
    // Don't block the request for rate limiting errors
    next();
  }
};

/**
 * Middleware to validate profile data
 */
export const validateProfileData: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type } = req.body;

    if (name && (typeof name !== 'string' || name.length < 2 || name.length > 50)) {
      res.status(400).json({ 
        error: {
          message: 'Profile name must be between 2 and 50 characters',
          code: 'INVALID_PROFILE_NAME'
        }
      });
      return;
    }

    if (type && !['PERSONAL', 'BUSINESS', 'FREELANCE', 'CORPORATE'].includes(type)) {
      res.status(400).json({ 
        error: {
          message: 'Invalid profile type',
          code: 'INVALID_PROFILE_TYPE'
        }
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      error: {
        message: 'Profile data validation failed',
        code: 'PROFILE_VALIDATION_FAILED'
      }
    });
  }
}; 