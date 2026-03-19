// Use require for PrismaClient import for compatibility
const { PrismaClient } = require('@prisma/client');
import { hashPassword, comparePassword, generateToken } from '../utils/auth.utils';
import otpService from './otp.service';
import oauthService from './oauth.service';
import { 
  SignupRequest, 
  LoginRequest, 
  OTPVerificationRequest, 
  OAuthGoogleRequest, 
  AdminLoginRequest,
  CompleteProfileRequest,
  AuthResponse,
  OTPResponse,
  TokenPayload,
  User
} from '../types/auth.types';
import { UserRole, AuthProvider, OTPType } from '../types/auth.types';

const prisma = new PrismaClient();

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Convert Prisma User to our User interface
   */
  private convertPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email || undefined,
      phone: prismaUser.phone || undefined,
      name: prismaUser.name || undefined,
      dateOfBirth: prismaUser.dateOfBirth || undefined,
      role: prismaUser.role,
      authProvider: prismaUser.authProvider,
      isEmailVerified: prismaUser.isEmailVerified,
      isPhoneVerified: prismaUser.isPhoneVerified,
      profileComplete: prismaUser.profileComplete,
      googleId: prismaUser.googleId || undefined,
      avatar: prismaUser.avatar || undefined,
      password: prismaUser.password || undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    };
  }

  /**
   * User signup with OTP (phone number only)
   */
  public async signup(data: SignupRequest): Promise<OTPResponse> {
    try {
      const { identifier, role = UserRole.CUSTOMER } = data;

      // Validate that identifier is a phone number
      if (!this.isPhone(identifier)) {
        throw new Error('Invalid phone number format. Please provide a valid phone number.');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: identifier
        }
      });

      if (existingUser) {
        throw new Error('User already exists with this phone number.');
      }

      // Create user record (without verification, no name yet)
      const user = await prisma.user.create({
        data: {
          phone: identifier,
          authProvider: AuthProvider.PHONE,
          role,
          isPhoneVerified: false,
          profileComplete: false
        }
      });

      // Send OTP via SMS
      const otpSent = await otpService.sendOTP(identifier, OTPType.SIGNUP, user.id);

      if (!otpSent) {
        // Clean up user if OTP sending fails
        await prisma.user.delete({ where: { id: user.id } });
        throw new Error('Failed to send OTP. Please try again.');
      }

      return {
        message: 'OTP sent successfully',
        identifier,
        expiresIn: 300 // 5 minutes
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP and complete signup (returns token but requires profile completion)
   */
  public async verifyOTP(data: OTPVerificationRequest): Promise<AuthResponse> {
    try {
      const { identifier, otp, type } = data;

      // Verify OTP
      const isValidOTP = await otpService.verifyOTP(identifier, otp, type);

      if (!isValidOTP) {
        throw new Error('Invalid or expired OTP.');
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        },
        include: {
          customer: true,
          artisan: true
        }
      });

      if (!user) {
        throw new Error('User not found.');
      }

      // Update verification status
      const updateData: any = {};
      if (this.isEmail(identifier)) {
        updateData.isEmailVerified = true;
      } else {
        updateData.isPhoneVerified = true;
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: {
          customer: true,
          artisan: true
        }
      });

      // Create customer or artisan record if not exists
      if (updatedUser.role === UserRole.CUSTOMER && !updatedUser.customer) {
        await prisma.customer.create({
          data: { userId: updatedUser.id }
        });
      } else if (updatedUser.role === UserRole.ARTISAN && !updatedUser.artisan) {
        await prisma.artisan.create({
          data: {
            userId: updatedUser.id,
            skills: [],
            experience: 0,
            portfolio: [],
            isProfileComplete: false
          }
        });
      }

      // Generate token
      const tokenPayload: TokenPayload = {
        id: updatedUser.id,
        role: updatedUser.role,
        authProvider: updatedUser.authProvider,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        profileComplete: updatedUser.profileComplete
      };

      const token = generateToken(tokenPayload);

      // Profile completion is required if name, email, or address is missing
      const requiresProfileCompletion = !updatedUser.name || !updatedUser.email || (!updatedUser.address && (!updatedUser.latitude || !updatedUser.longitude));

      return {
        message: 'OTP verified successfully. Please complete your profile.',
        token,
        user: this.convertPrismaUserToUser(updatedUser),
        requiresProfileCompletion
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  }

  /**
   * User login with OTP
   */
  public async login(data: LoginRequest): Promise<OTPResponse> {
    try {
      const { identifier } = data;

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        }
      });

      if (!user) {
        throw new Error('User not found.');
      }

      // Send OTP
      const otpSent = await otpService.sendOTP(identifier, OTPType.LOGIN, user.id);

      if (!otpSent) {
        throw new Error('Failed to send OTP. Please try again.');
      }

      return {
        message: 'OTP sent successfully',
        identifier,
        expiresIn: 300 // 5 minutes
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify login OTP
   */
  public async verifyLoginOTP(data: OTPVerificationRequest): Promise<AuthResponse> {
    try {
      const { identifier, otp, type } = data;

      // Verify OTP
      const isValidOTP = await otpService.verifyOTP(identifier, otp, type);

      if (!isValidOTP) {
        throw new Error('Invalid or expired OTP.');
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        },
        include: {
          customer: true,
          artisan: true
        }
      });

      if (!user) {
        throw new Error('User not found.');
      }

      // Generate token
      const tokenPayload: TokenPayload = {
        id: user.id,
        role: user.role,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        profileComplete: user.profileComplete
      };

      const token = generateToken(tokenPayload);

      // Check if profile completion is required
      const requiresProfileCompletion = user.role === UserRole.ARTISAN && !user.profileComplete;

      return {
        message: 'Login successful',
        token,
        user: this.convertPrismaUserToUser(user),
        requiresProfileCompletion
      };
    } catch (error) {
      console.error('Login OTP verification error:', error);
      throw error;
    }
  }

  /**
   * Google OAuth authentication (returns token but requires profile completion)
   */
  public async oauthGoogle(data: OAuthGoogleRequest): Promise<AuthResponse> {
    try {
      const { googleToken, role = UserRole.CUSTOMER } = data;

      // Verify Google token
      const googleUserInfo = await oauthService.verifyGoogleToken(googleToken);

      if (!googleUserInfo) {
        throw new Error('Invalid Google token.');
      }

      // Find or create user
      const user = await oauthService.findOrCreateGoogleUser(googleUserInfo, role);

      // Generate token
      const tokenPayload: TokenPayload = {
        id: user.id,
        role: user.role,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        profileComplete: user.profileComplete
      };

      const token = generateToken(tokenPayload);

      // Profile completion is required if address/location is missing
      const requiresProfileCompletion = !user.address && (!user.latitude || !user.longitude);

      return {
        message: 'Google authentication successful. Please complete your profile.',
        token,
        user: this.convertPrismaUserToUser(user),
        requiresProfileCompletion
      };
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw error;
    }
  }

  /**
   * Complete user profile with name, email, and address/location
   */
  public async completeProfile(userId: string, data: CompleteProfileRequest): Promise<AuthResponse> {
    try {
      const { name, email, address, latitude, longitude } = data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customer: true,
          artisan: true
        }
      });

      if (!user) {
        throw new Error('User not found.');
      }

      // Update user profile
      const updateData: any = {
        name,
        profileComplete: true
      };

      // Update email if provided and not already set
      if (email && !user.email) {
        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Email already in use.');
        }
        updateData.email = email;
        updateData.isEmailVerified = false; // Email from profile completion needs verification
      }

      // Update address/location
      if (address) {
        updateData.address = address;
      }
      if (latitude !== undefined) {
        updateData.latitude = latitude;
      }
      if (longitude !== undefined) {
        updateData.longitude = longitude;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          customer: true,
          artisan: true
        }
      });

      // Generate new token with updated profile status
      const tokenPayload: TokenPayload = {
        id: updatedUser.id,
        role: updatedUser.role,
        authProvider: updatedUser.authProvider,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        profileComplete: updatedUser.profileComplete
      };

      const token = generateToken(tokenPayload);

      return {
        message: 'Profile completed successfully',
        token,
        user: this.convertPrismaUserToUser(updatedUser)
      };
    } catch (error) {
      console.error('Profile completion error:', error);
      throw error;
    }
  }

  /**
   * Admin login (email/password only)
   */
  public async adminLogin(data: AdminLoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = data;

      // Find admin user
      const user = await prisma.user.findFirst({
        where: {
          email,
          role: UserRole.ADMIN
        },
        include: {
          customer: true,
          artisan: true
        }
      });

      if (!user || !user.password) {
        throw new Error('Invalid credentials.');
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);

      if (!isValidPassword) {
        throw new Error('Invalid credentials.');
      }

      // Generate token
      const tokenPayload: TokenPayload = {
        id: user.id,
        role: user.role,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        profileComplete: user.profileComplete
      };

      const token = generateToken(tokenPayload);

      return {
        message: 'Admin login successful',
        token,
        user: this.convertPrismaUserToUser(user)
      };
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  }

  /**
   * Refresh token
   */
  public async refreshToken(token: string): Promise<AuthResponse> {
    try {
      // TODO: Implement token refresh logic
      // For now, return the same token
      return {
        message: 'Token refreshed successfully',
        token
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  public async logout(token: string): Promise<void> {
    try {
      // TODO: Implement token blacklisting
      // For now, just return success
      console.log('User logged out:', token);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Check if identifier is email
   */
  private isEmail(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
  }

  /**
   * Check if identifier is phone
   */
  private isPhone(identifier: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(identifier) && identifier.length >= 10;
  }
}

export default AuthService.getInstance(); 