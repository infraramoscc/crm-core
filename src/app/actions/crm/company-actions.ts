"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type {
    CompanyType,
    ImportVolume,
    InteractionDirection,
    InteractionPurpose,
    InteractionStageContext,
    InteractionType,
    ProspectingStatus,
    ResearchEffort,
    ResearchPriority,
    ResearchSourceChannel,
    ResearchStatus,
    TradeRole,
    ValueDriver,
} from "@prisma/client";
import type { CompanyDetail, CompanyUpdateInput } from "@/lib/crm-list-types";
import { buildCommercialOpinionNote } from "@/lib/crm-interaction-labels";

function hasAnyActiveContact(contact: { isActive: boolean }) {
    return contact.isActive;
}

export async function createCompany(data: {
    documentNumber: string;
    documentType: string;
    businessName: string;
    tradeName?: string;
    website?: string;
    companyType?: CompanyType;
    tradeRole?: TradeRole;
    isActive?: boolean;
    annualDams?: number;
    dominantIncoterm?: string;
    dominantCustomsChannel?: string;
    prospectingStatus?: ProspectingStatus;
    legalRepresentative?: string;
    importVolume?: ImportVolume;
    valueDriver?: ValueDriver;
    strategyTags?: string;
}) {
    try {
        const company = await prisma.company.create({
            data: {
                documentNumber: data.documentNumber,
                documentType: data.documentType || "RUC",
                businessName: data.businessName,
                tradeName: data.tradeName,
                website: data.website || null,
                companyType: data.companyType || "CLIENT",
                tradeRole: data.tradeRole || "NONE",
                isActive: data.isActive ?? true,
                annualDams: data.annualDams || null,
                dominantIncoterm: data.dominantIncoterm || null,
                dominantCustomsChannel: data.dominantCustomsChannel || null,
                prospectingStatus: data.prospectingStatus || "COLD",
                legalRepresentative: data.legalRepresentative || null,
                importVolume: data.importVolume || "NEW",
                valueDriver: data.valueDriver || "UNKNOWN",
                strategyTags: data.strategyTags || null,
            }
        });

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
        revalidatePath("/companies");
        revalidatePath("/contacts", "layout");
        return { success: true, data: company };
    } catch (error) {
        console.error("Error creating company:", error);
        return { success: false, error: "Failed to create company" };
    }
}

export async function upsertCompanyFromImport(data: {
    documentNumber: string;
    documentType?: string;
    businessName: string;
    tradeName?: string;
    website?: string;
    companyType?: CompanyType;
    isActive?: boolean;
    annualDams?: number;
    dominantIncoterm?: string;
    dominantCustomsChannel?: string;
    prospectingStatus?: ProspectingStatus;
    legalRepresentative?: string;
    tradeRole?: TradeRole;
    importVolume?: ImportVolume;
    valueDriver?: ValueDriver;
    strategyTags?: string;
}) {
    try {
        const company = await prisma.company.upsert({
            where: {
                documentNumber: data.documentNumber,
            },
            update: {
                businessName: data.businessName,
                ...(data.tradeName && { tradeName: data.tradeName }),
                ...(data.website && { website: data.website }),
                ...(data.annualDams && { annualDams: data.annualDams }),
                ...(data.dominantIncoterm && { dominantIncoterm: data.dominantIncoterm }),
                ...(data.dominantCustomsChannel && { dominantCustomsChannel: data.dominantCustomsChannel }),
                ...(data.legalRepresentative && { legalRepresentative: data.legalRepresentative }),
                ...(data.tradeRole && { tradeRole: data.tradeRole }),
                ...(data.importVolume && { importVolume: data.importVolume }),
                ...(data.valueDriver && { valueDriver: data.valueDriver }),
                ...(data.strategyTags && { strategyTags: data.strategyTags }),
            },
            create: {
                documentNumber: data.documentNumber,
                documentType: data.documentType || "RUC",
                businessName: data.businessName,
                tradeName: data.tradeName,
                website: data.website || null,
                companyType: data.companyType || "CLIENT",
                tradeRole: data.tradeRole || "NONE",
                isActive: data.isActive ?? true,
                annualDams: data.annualDams || null,
                dominantIncoterm: data.dominantIncoterm || null,
                dominantCustomsChannel: data.dominantCustomsChannel || null,
                prospectingStatus: data.prospectingStatus || "COLD",
                legalRepresentative: data.legalRepresentative || null,
                importVolume: data.importVolume || "NEW",
                valueDriver: data.valueDriver || "UNKNOWN",
                strategyTags: data.strategyTags || null,
            }
        });

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
        revalidatePath("/companies");
        revalidatePath("/contacts", "layout");
        return { success: true, data: company };
    } catch (error) {
        console.error("Error upserting company from import:", error);
        return { success: false, error: "Failed to upsert company" };
    }
}

export async function getCompaniesByStatus(statuses: ProspectingStatus[]) {
    try {
        const companies = await prisma.company.findMany({
            where: {
                prospectingStatus: {
                    in: statuses
                }
            },
            select: {
                id: true,
                documentNumber: true,
                businessName: true,
                website: true,
                tradeRole: true,
                annualDams: true,
                dominantIncoterm: true,
                dominantCustomsChannel: true,
                researchPriority: true,
                researchEffort: true,
                researchStatus: true,
                researchSourceChannel: true,
                researchLastFinding: true,
                researchSummary: true,
                researchNextAction: true,
                researchLastReviewedAt: true,
                importVolume: true,
                valueDriver: true,
                leadScore: true,
                contacts: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        isActive: true,
                        position: true,
                        phones: true,
                        emails: true,
                        linkedin: true,
                        commercialStatus: true,
                        buyingRole: true,
                        sourceChannel: true,
                        lastValidatedAt: true,
                    }
                },
                interactions: {
                    orderBy: { interactedAt: "desc" },
                    select: {
                        id: true,
                        type: true,
                        stageContext: true,
                        direction: true,
                        purpose: true,
                        outcome: true,
                        interactedAt: true,
                        scoreImpact: true,
                        notes: true,
                        nextFollowUpDate: true,
                        isFollowUpCompleted: true,
                        contactId: true,
                        contact: { select: { firstName: true, lastName: true } }
                    }
                },
                opportunities: {
                    select: { id: true }
                }
            },
            orderBy: [
                { annualDams: "desc" },
                { createdAt: "desc" }
            ]
        });

        const readyCompanies = companies.filter((company) =>
            company.contacts.some((contact) => hasAnyActiveContact(contact))
        );

        return { success: true, data: readyCompanies };
    } catch (error) {
        console.error("Error fetching companies:", error);
        return { success: false, error: "Failed to fetch companies", data: [] };
    }
}

export async function getCompaniesForInvestigation() {
    try {
        const companies = await prisma.company.findMany({
            where: {
                prospectingStatus: {
                    in: ["COLD", "PROSPECTING"]
                },
                opportunities: { none: {} },
            },
            select: {
                id: true,
                businessName: true,
                website: true,
                documentType: true,
                documentNumber: true,
                annualDams: true,
                dominantIncoterm: true,
                dominantCustomsChannel: true,
                researchPriority: true,
                researchEffort: true,
                researchStatus: true,
                researchSourceChannel: true,
                researchLastFinding: true,
                researchSummary: true,
                researchNextAction: true,
                researchLastReviewedAt: true,
                createdAt: true,
                contacts: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true,
                        emails: true,
                        phones: true,
                        linkedin: true,
                        buyingRole: true,
                        sourceChannel: true,
                        isActive: true,
                        inactiveReason: true
                    }
                }
            },
            orderBy: [
                { annualDams: "desc" },
                { createdAt: "desc" }
            ]
        });

        const investigationQueue = companies.filter((company) =>
            !company.contacts.some((contact) => hasAnyActiveContact(contact))
        );

        return { success: true, data: investigationQueue };
    } catch (error) {
        console.error("Error fetching investigation companies:", error);
        return { success: false, error: "Failed to fetch investigation companies", data: [] };
    }
}

export async function updateCompanyStatus(
    companyId: string,
    status: ProspectingStatus,
    reason?: string,
    driver?: ValueDriver,
    score?: number
) {
    try {
        const updateData: {
            prospectingStatus: ProspectingStatus;
            disqualificationReason?: string;
            valueDriver?: ValueDriver;
            leadScore?: number;
        } = {
            prospectingStatus: status
        };

        if (reason !== undefined) updateData.disqualificationReason = reason;
        if (driver !== undefined) updateData.valueDriver = driver;
        if (score !== undefined) updateData.leadScore = score;

        const company = await prisma.company.update({
            where: { id: companyId },
            data: updateData
        });

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
        return { success: true, data: company };
    } catch (error) {
        console.error("Error updating company status:", error);
        return { success: false, error: "Failed to update company status" };
    }
}

export async function updateInvestigationOpinion(data: {
    companyId: string;
    stageContext?: InteractionStageContext;
    researchPriority: ResearchPriority;
    researchEffort: ResearchEffort;
    researchStatus: ResearchStatus;
    researchSourceChannel?: ResearchSourceChannel;
    researchLastFinding?: string;
    researchSummary?: string;
    researchNextAction?: string;
}) {
    try {
        const stageContext: InteractionStageContext = data.stageContext || "INVESTIGATION";
        const note = buildCommercialOpinionNote(data);

        const { company, interaction } = await prisma.$transaction(async (tx) => {
            const company = await tx.company.update({
                where: { id: data.companyId },
                data: {
                    researchPriority: data.researchPriority,
                    researchEffort: data.researchEffort,
                    researchStatus: data.researchStatus,
                    researchSourceChannel: data.researchSourceChannel || null,
                    researchLastFinding: data.researchLastFinding || null,
                    researchSummary: data.researchSummary || null,
                    researchNextAction: data.researchNextAction || null,
                    researchLastReviewedAt: new Date(),
                },
                select: {
                    id: true,
                    researchPriority: true,
                    researchEffort: true,
                    researchStatus: true,
                    researchSourceChannel: true,
                    researchLastFinding: true,
                    researchSummary: true,
                    researchNextAction: true,
                    researchLastReviewedAt: true,
                },
            });

            const interaction = note
                ? await tx.interaction.create({
                    data: {
                        companyId: data.companyId,
                        type: "SYSTEM_NOTE" as InteractionType,
                        stageContext,
                        direction: "INTERNAL" as InteractionDirection,
                        purpose: (stageContext === "INVESTIGATION" ? "RESEARCH" : "DISCOVERY") as InteractionPurpose,
                        notes: note,
                        scoreImpact: 0,
                        interactedAt: new Date(),
                        isFollowUpCompleted: true,
                    },
                    select: {
                        id: true,
                        type: true,
                        stageContext: true,
                        direction: true,
                        purpose: true,
                        outcome: true,
                        interactedAt: true,
                        scoreImpact: true,
                        notes: true,
                        nextFollowUpDate: true,
                        isFollowUpCompleted: true,
                        contactId: true,
                        followUpType: true,
                    },
                })
                : null;

            return { company, interaction };
        });

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
        revalidatePath(`/companies/${data.companyId}`);
        return { success: true, data: { ...company, interaction } };
    } catch (error) {
        console.error("Error updating investigation opinion:", error);
        return { success: false, error: "Failed to update investigation opinion" };
    }
}

export async function getAllCompanies() {
    try {
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                businessName: true,
                tradeName: true,
                documentType: true,
                documentNumber: true,
                companyType: true,
                tradeRole: true,
                website: true,
                city: true,
                countryCode: true,
                isActive: true,
                prospectingStatus: true,
                dominantIncoterm: true,
                dominantCustomsChannel: true,
                researchLastReviewedAt: true,
                createdAt: true,
                contacts: {
                    select: {
                        id: true,
                        isActive: true,
                    },
                },
                opportunities: {
                    select: {
                        id: true,
                    },
                },
                interactions: {
                    orderBy: {
                        interactedAt: "desc",
                    },
                    take: 1,
                    select: {
                        id: true,
                        interactedAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" }
        });
        return { success: true, data: companies };
    } catch (error) {
        console.error("Error fetching all companies:", error);
        return { success: false, error: "Failed to fetch companies", data: [] };
    }
}

export async function getCompanyById(id: string) {
    try {
        const company: CompanyDetail | null = await prisma.company.findUnique({
            where: { id },
            include: {
                contacts: true,
                interactions: {
                    include: {
                        contact: {
                            select: { firstName: true, lastName: true }
                        }
                    },
                    orderBy: { interactedAt: "desc" }
                }
            }
        });
        if (!company) {
            return { success: false, error: "Company not found" };
        }
        return { success: true, data: company };
    } catch (error) {
        console.error("Error fetching company by id:", error);
        return { success: false, error: "Failed to fetch company" };
    }
}

export async function updateCompany(id: string, data: CompanyUpdateInput) {
    try {
        const company = await prisma.company.update({
            where: { id },
            data: {
                documentNumber: data.documentNumber,
                documentType: data.documentType,
                businessName: data.businessName,
                tradeName: data.tradeName,
                website: data.website,
                companyType: data.companyType,
                tradeRole: data.tradeRole,
                isActive: data.isActive,
                annualDams: data.annualDams,
                dominantIncoterm: data.dominantIncoterm,
                dominantCustomsChannel: data.dominantCustomsChannel,
                importVolume: data.importVolume,
                valueDriver: data.valueDriver,
                strategyTags: data.strategyTags,
                researchPriority: data.researchPriority,
                researchEffort: data.researchEffort,
                researchStatus: data.researchStatus,
                researchSourceChannel: data.researchSourceChannel,
                researchLastFinding: data.researchLastFinding,
                researchSummary: data.researchSummary,
                researchNextAction: data.researchNextAction,
                researchLastReviewedAt: data.researchLastReviewedAt ? new Date(data.researchLastReviewedAt) : undefined,
                prospectingStatus: data.prospectingStatus,
                legalRepresentative: data.legalRepresentative,
                address: data.address,
                city: data.city,
                countryCode: data.countryCode,
            }
        });

        revalidatePath(`/companies/${id}`);
        revalidatePath("/companies");
        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
        revalidatePath("/contacts", "layout");
        return { success: true, data: company };
    } catch (error) {
        console.error("Error updating company:", error);
        return { success: false, error: "Failed to update company" };
    }
}
