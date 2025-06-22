import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../generated/prisma';
import { TokenPayload } from '../types/auth.types';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Extend the Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isArtisan: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.ARTISAN) {
    res.status(403).json({ message: 'Access denied. Artisan only.' });
    return;
  }
  next();
};

export const isCustomer: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.CUSTOMER) {
    res.status(403).json({ message: 'Access denied. Customer only.' });
    return;
  }
  next();
};

export const isAdmin: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return;
  }
  next();
};

export const requireVerifiedEmail: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isEmailVerified) {
    res.status(403).json({ message: 'Email verification required.' });
    return;
  }
  next();
};

export const requireVerifiedPhone: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isPhoneVerified) {
    res.status(403).json({ message: 'Phone verification required.' });
    return;
  }
  next();
};

export const requireProfileComplete: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.profileComplete) {
    res.status(403).json({ message: 'Profile completion required.' });
    return;
  }
  next();
};