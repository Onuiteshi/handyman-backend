-- Migration: Add address fields and make name optional
-- This migration updates the User table to support the new authentication flow

-- Make name optional (nullable)
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;

-- Add address fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

