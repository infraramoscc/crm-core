-- CreateEnum
CREATE TYPE "ResearchPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ResearchEffort" AS ENUM ('LIGHT', 'MEDIUM', 'HEAVY');

-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('NEW', 'RESEARCHING', 'SOURCE_FOUND', 'BLOCKED', 'VISIT_REQUIRED');

-- AlterTable
ALTER TABLE "Company"
ADD COLUMN "researchPriority" "ResearchPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "researchEffort" "ResearchEffort" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "researchStatus" "ResearchStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "researchSummary" TEXT,
ADD COLUMN "researchNextAction" TEXT,
ADD COLUMN "researchLastReviewedAt" TIMESTAMP(3);
