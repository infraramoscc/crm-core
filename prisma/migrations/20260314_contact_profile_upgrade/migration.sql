CREATE TYPE "RelationshipStrength" AS ENUM ('COLD', 'WARM', 'TRUSTED', 'ADVOCATE');
CREATE TYPE "PreferredContactChannel" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'LINKEDIN', 'IN_PERSON');
CREATE TYPE "PreferredContactWindow" AS ENUM ('EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'FLEXIBLE');
CREATE TYPE "DecisionStyle" AS ENUM ('ANALYTICAL', 'DIRECT', 'RELATIONAL', 'CAUTIOUS', 'POLITICAL');

CREATE TABLE "ContactProfile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "primaryEmail" TEXT,
    "linkedin" TEXT,
    "birthday" TIMESTAMP(3),
    "anniversary" TIMESTAMP(3),
    "interests" TEXT,
    "notes" TEXT,
    "relationshipStrength" "RelationshipStrength" NOT NULL DEFAULT 'COLD',
    "preferredContactChannel" "PreferredContactChannel",
    "preferredContactWindow" "PreferredContactWindow",
    "decisionStyle" "DecisionStyle",
    "primaryDriver" "ValueDriver" NOT NULL DEFAULT 'UNKNOWN',
    "typicalObjection" TEXT,
    "giftPreferences" TEXT,
    "doNotGift" TEXT,
    "visitNotes" TEXT,
    "lastMeaningfulInteractionAt" TIMESTAMP(3),
    "nextPersonalTouchAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContactProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Contact" ADD COLUMN "profileId" TEXT;

ALTER TABLE "Contact"
ADD CONSTRAINT "Contact_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "ContactProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
