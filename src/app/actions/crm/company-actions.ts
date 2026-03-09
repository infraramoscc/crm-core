"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { CompanyType, ProspectingStatus, ValueDriver } from "@prisma/client";

export async function createCompany(data: {
    documentNumber: string;
    documentType?: string;
    businessName: string;
    tradeName?: string;
    website?: string;
    companyType?: CompanyType;
    isActive?: boolean;
    annualDams?: number;
    prospectingStatus?: ProspectingStatus;
    legalRepresentative?: string;
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
                isActive: data.isActive ?? true,
                annualDams: data.annualDams || null,
                prospectingStatus: data.prospectingStatus || "COLD",
                legalRepresentative: data.legalRepresentative || null,
            }
        });

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
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
    prospectingStatus?: ProspectingStatus;
    legalRepresentative?: string;
}) {
    try {
        const company = await prisma.company.upsert({
            where: {
                documentNumber: data.documentNumber,
            },
            update: {
                // Actualizamos nombre, etc. Cuidado de no sobreescribir con nulos si ya existen
                businessName: data.businessName,
                ...(data.tradeName && { tradeName: data.tradeName }),
                ...(data.website && { website: data.website }),
                ...(data.annualDams && { annualDams: data.annualDams }),
                ...(data.legalRepresentative && { legalRepresentative: data.legalRepresentative }),
            },
            create: {
                documentNumber: data.documentNumber,
                documentType: data.documentType || "RUC",
                businessName: data.businessName,
                tradeName: data.tradeName,
                website: data.website || null,
                companyType: data.companyType || "CLIENT",
                isActive: data.isActive ?? true,
                annualDams: data.annualDams || null,
                prospectingStatus: data.prospectingStatus || "COLD",
                legalRepresentative: data.legalRepresentative || null,
            }
        });

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
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
            include: {
                contacts: true,
                interactions: {
                    orderBy: { interactedAt: 'desc' },
                    include: {
                        contact: { select: { firstName: true, lastName: true } }
                    }
                },
                opportunities: {
                    select: { id: true, title: true, stage: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, data: companies };
    } catch (error) {
        console.error("Error fetching companies:", error);
        return { success: false, error: "Failed to fetch companies", data: [] };
    }
}

// NUEVA FUNCIÓN OPTIMIZADA (Ahorro de recursos en Supabase/Vercel)
export async function getCompaniesForInvestigation() {
    try {
        const companies = await prisma.company.findMany({
            where: {
                prospectingStatus: "COLD",
                opportunities: { none: {} }, // Que no tenga negocios abiertos
                OR: [
                    { contacts: { none: {} } }, // Que no tenga NINGÚN contacto
                    { contacts: { every: { isActive: false } } } // O que TODOS sus contactos estén inactivos
                ]
            },
            select: {
                // Solo traemos lo que la UI de Investigación necesita, ahorrando KBs
                id: true,
                businessName: true,
                documentType: true,
                documentNumber: true,
                annualDams: true,
                contacts: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        isActive: true,
                        inactiveReason: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, data: companies };
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
        const updateData: any = {
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

export async function getAllCompanies() {
    try {
        const companies = await prisma.company.findMany({
            include: {
                contacts: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: companies };
    } catch (error) {
        console.error("Error fetching all companies:", error);
        return { success: false, error: "Failed to fetch companies", data: [] };
    }
}

export async function getCompanyById(id: string) {
    try {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                contacts: true,
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

export async function updateCompany(id: string, data: {
    documentNumber?: string;
    documentType?: string;
    businessName?: string;
    tradeName?: string;
    website?: string;
    companyType?: CompanyType;
    isActive?: boolean;
    annualDams?: number;
    prospectingStatus?: ProspectingStatus;
    legalRepresentative?: string;
}) {
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
                isActive: data.isActive,
                annualDams: data.annualDams,
                prospectingStatus: data.prospectingStatus,
            }
        });

        revalidatePath(`/companies/${id}`);
        revalidatePath("/companies");
        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
        return { success: true, data: company };
    } catch (error) {
        console.error("Error updating company:", error);
        return { success: false, error: "Failed to update company" };
    }
}
