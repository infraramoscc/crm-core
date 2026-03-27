-- Speed up CRM list, dashboard, and timeline queries with indexes aligned to
-- the main Prisma access patterns.

CREATE INDEX "Company_prospectingStatus_annualDams_createdAt_idx"
ON "Company" ("prospectingStatus", "annualDams", "createdAt");

CREATE INDEX "Company_researchStatus_createdAt_idx"
ON "Company" ("researchStatus", "createdAt");

CREATE INDEX "Contact_companyId_isActive_idx"
ON "Contact" ("companyId", "isActive");

CREATE INDEX "Contact_companyId_commercialStatus_idx"
ON "Contact" ("companyId", "commercialStatus");

CREATE INDEX "Contact_profileId_idx"
ON "Contact" ("profileId");

CREATE INDEX "Interaction_companyId_interactedAt_idx"
ON "Interaction" ("companyId", "interactedAt");

CREATE INDEX "Interaction_companyId_isFollowUpCompleted_nextFollowUpDate_idx"
ON "Interaction" ("companyId", "isFollowUpCompleted", "nextFollowUpDate");

CREATE INDEX "Interaction_contactId_idx"
ON "Interaction" ("contactId");

CREATE INDEX "Interaction_opportunityId_idx"
ON "Interaction" ("opportunityId");

CREATE INDEX "Interaction_outcome_interactedAt_idx"
ON "Interaction" ("outcome", "interactedAt");

CREATE INDEX "Opportunity_companyId_stage_idx"
ON "Opportunity" ("companyId", "stage");

CREATE INDEX "Opportunity_contactId_idx"
ON "Opportunity" ("contactId");

CREATE INDEX "Opportunity_stage_updatedAt_idx"
ON "Opportunity" ("stage", "updatedAt");

CREATE INDEX "Opportunity_stage_externalQuoteRef_idx"
ON "Opportunity" ("stage", "externalQuoteRef");

CREATE INDEX "Quote_opportunityId_idx"
ON "Quote" ("opportunityId");

CREATE INDEX "QuoteItem_quoteId_idx"
ON "QuoteItem" ("quoteId");

CREATE INDEX "QuoteItem_serviceId_idx"
ON "QuoteItem" ("serviceId");
