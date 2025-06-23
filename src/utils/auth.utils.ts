import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TokenPayload } from '../types/auth.types';
import { ProfileTokenPayload } from '../types/profile.types';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

export const generateProfileToken = (payload: ProfileTokenPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' } // Profile sessions expire in 24 hours
  );
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;
}

export function verifyProfileToken(token: string): ProfileTokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as ProfileTokenPayload;
}

export const generateSecureOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateProfileInvitationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashProfileToken = async (token: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(token, salt);
};

export const compareProfileToken = async (token: string, hashedToken: string): Promise<boolean> => {
  return bcrypt.compare(token, hashedToken);
};