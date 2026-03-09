"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { InteractionType } from "@prisma/client";

export async function createContact(data: {
    companyId: string;
    firstName: string;
    lastName?: string;
    emails?: string[];
    phones?: string[];
    position?: string;
    isActive?: boolean;
    inactiveReason?: string;
}) {
    try {
        const contact = await prisma.contact.create({
            data: {
                companyId: data.companyId,
                firstName: data.firstName,
                lastName: data.lastName || "",
                emails: data.emails || [],
                phones: data.phones || [],
                position: data.position || "",
                isActive: data.isActive ?? true,
                inactiveReason: data.inactiveReason || null
            }
        });

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath(`/companies/${data.companyId}`);
        return { success: true, data: contact };
    } catch (error) {
        console.error("Error creating contact:", error);
        return { success: false, error: "Failed to create contact" };
    }
}

export async function logInteraction(data: {
    companyId: string;
    contactId?: string;
    opportunityId?: string;
    type: InteractionType;
    notes?: string;
    scoreImpact: number;
    interactedAt: Date;
    nextFollowUpDate?: Date;
}) {
    try {
        const interaction = await prisma.interaction.create({
            data: {
                ...data,
                // Default value for completed status if it has follow up
                isFollowUpCompleted: data.nextFollowUpDate ? false : true
            }
        });

        // Automatización: Si sumó puntaje de interacción, actualizamos en la Empresa (Lead Score)
        if (data.scoreImpact > 0) {
            await prisma.company.update({
                where: { id: data.companyId },
                data: {
                    leadScore: { increment: data.scoreImpact }
                }
            });
        }

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath("/crm");
        return { success: true, data: interaction };
    } catch (error) {
        console.error("Error logging interaction:", error);
        return { success: false, error: "Failed to log interaction" };
    }
}

export async function completeFollowUp(interactionId: string) {
    try {
        const updated = await prisma.interaction.update({
            where: { id: interactionId },
            data: { isFollowUpCompleted: true }
        });

        revalidatePath("/crm/prospecting");
        return { success: true, data: updated };
    } catch (error) {
        console.error("Error completing follow up:", error);
        return { success: false, error: "Failed to complete follow up" };
    }
}

// NUEVA FUNCIÓN: Purga de Datos (Tachito de Cacería)
export async function deleteContactInfo(contactId: string, type: 'email' | 'phone', value: string) {
    try {
        // En Postgres/Prisma no existe un "remove from array" simple con UPDATE directo en v5,
        // así que traemos el array actual, lo filtramos, y re-guardamos.
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            select: { emails: true, phones: true }
        });

        if (!contact) throw new Error("Contact not found");

        if (type === 'email') {
            const newEmails = contact.emails.filter((e: any) => e !== value);
            await prisma.contact.update({ where: { id: contactId }, data: { emails: newEmails } });
        } else {
            const newPhones = contact.phones.filter((p: any) => p !== value);
            await prisma.contact.update({ where: { id: contactId }, data: { phones: newPhones } });
        }

        revalidatePath("/crm/prospecting");
        return { success: true };
    } catch (error) {
        console.error("Error deleting contact info:", error);
        return { success: false, error: "Failed to delete logic" };
    }
}

export async function getAllContacts() {
    try {
        const contacts = await prisma.contact.findMany({
            include: {
                company: {
                    select: { id: true, businessName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: contacts };
    } catch (error) {
        console.error("Error fetching all contacts:", error);
        return { success: false, error: "Failed to fetch contacts", data: [] };
    }
}

export async function getContactById(id: string) {
    try {
        const contact = await prisma.contact.findUnique({
            where: { id },
            include: {
                company: {
                    select: { id: true, businessName: true }
                }
            }
        });
        if (!contact) {
            return { success: false, error: "Contact not found" };
        }
        return { success: true, data: contact };
    } catch (error) {
        console.error("Error fetching contact by id:", error);
        return { success: false, error: "Failed to fetch contact" };
    }
}

export async function updateContact(id: string, data: {
    companyId?: string;
    firstName?: string;
    lastName?: string;
    emails?: string[];
    phones?: string[];
    position?: string;
    isActive?: boolean;
    inactiveReason?: string;
}) {
    try {
        const contact = await prisma.contact.update({
            where: { id },
            data: {
                companyId: data.companyId,
                firstName: data.firstName,
                lastName: data.lastName,
                emails: data.emails,
                phones: data.phones,
                position: data.position,
                isActive: data.isActive,
                inactiveReason: data.inactiveReason
            }
        });

        revalidatePath(`/contacts/${id}`);
        revalidatePath("/contacts");
        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        if (data.companyId) {
            revalidatePath(`/companies/${data.companyId}`);
        }
        return { success: true, data: contact };
    } catch (error) {
        console.error("Error updating contact:", error);
        return { success: false, error: "Failed to update contact" };
    }
}
