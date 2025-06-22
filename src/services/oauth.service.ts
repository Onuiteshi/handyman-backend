import { PrismaClient, UserRole, AuthProvider } from '../generated/prisma';
import { GoogleUserInfo } from '../types/auth.types';

const prisma = new PrismaClient();

export class OAuthService {
  private static instance: OAuthService;

  private constructor() {}

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  /**
   * Verify Google token and get user info
   */
  public async verifyGoogleToken(googleToken: string): Promise<GoogleUserInfo | null> {
    try {
      // TODO: Implement actual Google token verification
      // For now, we'll use a placeholder implementation
      
      // In production, you would:
      // 1. Verify the token with Google's API
      // 2. Get user information from Google
      // 3. Return the user info or null if invalid
      
      // Placeholder implementation for development
      if (process.env.NODE_ENV === 'development') {
        // Mock Google user info for development
        return {
          id: 'mock_google_id',
          email: 'test@gmail.com',
          name: 'Test User',
          picture: 'https://example.com/avatar.jpg'
        };
      }
      
      // TODO: Implement actual Google API call
      // const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${googleToken}`);
      // const data = await response.json();
      
      return null;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }

  /**
   * Find or create user from Google OAuth
   */
  public async findOrCreateGoogleUser(googleUserInfo: GoogleUserInfo, role: UserRole = UserRole.CUSTOMER): Promise<any> {
    try {
      // Check if user exists with this Google ID
      let user = await prisma.user.findUnique({
        where: { googleId: googleUserInfo.id },
        include: {
          customer: true,
          artisan: true
        }
      });

      if (user) {
        return user;
      }

      // Check if user exists with this email
      if (googleUserInfo.email) {
        user = await prisma.user.findUnique({
          where: { email: googleUserInfo.email },
          include: {
            customer: true,
            artisan: true
          }
        });

        if (user) {
          // Update existing user with Google ID
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleUserInfo.id,
              avatar: googleUserInfo.picture,
              authProvider: AuthProvider.OAUTH_GOOGLE,
              isEmailVerified: true
            },
            include: {
              customer: true,
              artisan: true
            }
          });
          return user;
        }
      }

      // Create new user
      const userData: any = {
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        googleId: googleUserInfo.id,
        avatar: googleUserInfo.picture,
        authProvider: AuthProvider.OAUTH_GOOGLE,
        role,
        isEmailVerified: true,
        profileComplete: false
      };

      user = await prisma.user.create({
        data: userData,
        include: {
          customer: true,
          artisan: true
        }
      });

      // Create customer or artisan record based on role
      if (role === UserRole.CUSTOMER) {
        await prisma.customer.create({
          data: {
            userId: user.id
          }
        });
      } else if (role === UserRole.ARTISAN) {
        await prisma.artisan.create({
          data: {
            userId: user.id,
            skills: [],
            experience: 0,
            portfolio: [],
            isProfileComplete: false
          }
        });
      }

      // Return updated user with relations
      return await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          customer: true,
          artisan: true
        }
      });
    } catch (error) {
      console.error('Error finding or creating Google user:', error);
      throw error;
    }
  }

  /**
   * Get Google OAuth URL for authorization
   */
  public getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
    const scope = 'email profile';
    
    return `https://accounts.google.com/o/oauth2/v2/auth?` +
           `client_id=${clientId}&` +
           `redirect_uri=${encodeURIComponent(redirectUri)}&` +
           `response_type=code&` +
           `scope=${encodeURIComponent(scope)}&` +
           `access_type=offline&` +
           `prompt=consent`;
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForToken(code: string): Promise<string | null> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const data = await response.json();
      return data.access_token || null;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  }

  /**
   * Get user info from Google using access token
   */
  public async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        given_name: data.given_name,
        family_name: data.family_name,
      };
    } catch (error) {
      console.error('Error getting Google user info:', error);
      return null;
    }
  }
}

export default OAuthService.getInstance(); 