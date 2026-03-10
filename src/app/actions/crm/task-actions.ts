"use server";

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
