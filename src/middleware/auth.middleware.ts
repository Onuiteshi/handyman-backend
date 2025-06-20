import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    type: 'user' | 'artisan' | 'admin';
    role?: 'USER' | 'ARTISAN' | 'ADMIN';
  };
}

// Extend the Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        type: 'user' | 'artisan' | 'admin';
        role?: 'USER' | 'ARTISAN' | 'ADMIN';
      };
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      type: 'user' | 'artisan' | 'admin';
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const isArtisan: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type !== 'artisan') {
    res.status(403).json({ message: 'Access denied. Artisan only.' });
    return;
  }
  next();
};

export const isUser: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type !== 'user') {
    res.status(403).json({ message: 'Access denied. User only.' });
    return;
  }
  next();
};

export const isAdmin: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type !== 'admin' && req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Access denied. Admin only.' });
    return;
  }
  next();
};