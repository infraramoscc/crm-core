"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { OpportunityStage } from "@prisma/client";

export async function getPipelineOpportunities() {
    try {
        const opps = await prisma.opportunity.findMany({
            include: {
                company: {
                    select: { businessName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: opps };
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        return { success: false, error: "Failed to fetch opportunities", data: [] };
    }
}

export async function moveOpportunityStage(oppId: string, newStage: OpportunityStage) {
    try {
        // Al mover, si sale de LOST, borramos la razón de pérdida.
        const updated = await prisma.opportunity.update({
            where: { id: oppId },
            data: {
                stage: newStage,
                lossReason: newStage === 'LOST' ? undefined : null // null borra el valor en Prisma
            }
        });

        revalidatePath("/crm");
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
                lossReason: reason
            }
        });

        revalidatePath("/crm");
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error losing opportunity:", error);
        return { success: false, error: "Failed to register loss" };
    }
}
