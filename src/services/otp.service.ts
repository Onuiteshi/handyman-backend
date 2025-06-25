import prisma from '../lib/prisma';

// Define OTPType enum locally to avoid import issues
enum OTPType {
  SIGNUP = 'SIGNUP',
  LOGIN = 'LOGIN',
  VERIFICATION = 'VERIFICATION',
  PROFILE_SWITCH = 'PROFILE_SWITCH'
}

export class OTPService {
  private static instance: OTPService;

  private constructor() {}

  public static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  /**
   * Generate a 6-digit OTP
   */
  public generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to the provided identifier (email or phone)
   */
  public async sendOTP(identifier: string, type: OTPType, userId?: string): Promise<boolean> {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      
      // Set expiration (5 minutes from now)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Clean up any existing unused OTPs for this identifier
      await this.cleanupExistingOTPs(identifier);

      // Store OTP in database
      await prisma.oTPVerification.create({
        data: {
          identifier,
          otp,
          type,
          expiresAt,
          userId
        }
      });

      // Send OTP via appropriate channel
      const isEmail = this.isEmail(identifier);
      if (isEmail) {
        return await this.sendEmailOTP(identifier, otp);
      } else {
        return await this.sendSMSOTP(identifier, otp);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  }

  /**
   * Verify OTP for the provided identifier
   */
  public async verifyOTP(identifier: string, otp: string, type: OTPType): Promise<boolean> {
    try {
      // Find the OTP record
      const otpRecord = await prisma.oTPVerification.findFirst({
        where: {
          identifier,
          otp,
          type,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!otpRecord) {
        return false;
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts >= 3) {
        await this.markOTPAsUsed(otpRecord.id);
        return false;
      }

      // Increment attempts
      await prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      });

      // If OTP matches, mark as used
      if (otpRecord.otp === otp) {
        await this.markOTPAsUsed(otpRecord.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  /**
   * Clean up expired OTPs
   */
  public async cleanupExpiredOTPs(): Promise<void> {
    try {
      await prisma.oTPVerification.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isUsed: true }
          ]
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  /**
   * Clean up existing unused OTPs for an identifier
   */
  private async cleanupExistingOTPs(identifier: string): Promise<void> {
    try {
      await prisma.oTPVerification.deleteMany({
        where: {
          identifier,
          isUsed: false
        }
      });
    } catch (error) {
      console.error('Error cleaning up existing OTPs:', error);
    }
  }

  /**
   * Mark OTP as used
   */
  private async markOTPAsUsed(otpId: string): Promise<void> {
    try {
      await prisma.oTPVerification.update({
        where: { id: otpId },
        data: { isUsed: true }
      });
    } catch (error) {
      console.error('Error marking OTP as used:', error);
    }
  }

  /**
   * Check if identifier is an email
   */
  private isEmail(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
  }

  /**
   * Send OTP via email (placeholder implementation)
   */
  private async sendEmailOTP(email: string, otp: string): Promise<boolean> {
    try {
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      console.log(`Sending OTP ${otp} to email: ${email}`);
      
      // For development, just log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Email OTP for ${email}: ${otp}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending email OTP:', error);
      return false;
    }
  }

  /**
   * Send OTP via SMS (placeholder implementation)
   */
  private async sendSMSOTP(phone: string, otp: string): Promise<boolean> {
    try {
      // TODO: Integrate with actual SMS service (Twilio, AWS SNS, etc.)
      console.log(`Sending OTP ${otp} to phone: ${phone}`);
      
      // For development, just log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] SMS OTP for ${phone}: ${otp}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending SMS OTP:', error);
      return false;
    }
  }
}

export default OTPService.getInstance(); 