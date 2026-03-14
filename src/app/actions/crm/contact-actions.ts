"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type {
    ContactBuyingRole,
    ContactCommercialStatus,
    DecisionStyle,
    InteractionType,
    PreferredContactChannel,
    PreferredContactWindow,
    Prisma,
    RelationshipStrength,
    ResearchSourceChannel,
    ValueDriver,
} from "@prisma/client";

function normalizeString(value?: string) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function normalizePrimaryEmail(emails?: string[]) {
    const firstEmail = emails?.map((email) => email.trim().toLowerCase()).find(Boolean);
    return firstEmail || null;
}

function toDateOrNull(value?: string) {
    return value ? new Date(value) : null;
}

async function resolveContactProfileId(
    db: Prisma.TransactionClient,
    currentProfileId: string | null,
    data: {
        firstName: string;
        lastName?: string;
        emails?: string[];
        linkedin?: string;
        birthday?: string;
        anniversary?: string;
        interests?: string;
        notes?: string;
        relationshipStrength?: RelationshipStrength;
        preferredContactChannel?: PreferredContactChannel;
        preferredContactWindow?: PreferredContactWindow;
        decisionStyle?: DecisionStyle;
        primaryDriver?: ValueDriver;
        typicalObjection?: string;
        giftPreferences?: string;
        doNotGift?: string;
        visitNotes?: string;
        lastMeaningfulInteractionAt?: string;
        nextPersonalTouchAt?: string;
    }
) {
    const primaryEmail = normalizePrimaryEmail(data.emails);
    const linkedin = normalizeString(data.linkedin);
    const profilePayload = {
        firstName: data.firstName,
        lastName: data.lastName || "",
        primaryEmail,
        linkedin,
        birthday: toDateOrNull(data.birthday),
        anniversary: toDateOrNull(data.anniversary),
        interests: normalizeString(data.interests),
        notes: normalizeString(data.notes),
        relationshipStrength: data.relationshipStrength || "COLD",
        preferredContactChannel: data.preferredContactChannel || null,
        preferredContactWindow: data.preferredContactWindow || null,
        decisionStyle: data.decisionStyle || null,
        primaryDriver: data.primaryDriver || "UNKNOWN",
        typicalObjection: normalizeString(data.typicalObjection),
        giftPreferences: normalizeString(data.giftPreferences),
        doNotGift: normalizeString(data.doNotGift),
        visitNotes: normalizeString(data.visitNotes),
        lastMeaningfulInteractionAt: toDateOrNull(data.lastMeaningfulInteractionAt),
        nextPersonalTouchAt: toDateOrNull(data.nextPersonalTouchAt),
    };

    if (currentProfileId) {
        const profile = await db.contactProfile.update({
            where: { id: currentProfileId },
            data: profilePayload,
            select: { id: true },
        });
        return profile.id;
    }

    const matchConditions: Prisma.ContactProfileWhereInput[] = [];
    if (linkedin) {
        matchConditions.push({ linkedin });
    }
    if (primaryEmail) {
        matchConditions.push({ primaryEmail });
    }

    if (matchConditions.length > 0) {
        const existing = await db.contactProfile.findFirst({
            where: { OR: matchConditions },
            select: { id: true },
        });

        if (existing) {
            await db.contactProfile.update({
                where: { id: existing.id },
                data: profilePayload,
            });
            return existing.id;
        }
    }

    const profile = await db.contactProfile.create({
        data: profilePayload,
        select: { id: true },
    });
    return profile.id;
}

export async function createContact(data: {
    companyId: string;
    firstName: string;
    lastName?: string;
    emails?: string[];
    phones?: string[];
    position?: string;
    linkedin?: string;
    birthday?: string;
    anniversary?: string;
    interests?: string;
    notes?: string;
    isActive?: boolean;
    inactiveReason?: string;
    commercialStatus?: ContactCommercialStatus;
    buyingRole?: ContactBuyingRole;
    sourceChannel?: ResearchSourceChannel;
    relationshipStrength?: RelationshipStrength;
    preferredContactChannel?: PreferredContactChannel;
    preferredContactWindow?: PreferredContactWindow;
    decisionStyle?: DecisionStyle;
    primaryDriver?: ValueDriver;
    typicalObjection?: string;
    giftPreferences?: string;
    doNotGift?: string;
    visitNotes?: string;
    lastMeaningfulInteractionAt?: string;
    nextPersonalTouchAt?: string;
}) {
    try {
        const contact = await prisma.$transaction(async (tx) => {
            const profileId = await resolveContactProfileId(tx, null, data);
            return tx.contact.create({
                data: {
                    companyId: data.companyId,
                    profileId,
                    firstName: data.firstName,
                    lastName: data.lastName || "",
                    emails: data.emails || [],
                    phones: data.phones || [],
                    position: data.position || null,
                    linkedin: data.linkedin || null,
                    birthday: data.birthday ? new Date(data.birthday) : null,
                    anniversary: data.anniversary ? new Date(data.anniversary) : null,
                    interests: data.interests || null,
                    notes: data.notes || null,
                    isActive: data.isActive ?? true,
                    inactiveReason: data.inactiveReason || null,
                    commercialStatus: data.commercialStatus || "UNVALIDATED",
                    buyingRole: data.buyingRole || "UNKNOWN",
                    sourceChannel: data.sourceChannel || null,
                    lastValidatedAt: data.commercialStatus
                        ? data.commercialStatus === "UNVALIDATED"
                            ? null
                            : new Date()
                        : null,
                }
            });
        });

        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath(`/companies/${data.companyId}`);
        revalidatePath("/contacts");
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
            const newEmails = contact.emails.filter((email) => email !== value);
            await prisma.contact.update({ where: { id: contactId }, data: { emails: newEmails } });
        } else {
            const newPhones = contact.phones.filter((phone) => phone !== value);
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
            select: {
                id: true,
                firstName: true,
                lastName: true,
                companyId: true,
                profileId: true,
                position: true,
                emails: true,
                phones: true,
                isActive: true,
                commercialStatus: true,
                buyingRole: true,
                company: {
                    select: { businessName: true }
                },
                profile: {
                    select: {
                        relationshipStrength: true,
                        preferredContactChannel: true,
                        decisionStyle: true,
                        primaryDriver: true,
                        nextPersonalTouchAt: true,
                        contacts: {
                            select: {
                                id: true,
                                companyId: true,
                                company: {
                                    select: { businessName: true }
                                }
                            }
                        }
                    }
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
                },
                profile: {
                    include: {
                        contacts: {
                            include: {
                                company: {
                                    select: { id: true, businessName: true }
                                }
                            },
                            orderBy: { createdAt: "desc" }
                        }
                    }
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
    linkedin?: string;
    birthday?: string;
    anniversary?: string;
    interests?: string;
    notes?: string;
    isActive?: boolean;
    inactiveReason?: string;
    commercialStatus?: ContactCommercialStatus;
    buyingRole?: ContactBuyingRole;
    sourceChannel?: ResearchSourceChannel;
    relationshipStrength?: RelationshipStrength;
    preferredContactChannel?: PreferredContactChannel;
    preferredContactWindow?: PreferredContactWindow;
    decisionStyle?: DecisionStyle;
    primaryDriver?: ValueDriver;
    typicalObjection?: string;
    giftPreferences?: string;
    doNotGift?: string;
    visitNotes?: string;
    lastMeaningfulInteractionAt?: string;
    nextPersonalTouchAt?: string;
}) {
    try {
        const currentContact = await prisma.contact.findUnique({
            where: { id },
            select: { profileId: true, companyId: true },
        });

        if (!currentContact) {
            return { success: false, error: "Contact not found" };
        }

        const contact = await prisma.$transaction(async (tx) => {
            const profileId = await resolveContactProfileId(tx, currentContact.profileId, {
                firstName: data.firstName || "",
                lastName: data.lastName,
                emails: data.emails,
                linkedin: data.linkedin,
                birthday: data.birthday,
                anniversary: data.anniversary,
                interests: data.interests,
                notes: data.notes,
                relationshipStrength: data.relationshipStrength,
                preferredContactChannel: data.preferredContactChannel,
                preferredContactWindow: data.preferredContactWindow,
                decisionStyle: data.decisionStyle,
                primaryDriver: data.primaryDriver,
                typicalObjection: data.typicalObjection,
                giftPreferences: data.giftPreferences,
                doNotGift: data.doNotGift,
                visitNotes: data.visitNotes,
                lastMeaningfulInteractionAt: data.lastMeaningfulInteractionAt,
                nextPersonalTouchAt: data.nextPersonalTouchAt,
            });

            return tx.contact.update({
                where: { id },
                data: {
                    companyId: data.companyId,
                    profileId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    emails: data.emails,
                    phones: data.phones,
                    position: data.position || null,
                    linkedin: data.linkedin || null,
                    birthday: data.birthday ? new Date(data.birthday) : null,
                    anniversary: data.anniversary ? new Date(data.anniversary) : null,
                    interests: data.interests,
                    notes: data.notes,
                    isActive: data.isActive,
                    inactiveReason: data.inactiveReason,
                    commercialStatus: data.commercialStatus,
                    buyingRole: data.buyingRole,
                    sourceChannel: data.sourceChannel || null,
                    lastValidatedAt: data.commercialStatus
                        ? data.commercialStatus === "UNVALIDATED"
                            ? null
                            : new Date()
                        : undefined,
                }
            });
        });

        revalidatePath(`/contacts/${id}`);
        revalidatePath("/contacts");
        revalidatePath("/crm/investigation");
        revalidatePath("/crm/prospecting");
        revalidatePath(`/companies/${currentContact.companyId}`);
        revalidatePath(`/companies/${data.companyId || currentContact.companyId}`);
        return { success: true, data: contact };
    } catch (error) {
        console.error("Error updating contact:", error);
        return { success: false, error: "Failed to update contact" };
    }
}
