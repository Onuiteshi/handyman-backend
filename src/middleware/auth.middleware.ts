import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    type: 'user' | 'artisan' | 'admin';
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      type: 'user' | 'artisan';
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isArtisan = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type !== 'artisan') {
    return res.status(403).json({ message: 'Access denied. Artisan only.' });
  }
  next();
};

export const isUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type !== 'user') {
    return res.status(403).json({ message: 'Access denied. User only.' });
  }
  next();
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};