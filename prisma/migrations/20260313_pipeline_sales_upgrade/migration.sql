CREATE TYPE "OpportunityServiceLine" AS ENUM ('FORWARDING', 'CUSTOMS', 'INLAND', 'INTEGRAL', 'WAREHOUSE', 'OTHER');
CREATE TYPE "ShipmentMode" AS ENUM ('SEA', 'AIR', 'LAND', 'MULTIMODAL');
CREATE TYPE "OpportunityFrequency" AS ENUM ('SPOT', 'RECURRENT', 'TENDER');

ALTER TABLE "Opportunity"
ADD COLUMN "contactId" TEXT,
ADD COLUMN "serviceLine" "OpportunityServiceLine" NOT NULL DEFAULT 'FORWARDING',
ADD COLUMN "shipmentMode" "ShipmentMode" NOT NULL DEFAULT 'SEA',
ADD COLUMN "operationFrequency" "OpportunityFrequency" NOT NULL DEFAULT 'SPOT',
ADD COLUMN "decisionDriver" "ValueDriver" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "originLabel" TEXT,
ADD COLUMN "destinationLabel" TEXT,
ADD COLUMN "incotermCode" TEXT,
ADD COLUMN "competitorName" TEXT,
ADD COLUMN "nextStep" TEXT,
ADD COLUMN "nextStepDate" TIMESTAMP(3),
ADD COLUMN "externalQuoteRef" TEXT,
ADD COLUMN "externalQuoteIssuedAt" TIMESTAMP(3);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_contactId_fkey"
FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "Opportunity_contactId_idx" ON "Opportunity"("contactId");
