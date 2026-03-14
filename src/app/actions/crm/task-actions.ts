"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function getPendingTasks() {
    try {
        const tasks = await prisma.interaction.findMany({
            where: {
                isFollowUpCompleted: false,
                nextFollowUpDate: { not: null }
            },
            include: {
                company: {
                    select: { id: true, businessName: true }
                },
                contact: {
                    select: { id: true, firstName: true, lastName: true }
                }
            },
            orderBy: {
                nextFollowUpDate: 'asc'
            },
            take: 20
        });

        return { success: true, data: tasks };
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return { success: false, data: [] };
    }
}

export async function completeTask(taskId: string) {
    try {
        const task = await prisma.interaction.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                companyId: true,
                contactId: true,
                opportunityId: true,
                followUpType: true,
                isFollowUpCompleted: true,
            },
        });

        if (!task || task.isFollowUpCompleted) {
            return { success: false, error: "Task not found or already completed" };
        }

        await prisma.$transaction([
            prisma.interaction.update({
                where: { id: taskId },
                data: { isFollowUpCompleted: true },
            }),
            prisma.interaction.create({
                data: {
                    companyId: task.companyId,
                    contactId: task.contactId,
                    opportunityId: task.opportunityId,
                    type: "SYSTEM_NOTE",
                    stageContext: task.opportunityId ? "OPPORTUNITY" : "PROSPECTING",
                    direction: "INTERNAL",
                    purpose: "TASK",
                    notes: `Tarea completada desde la Agenda${task.followUpType ? ` (${task.followUpType})` : ""}`,
                    interactedAt: new Date(),
                    isFollowUpCompleted: true,
                },
            }),
        ]);

        revalidatePath("/crm/tasks");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
        return { success: true };
    } catch (error) {
        console.error("Error completing task:", error);
        return { success: false, error: "Failed to complete task" };
    }
}
