-- Migration: Auth System Refactor
-- This migration implements the new unified authentication system with OTP and OAuth2

-- Create new enums
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ARTISAN', 'ADMIN');
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'PHONE', 'OAUTH_GOOGLE');
CREATE TYPE "OTPType" AS ENUM ('SIGNUP', 'LOGIN', 'VERIFICATION');

-- Create new tables
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "googleId" TEXT,
    "avatar" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "artisans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skills" TEXT[] NOT NULL,
    "experience" INTEGER NOT NULL,
    "portfolio" TEXT[] NOT NULL,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "photoUrl" TEXT,
    "idDocumentUrl" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "locationTracking" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastSeen" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artisans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "type" "OTPType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE UNIQUE INDEX "customers_userId_key" ON "customers"("userId");
CREATE UNIQUE INDEX "artisans_userId_key" ON "artisans"("userId");

-- Create foreign key constraints
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artisans" ADD CONSTRAINT "artisans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data (if any)
-- Note: This assumes existing User and Artisan tables exist
-- You may need to adjust this based on your current data structure

-- Drop old tables (if they exist)
-- DROP TABLE IF EXISTS "Profile" CASCADE;
-- DROP TABLE IF EXISTS "Artisan" CASCADE;
-- DROP TABLE IF EXISTS "User" CASCADE;

-- Drop old enums (if they exist)
-- DROP TYPE IF EXISTS "UserRole_old" CASCADE; 