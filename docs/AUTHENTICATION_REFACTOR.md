# Authentication System Refactor - Complete Implementation

## Overview

This document outlines the complete refactor of the authentication system to implement OTP-based signup/login with OAuth2 integration. The new system provides a unified user experience with enhanced security and flexibility.

## 🚀 New Features

### 1. OTP-Based Authentication
- **6-digit OTP** sent via email or SMS
- **5-minute expiration** for security
- **3-attempt limit** to prevent brute force attacks
- **Automatic cleanup** of expired OTPs

### 2. OAuth2 Integration
- **Google OAuth** support
- **Automatic user creation** from OAuth data
- **Profile completion** prompts for new users

### 3. Unified User System
- **Single User table** for all user types
- **Role-based access** (CUSTOMER, ARTISAN, ADMIN)
- **Flexible authentication** (Email, Phone, OAuth)

### 4. Admin Exception
- **Email/Password authentication** for admins only
- **Enhanced security** for administrative access

## 📊 Database Schema

### New Schema Structure

```sql
-- Enums
enum UserRole { CUSTOMER, ARTISAN, ADMIN }
enum AuthProvider { EMAIL, PHONE, OAUTH_GOOGLE }
enum OTPType { SIGNUP, LOGIN, VERIFICATION }

-- Unified User table
model User {
  id                String       @id @default(uuid())
  email             String?      @unique
  phone             String?      @unique
  name              String
  dateOfBirth       DateTime?
  role              UserRole     @default(CUSTOMER)
  authProvider      AuthProvider @default(EMAIL)
  isEmailVerified   Boolean      @default(false)
  isPhoneVerified   Boolean      @default(false)
  profileComplete   Boolean      @default(false)
  googleId          String?      @unique
  avatar            String?
  password          String?      // Only for admin users
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  // Relations
  customer          Customer?
  artisan           Artisan?
  otpVerifications  OTPVerification[]
}

-- Customer-specific data
model Customer {
  id                String       @id @default(uuid())
  userId            String       @unique
  preferences       Json?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  user              User         @relation(fields: [userId], references: [id], onDelete: Cascade)
}

-- Artisan-specific data
model Artisan {
  id                String       @id @default(uuid())
  userId            String       @unique
  skills            String[]
  experience        Int
  portfolio         String[]
  isProfileComplete Boolean      @default(false)
  bio               String?
  photoUrl          String?
  idDocumentUrl     String?
  isOnline          Boolean      @default(false)
  locationTracking  Boolean      @default(false)
  latitude          Float?
  longitude         Float?
  lastSeen          DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  user              User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  categories        ArtisanServiceCategory[]
}

-- OTP Management
model OTPVerification {
  id                String       @id @default(uuid())
  identifier        String       // email or phone
  otp               String       // 6-digit OTP
  type              OTPType
  expiresAt         DateTime
  attempts          Int          @default(0)
  isUsed            Boolean      @default(false)
  createdAt         DateTime     @default(now())
  
  userId            String?
  user              User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 🔐 Authentication Flows

### 1. Customer/Artisan Signup Flow

```mermaid
graph TD
    A[User enters email/phone + name] --> B[Validate input]
    B --> C[Check if user exists]
    C --> D[Create user record]
    D --> E[Generate & send OTP]
    E --> F[User enters OTP]
    F --> G[Verify OTP]
    G --> H[Mark email/phone as verified]
    H --> I[Create customer/artisan record]
    I --> J[Generate JWT token]
    J --> K[Return success response]
```

### 2. Login Flow

```mermaid
graph TD
    A[User enters email/phone] --> B[Find user]
    B --> C[Generate & send OTP]
    C --> D[User enters OTP]
    D --> E[Verify OTP]
    E --> F[Generate JWT token]
    F --> G[Return success response]
```

### 3. Google OAuth Flow

```mermaid
graph TD
    A[User clicks Google Sign In] --> B[Get Google token]
    B --> C[Verify token with Google]
    C --> D[Extract user info]
    D --> E[Find or create user]
    E --> F[Generate JWT token]
    F --> G[Return success response]
```

### 4. Admin Login Flow

```mermaid
graph TD
    A[Admin enters email + password] --> B[Find admin user]
    B --> C[Verify password]
    C --> D[Generate JWT token]
    D --> E[Return success response]
```

## 🛠️ API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/auth/signup` | Send OTP for signup | `{ identifier, name, role?, authProvider? }` |
| POST | `/api/auth/verify-signup` | Verify OTP and complete signup | `{ identifier, otp, type: "SIGNUP" }` |
| POST | `/api/auth/login` | Send OTP for login | `{ identifier }` |
| POST | `/api/auth/verify-login` | Verify OTP and login | `{ identifier, otp, type: "LOGIN" }` |
| POST | `/api/auth/google` | Google OAuth authentication | `{ googleToken, name?, role? }` |
| POST | `/api/auth/admin/login` | Admin login (email/password) | `{ email, password }` |
| POST | `/api/auth/refresh` | Refresh JWT token | `{ token }` |
| POST | `/api/auth/logout` | Logout user | `{ token }` |

### Request/Response Examples

#### Customer Signup
```json
// Request
POST /api/auth/signup
{
  "identifier": "customer@example.com",
  "name": "John Doe",
  "role": "CUSTOMER",
  "authProvider": "EMAIL"
}

// Response
{
  "message": "OTP sent successfully",
  "identifier": "customer@example.com",
  "expiresIn": 300
}
```

#### OTP Verification
```json
// Request
POST /api/auth/verify-signup
{
  "identifier": "customer@example.com",
  "otp": "123456",
  "type": "SIGNUP"
}

// Response
{
  "message": "Signup completed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "customer@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "isEmailVerified": true,
    "profileComplete": false
  },
  "requiresProfileCompletion": false
}
```

#### Google OAuth
```json
// Request
POST /api/auth/google
{
  "googleToken": "google_access_token",
  "name": "Google User",
  "role": "CUSTOMER"
}

// Response
{
  "message": "Google authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "Google User",
    "role": "CUSTOMER",
    "authProvider": "OAUTH_GOOGLE",
    "isEmailVerified": true
  }
}
```

## 🔧 Implementation Details

### 1. OTP Service (`src/services/otp.service.ts`)

```typescript
class OTPService {
  generateOTP(): string                    // Generate 6-digit OTP
  sendOTP(identifier, type, userId?): Promise<boolean>  // Send OTP via email/SMS
  verifyOTP(identifier, otp, type): Promise<boolean>    // Verify OTP
  cleanupExpiredOTPs(): Promise<void>      // Clean up expired OTPs
}
```

### 2. OAuth Service (`src/services/oauth.service.ts`)

```typescript
class OAuthService {
  verifyGoogleToken(token): Promise<GoogleUserInfo>     // Verify Google token
  findOrCreateGoogleUser(info, role): Promise<User>     // Find or create user
  getGoogleAuthUrl(): string                            // Get OAuth URL
  exchangeCodeForToken(code): Promise<string>           // Exchange code for token
}
```

### 3. Auth Service (`src/services/auth.service.ts`)

```typescript
class AuthService {
  signup(data): Promise<OTPResponse>                    // Handle signup
  verifyOTP(data): Promise<AuthResponse>                // Verify OTP
  login(data): Promise<OTPResponse>                     // Handle login
  verifyLoginOTP(data): Promise<AuthResponse>           // Verify login OTP
  oauthGoogle(data): Promise<AuthResponse>              // Handle Google OAuth
  adminLogin(data): Promise<AuthResponse>               // Admin login
}
```

### 4. Updated Middleware (`src/middleware/auth.middleware.ts`)

```typescript
// New middleware functions
authMiddleware()           // Verify JWT token
isCustomer()              // Check if user is customer
isArtisan()               // Check if user is artisan
isAdmin()                 // Check if user is admin
requireVerifiedEmail()    // Require email verification
requireVerifiedPhone()    // Require phone verification
requireProfileComplete()  // Require profile completion
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The test suite covers:
- ✅ Customer signup flow (email/phone)
- ✅ Artisan signup flow
- ✅ OTP verification
- ✅ Login flow
- ✅ Google OAuth (development mode)
- ✅ Admin authentication
- ✅ Token management
- ✅ Error handling
- ✅ Validation

## 🔄 Migration Strategy

### 1. Database Migration

```bash
# Generate migration
npx prisma migrate dev --name auth_refactor

# Apply migration
npx prisma migrate deploy

# Regenerate Prisma client
npx prisma generate
```

### 2. Data Migration (if needed)

```sql
-- Example: Migrate existing users
INSERT INTO users (id, email, phone, name, role, authProvider, isEmailVerified, createdAt, updatedAt)
SELECT 
  id, 
  email, 
  phone, 
  name, 
  CASE WHEN role = 'USER' THEN 'CUSTOMER' ELSE role END,
  'EMAIL',
  true,
  "createdAt",
  "updatedAt"
FROM "User";

-- Migrate existing artisans
INSERT INTO users (id, email, phone, name, role, authProvider, isEmailVerified, createdAt, updatedAt)
SELECT 
  id, 
  email, 
  phone, 
  name, 
  'ARTISAN',
  'EMAIL',
  true,
  "createdAt",
  "updatedAt"
FROM "Artisan";
```

## 🔐 Security Features

### 1. OTP Security
- **6-digit random OTP** (1,000,000 possible combinations)
- **5-minute expiration** prevents replay attacks
- **3-attempt limit** prevents brute force
- **One-time use** OTPs are marked as used after verification

### 2. JWT Security
- **7-day expiration** for access tokens
- **Secure secret** stored in environment variables
- **Role-based claims** for authorization

### 3. Input Validation
- **Email format validation** using regex
- **Phone format validation** for international numbers
- **Role validation** to prevent privilege escalation
- **OTP format validation** (6 digits only)

### 4. Rate Limiting (Recommended)
```typescript
// Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts'
});

app.use('/api/auth', authLimiter);
```

## 🚀 Deployment Checklist

### Environment Variables
```bash
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/db"
JWT_SECRET="your-super-secret-jwt-key"

# Optional (for production)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://yourdomain.com/auth/google/callback"

# Email/SMS services (for production)
SENDGRID_API_KEY="your-sendgrid-key"
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
```

### Production Considerations
1. **Enable HTTPS** for all authentication endpoints
2. **Implement rate limiting** to prevent abuse
3. **Set up proper email/SMS services** (SendGrid, Twilio)
4. **Configure Google OAuth** with production credentials
5. **Set up monitoring** for authentication failures
6. **Implement token blacklisting** for logout
7. **Add audit logging** for security events

## 📈 Performance Optimizations

### 1. Database Indexes
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_google_id ON users("googleId");
CREATE INDEX idx_otp_identifier_type ON otp_verifications(identifier, type);
CREATE INDEX idx_otp_expires_at ON otp_verifications("expiresAt");
```

### 2. Caching Strategy
```typescript
// Cache OTP attempts to prevent database hits
const otpAttempts = new Map<string, number>();

// Cache user sessions
const userSessions = new Map<string, TokenPayload>();
```

### 3. Background Jobs
```typescript
// Clean up expired OTPs every hour
setInterval(async () => {
  await otpService.cleanupExpiredOTPs();
}, 60 * 60 * 1000);
```

## 🔍 Monitoring & Debugging

### 1. Logging
```typescript
// Add structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'auth.log' })
  ]
});
```

### 2. Metrics
```typescript
// Track authentication metrics
const authMetrics = {
  signupAttempts: 0,
  loginAttempts: 0,
  otpVerifications: 0,
  failedAttempts: 0
};
```

## 🎯 Future Enhancements

### 1. Additional OAuth Providers
- Facebook OAuth
- Apple Sign In
- GitHub OAuth

### 2. Advanced Security
- Two-factor authentication (2FA)
- Biometric authentication
- Device fingerprinting

### 3. User Experience
- Remember me functionality
- Social login buttons
- Progressive web app (PWA) support

### 4. Analytics
- User behavior tracking
- Conversion funnel analysis
- A/B testing for authentication flows

## 📚 API Documentation

### Swagger/OpenAPI
```yaml
openapi: 3.0.0
info:
  title: Handyman Authentication API
  version: 2.0.0
  description: OTP-based authentication with OAuth2 support

paths:
  /api/auth/signup:
    post:
      summary: Send OTP for signup
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SignupRequest'
      responses:
        '200':
          description: OTP sent successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OTPResponse'
```

## 🆘 Troubleshooting

### Common Issues

1. **OTP not received**
   - Check email/SMS service configuration
   - Verify identifier format
   - Check spam folder

2. **Database connection errors**
   - Verify DATABASE_URL
   - Check PostgreSQL service status
   - Ensure database exists

3. **JWT token issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate token format

4. **Google OAuth errors**
   - Verify Google credentials
   - Check redirect URI configuration
   - Ensure HTTPS in production

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check Prisma queries
DEBUG=prisma:query npm run dev
```

---

## ✅ Implementation Status

- [x] Database schema refactor
- [x] OTP service implementation
- [x] OAuth service implementation
- [x] Authentication service
- [x] Updated middleware
- [x] New API routes
- [x] Comprehensive tests
- [x] TypeScript types
- [x] Documentation

**The authentication system refactor is complete and ready for deployment!** 🎉 