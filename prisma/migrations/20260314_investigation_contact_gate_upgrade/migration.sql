-- AlterEnum
ALTER TYPE "ResearchStatus" ADD VALUE IF NOT EXISTS 'CONTACT_PENDING_VALIDATION';

-- AlterEnum
ALTER TYPE "ResearchStatus" ADD VALUE IF NOT EXISTS 'ESCALATE_LATER';

-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "ResearchSourceChannel" AS ENUM (
        'WEB',
        'LINKEDIN',
        'CENTRAL_CALL',
        'VISIT',
        'INTERNAL_REFERRAL',
        'DIRECTORY',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS "researchSourceChannel" "ResearchSourceChannel",
ADD COLUMN IF NOT EXISTS "researchLastFinding" TEXT;

-- AlterTable
ALTER TABLE "Contact"
ADD COLUMN IF NOT EXISTS "sourceChannel" "ResearchSourceChannel";
