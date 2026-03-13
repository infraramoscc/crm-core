import type {
    Prisma,
    CompanyType,
    ContactBuyingRole,
    ContactCommercialStatus,
    OpportunityServiceLine,
    ShipmentMode,
    OpportunityFrequency,
    FollowUpType,
    ImportVolume,
    InteractionOutcome,
    InteractionType,
    TradeRole,
    ValueDriver,
    OpportunityStage,
} from "@prisma/client";

export interface CompanyListItem {
    id: string;
    businessName: string;
    tradeName: string | null;
    documentType: string;
    documentNumber: string;
    companyType: CompanyType;
    city: string | null;
    countryCode: string | null;
    isActive: boolean;
}

export interface ContactListItem {
    id: string;
    firstName: string;
    lastName: string;
    companyId: string;
    position: string | null;
    emails: string[];
    phones: string[];
    isActive: boolean;
    commercialStatus: ContactCommercialStatus;
    buyingRole: ContactBuyingRole;
    company: {
        businessName: string;
    } | null;
}

export interface CompanyOption {
    id: string;
    businessName: string;
}

export interface OpportunityCompanyOption {
    id: string;
    businessName: string;
}

export interface OpportunityContactOption {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
}

export interface InvestigationContactItem {
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    inactiveReason: string | null;
}

export interface InvestigationCompanyItem {
    id: string;
    businessName: string;
    documentType: string;
    documentNumber: string;
    annualDams: number | null;
    contacts: InvestigationContactItem[];
}

export interface ProspectingContactItem {
    id: string;
    firstName: string;
    lastName: string;
    phones: string[];
    emails: string[];
    linkedin: string | null;
    commercialStatus: ContactCommercialStatus;
    buyingRole: ContactBuyingRole;
    lastValidatedAt: Date | null;
}

export interface ProspectingInteractionItem {
    id: string;
    type: InteractionType;
    outcome: InteractionOutcome | null;
    interactedAt: Date;
    scoreImpact: number;
    notes: string | null;
    nextFollowUpDate: Date | null;
    isFollowUpCompleted: boolean;
    contactId?: string | null;
    followUpType?: FollowUpType | null;
    contact: {
        firstName: string;
        lastName: string;
    } | null;
}

export interface ProspectingCompanyItem {
    id: string;
    documentNumber: string;
    businessName: string;
    tradeRole: TradeRole;
    annualDams: number | null;
    importVolume: ImportVolume;
    valueDriver: ValueDriver;
    leadScore: number;
    contacts: ProspectingContactItem[];
    interactions: ProspectingInteractionItem[];
    opportunities: { id: string }[];
}

export interface ProspectingCompanyView {
    company: ProspectingCompanyItem;
    lastInteraction: ProspectingInteractionItem | null;
    nextTask: ProspectingInteractionItem | null;
    allInteractions: ProspectingInteractionItem[];
    nextTaskFormattedDate: string | null;
    category: "new" | "today" | "future" | "inactive";
}

export interface CompanyUpdateInput {
    documentNumber?: string;
    documentType?: string;
    businessName?: string;
    tradeName?: string;
    website?: string;
    companyType?: CompanyType;
    tradeRole?: TradeRole;
    isActive?: boolean;
    annualDams?: number;
    importVolume?: ImportVolume;
    valueDriver?: ValueDriver;
    strategyTags?: string;
    prospectingStatus?: "COLD" | "PROSPECTING" | "QUALIFIED" | "CUSTOMER" | "DISQUALIFIED";
    legalRepresentative?: string;
    address?: string;
    city?: string;
    countryCode?: string;
}

export type CompanyDetail = Prisma.CompanyGetPayload<{
    include: {
        contacts: true;
        interactions: {
            include: {
                contact: {
                    select: {
                        firstName: true;
                        lastName: true;
                    };
                };
            };
            orderBy: {
                interactedAt: "desc";
            };
        };
    };
}>;

export type ContactDetail = Prisma.ContactGetPayload<{
    include: {
        company: {
            select: {
                id: true;
                businessName: true;
            };
        };
    };
}>;

export type OpportunityPipelineItem = Prisma.OpportunityGetPayload<{
    include: {
        company: {
            select: {
                businessName: true;
                contacts: {
                    where: {
                        isActive: true;
                    };
                    select: {
                        id: true;
                        firstName: true;
                        lastName: true;
                    };
                };
            };
        };
        contact: {
            select: {
                id: true;
                firstName: true;
                lastName: true;
            };
        };
    };
}>;

export type OpportunityDetail = Prisma.OpportunityGetPayload<{
    include: {
        company: {
            select: {
                id: true;
                businessName: true;
            };
        };
        contact: {
            select: {
                id: true;
                firstName: true;
                lastName: true;
                companyId: true;
            };
        };
    };
}>;

export interface OpportunityUpsertInput {
    companyId: string;
    contactId?: string;
    title: string;
    stage?: OpportunityStage;
    serviceLine?: OpportunityServiceLine;
    shipmentMode?: ShipmentMode;
    operationFrequency?: OpportunityFrequency;
    decisionDriver?: ValueDriver;
    originLabel?: string;
    destinationLabel?: string;
    incotermCode?: string;
    competitorName?: string;
    nextStep?: string;
    nextStepDate?: string;
    externalQuoteRef?: string;
    externalQuoteIssuedAt?: string;
    expectedValue?: number;
    expectedCurrency?: string;
    closeDate?: string;
}
