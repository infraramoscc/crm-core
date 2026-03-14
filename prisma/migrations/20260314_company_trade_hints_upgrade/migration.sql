-- AlterTable
ALTER TABLE "Company"
ADD COLUMN IF NOT EXISTS "dominantIncoterm" TEXT,
ADD COLUMN IF NOT EXISTS "dominantCustomsChannel" TEXT;
