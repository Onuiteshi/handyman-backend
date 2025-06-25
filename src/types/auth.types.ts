import { UserRole, AuthProvider, OTPType } from '@prisma/client';

// Base User interface
export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  dateOfBirth?: Date;
  role: UserRole;
  authProvider: AuthProvider;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileComplete: boolean;
  googleId?: string;
  avatar?: string;
  password?: string; // Only for admin users
  createdAt: Date;
  updatedAt: Date;
}

// Customer interface
export interface Customer {
  id: string;
  userId: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

// Artisan interface
export interface Artisan {
  id: string;
  userId: string;
  skills: string[];
  experience: number;
  portfolio: string[];
  isProfileComplete: boolean;
  bio?: string;
  photoUrl?: string;
  idDocumentUrl?: string;
  isOnline: boolean;
  locationTracking: boolean;
  latitude?: number;
  longitude?: number;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

// OTP Verification interface
export interface OTPVerification {
  id: string;
  identifier: string; // email or phone
  otp: string;
  type: OTPType;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
  createdAt: Date;
  userId?: string;
  user?: User;
}

// Authentication request interfaces
export interface SignupRequest {
  identifier: string; // email or phone
  name: string;
  dateOfBirth?: string;
  role?: UserRole;
  authProvider?: AuthProvider;
}

export interface LoginRequest {
  identifier: string; // email or phone
}

export interface OTPVerificationRequest {
  identifier: string;
  otp: string;
  type: OTPType;
}

export interface OAuthGoogleRequest {
  googleToken: string;
  name?: string;
  dateOfBirth?: string;
  role?: UserRole;
}

// Admin authentication (keeps email/password)
export interface AdminLoginRequest {
  email: string;
  password: string;
}

// Profile completion interfaces
export interface CustomerProfileRequest {
  preferences?: Record<string, any>;
}

export interface ArtisanProfileRequest {
  skills: string[];
  experience: number;
  portfolio?: string[];
  bio?: string;
}

// JWT Token payload
export interface TokenPayload {
  id: string;
  role: UserRole;
  authProvider: AuthProvider;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileComplete: boolean;
}

// API Response interfaces
export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
  customer?: Customer;
  artisan?: Artisan;
  requiresProfileCompletion?: boolean;
}

export interface OTPResponse {
  message: string;
  identifier: string;
  expiresIn: number; // seconds
}

export interface ErrorResponse {
  error: {
    message: string;
    status: number;
    code?: string;
  };
}

// Validation schemas
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// OAuth2 interfaces
export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface OAuth2Config {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

// SMS/Email service interfaces
export interface SMSService {
  sendOTP(phone: string, otp: string): Promise<boolean>;
}

export interface EmailService {
  sendOTP(email: string, otp: string): Promise<boolean>;
}

// OTP service interface
export interface OTPService {
  generateOTP(): string;
  sendOTP(identifier: string, type: OTPType): Promise<boolean>;
  verifyOTP(identifier: string, otp: string, type: OTPType): Promise<boolean>;
  cleanupExpiredOTPs(): Promise<void>;
}

// Authentication service interface
export interface AuthService {
  signup(data: SignupRequest): Promise<OTPResponse>;
  verifyOTP(data: OTPVerificationRequest): Promise<AuthResponse>;
  login(data: LoginRequest): Promise<OTPResponse>;
  verifyLoginOTP(data: OTPVerificationRequest): Promise<AuthResponse>;
  oauthGoogle(data: OAuthGoogleRequest): Promise<AuthResponse>;
  adminLogin(data: AdminLoginRequest): Promise<AuthResponse>;
  refreshToken(token: string): Promise<AuthResponse>;
  logout(token: string): Promise<void>;
} 