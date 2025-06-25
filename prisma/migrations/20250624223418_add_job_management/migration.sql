-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "artisan_service_categories" ADD COLUMN     "specializationLevel" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "artisans" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "serviceRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 10.0;

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "preferredTime" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "assignedArtisanId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_matching_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "specializationLevel" INTEGER NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_matching_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assignedArtisanId_fkey" FOREIGN KEY ("assignedArtisanId") REFERENCES "artisans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matching_logs" ADD CONSTRAINT "job_matching_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matching_logs" ADD CONSTRAINT "job_matching_logs_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "artisans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
