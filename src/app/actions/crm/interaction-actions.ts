"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { InteractionType } from "@prisma/client";

/**
 * Crea una nueva interacción (nota del diario del cazador)
 * y opcionalmente actualiza el Lead Score de la empresa.
 */
export async function createInteraction(data: {
    companyId: string;
    contactId?: string;
    opportunityId?: string;
    type: InteractionType;
    notes: string;
    scoreImpact?: number;
    interactedAt?: string; // ISO date string
    nextFollowUpDate?: string; // ISO date string
}) {
    try {
        const interaction = await prisma.interaction.create({
            data: {
                companyId: data.companyId,
                contactId: data.contactId || null,
                opportunityId: data.opportunityId || null,
                type: data.type,
                notes: data.notes,
                scoreImpact: data.scoreImpact || 0,
                interactedAt: data.interactedAt ? new Date(data.interactedAt) : new Date(),
                nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
                isFollowUpCompleted: false,
            }
        });

        // Actualizar Lead Score de la empresa sumando el impacto
        if (data.scoreImpact && data.scoreImpact > 0) {
            await prisma.company.update({
                where: { id: data.companyId },
                data: {
                    leadScore: { increment: data.scoreImpact },
                    // Si es la primera interacción, cambiar status a PROSPECTING
                    prospectingStatus: "PROSPECTING",
                }
            });
        }

        // Si tiene un follow-up previo en la misma empresa, marcar los viejos como completados
        if (data.nextFollowUpDate) {
            await prisma.interaction.updateMany({
                where: {
                    companyId: data.companyId,
                    isFollowUpCompleted: false,
                    id: { not: interaction.id }, // No tocar el recién creado
                    nextFollowUpDate: { not: null },
                },
                data: {
                    isFollowUpCompleted: true,
                }
            });
        }

        revalidatePath("/crm/prospecting");
        revalidatePath("/crm/investigation");
        revalidatePath("/crm");
        return { success: true, data: interaction };
    } catch (error) {
        console.error("Error creating interaction:", error);
        return { success: false, error: "Failed to create interaction" };
    }
}

/**
 * Obtiene todas las interacciones de una empresa, ordenadas de más reciente a más antigua.
 */
export async function getInteractionsByCompany(companyId: string) {
    try {
        const interactions = await prisma.interaction.findMany({
            where: { companyId },
            include: {
                contact: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { interactedAt: 'desc' },
        });
        return { success: true, data: interactions };
    } catch (error) {
        console.error("Error fetching interactions:", error);
        return { success: false, error: "Failed to fetch interactions", data: [] };
    }
}
