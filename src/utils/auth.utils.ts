import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export interface TokenPayload {
  id: string;
  type: 'user' | 'artisan' | 'admin';
  role?: 'USER' | 'ARTISAN' | 'ADMIN';
}

export const generateToken = (id: string, type: 'user' | 'artisan' | 'admin', role: 'USER' | 'ARTISAN' | 'ADMIN' = 'USER'): string => {
  return jwt.sign(
    { id, type, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
}; 

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;
}