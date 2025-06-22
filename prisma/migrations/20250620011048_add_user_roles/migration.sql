-- CreateEnum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ARTISAN', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable (only if the table exists)
DO $$ BEGIN
    ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN duplicate_column THEN null;
END $$;
