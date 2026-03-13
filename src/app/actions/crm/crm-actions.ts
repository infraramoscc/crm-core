"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { OpportunityFrequency, OpportunityServiceLine, OpportunityStage, ShipmentMode, ValueDriver } from "@prisma/client";
import type {
    OpportunityCompanyOption,
    OpportunityContactOption,
    OpportunityDetail,
    OpportunityPipelineItem,
    OpportunityUpsertInput,
} from "@/lib/crm-list-types";

function normalizeOptionalText(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function normalizeOptionalDate(value?: string) {
    return value ? new Date(value) : null;
}

function buildOpportunityData(data: OpportunityUpsertInput) {
    return {
        companyId: data.companyId,
        contactId: data.contactId || null,
        title: data.title.trim(),
        stage: data.stage || "PROSPECTING",
        serviceLine: (data.serviceLine || "FORWARDING") as OpportunityServiceLine,
        shipmentMode: (data.shipmentMode || "SEA") as ShipmentMode,
        operationFrequency: (data.operationFrequency || "SPOT") as OpportunityFrequency,
        decisionDriver: (data.decisionDriver || "UNKNOWN") as ValueDriver,
        originLabel: normalizeOptionalText(data.originLabel),
        destinationLabel: normalizeOptionalText(data.destinationLabel),
        incotermCode: normalizeOptionalText(data.incotermCode),
        competitorName: normalizeOptionalText(data.competitorName),
        nextStep: normalizeOptionalText(data.nextStep),
        nextStepDate: normalizeOptionalDate(data.nextStepDate),
        externalQuoteRef: normalizeOptionalText(data.externalQuoteRef),
        externalQuoteIssuedAt: normalizeOptionalDate(data.externalQuoteIssuedAt),
        expectedValue: data.expectedValue ?? null,
        expectedCurrency: data.expectedCurrency || "USD",
        closeDate: normalizeOptionalDate(data.closeDate),
    };
}

function revalidateOpportunityPaths(id?: string) {
    revalidatePath("/crm");
    revalidatePath("/crm/opportunities/new");
    if (id) {
        revalidatePath(`/crm/opportunities/${id}`);
    }
}

export async function getPipelineOpportunities() {
    try {
        const opps: OpportunityPipelineItem[] = await prisma.opportunity.findMany({
            include: {
                company: {
                    select: {
                        businessName: true,
                        contacts: {
                            where: { isActive: true },
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                            orderBy: [
                                { firstName: "asc" },
                                { lastName: "asc" },
                            ],
                        },
                    },
                },
                contact: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: [
                { nextStepDate: "asc" },
                { closeDate: "asc" },
                { createdAt: "desc" },
            ],
        });
        return { success: true, data: opps };
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        return { success: false, error: "Failed to fetch opportunities", data: [] };
    }
}

export async function getOpportunityById(id: string) {
    try {
        const opportunity: OpportunityDetail | null = await prisma.opportunity.findUnique({
            where: { id },
            include: {
                company: {
                    select: {
                        id: true,
                        businessName: true,
                    },
                },
                contact: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        companyId: true,
                    },
                },
            },
        });

        if (!opportunity) {
            return { success: false, error: "Opportunity not found" };
        }

        return { success: true, data: opportunity };
    } catch (error) {
        console.error("Error fetching opportunity by id:", error);
        return { success: false, error: "Failed to fetch opportunity" };
    }
}

export async function getOpportunityFormOptions() {
    try {
        const [companies, contacts] = await Promise.all([
            prisma.company.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    businessName: true,
                },
                orderBy: { businessName: "asc" },
            }),
            prisma.contact.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    companyId: true,
                    firstName: true,
                    lastName: true,
                },
                orderBy: [
                    { firstName: "asc" },
                    { lastName: "asc" },
                ],
            }),
        ]);

        return {
            success: true,
            data: {
                companies: companies as OpportunityCompanyOption[],
                contacts: contacts as OpportunityContactOption[],
            },
        };
    } catch (error) {
        console.error("Error fetching opportunity form options:", error);
        return {
            success: false,
            error: "Failed to fetch opportunity form options",
            data: { companies: [], contacts: [] },
        };
    }
}

export async function createOpportunity(data: OpportunityUpsertInput) {
    try {
        if (!data.title.trim()) {
            return { success: false, error: "Opportunity title is required" };
        }

        if (data.stage === "NEGOTIATING" && !normalizeOptionalText(data.externalQuoteRef ?? "")) {
            return { success: false, error: "Negotiation requires an external quote reference" };
        }

        const opportunity = await prisma.opportunity.create({
            data: buildOpportunityData(data),
        });

        revalidateOpportunityPaths(opportunity.id);
        return { success: true, data: opportunity };
    } catch (error) {
        console.error("Error creating opportunity:", error);
        return { success: false, error: "Failed to create opportunity" };
    }
}

export async function updateOpportunity(id: string, data: OpportunityUpsertInput) {
    try {
        if (!data.title.trim()) {
            return { success: false, error: "Opportunity title is required" };
        }

        if (data.stage === "NEGOTIATING" && !normalizeOptionalText(data.externalQuoteRef ?? "")) {
            return { success: false, error: "Negotiation requires an external quote reference" };
        }

        const opportunity = await prisma.opportunity.update({
            where: { id },
            data: buildOpportunityData(data),
        });

        revalidateOpportunityPaths(id);
        return { success: true, data: opportunity };
    } catch (error) {
        console.error("Error updating opportunity:", error);
        return { success: false, error: "Failed to update opportunity" };
    }
}

export async function moveOpportunityStage(oppId: string, newStage: OpportunityStage) {
    try {
        const current = await prisma.opportunity.findUnique({
            where: { id: oppId },
            select: {
                externalQuoteRef: true,
            },
        });

        if (!current) {
            return { success: false, error: "Opportunity not found" };
        }

        if (newStage === "NEGOTIATING" && !current.externalQuoteRef) {
            return {
                success: false,
                error: "Antes de negociar debes registrar la referencia de la cotizacion enviada.",
            };
        }

        const updated = await prisma.opportunity.update({
            where: { id: oppId },
            data: {
                stage: newStage,
                lossReason: newStage === "LOST" ? undefined : null,
            },
        });

        revalidateOpportunityPaths(oppId);
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error moving opportunity:", error);
        return { success: false, error: "Failed to move opportunity" };
    }
}

export async function loseOpportunity(oppId: string, reason: string) {
    try {
        const updated = await prisma.opportunity.update({
            where: { id: oppId },
            data: {
                stage: "LOST",
                lossReason: reason,
            },
        });

        revalidateOpportunityPaths(oppId);
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error losing opportunity:", error);
        return { success: false, error: "Failed to register loss" };
    }
}
