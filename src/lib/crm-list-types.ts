import type {
    Prisma,
    CompanyType,
    FollowUpType,
    ImportVolume,
    InteractionType,
    TradeRole,
    ValueDriver,
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
    company: {
        businessName: string;
    } | null;
}

export interface CompanyOption {
    id: string;
    businessName: string;
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
}

export interface ProspectingInteractionItem {
    id: string;
    type: InteractionType;
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
