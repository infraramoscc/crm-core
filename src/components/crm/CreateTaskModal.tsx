"use client";

import { useState } from "react";
import { createInteraction } from "@/app/actions/crm/interaction-actions";
import type { FollowUpType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarClock } from "lucide-react";

interface TaskContactOption {
    id: string;
    firstName: string;
    lastName: string;
}

export interface CreateTaskSuccessPayload {
    interaction: {
        id: string;
        type: "SYSTEM_NOTE";
        outcome: null;
        interactedAt: Date;
        scoreImpact: number;
        notes: string;
        nextFollowUpDate: Date;
        isFollowUpCompleted: boolean;
        followUpType: FollowUpType;
        contactId: string | null;
        contact: {
            firstName: string;
            lastName: string;
        } | null;
    };
}

interface CreateTaskModalProps {
    companyId: string;
    contacts: TaskContactOption[];
    onSuccess?: (payload: CreateTaskSuccessPayload) => void;
    triggerButton?: React.ReactNode;
    defaultContactId?: string;
    isSimplePostpone?: boolean;
}

export function CreateTaskModal({
    companyId,
    contacts,
    onSuccess,
    triggerButton,
    defaultContactId,
    isSimplePostpone,
}: CreateTaskModalProps) {
    const [open, setOpen] = useState(false);
    const [nextFollowUpDate, setNextFollowUpDate] = useState("");
    const [followUpType, setFollowUpType] = useState<FollowUpType>(isSimplePostpone ? "OTHER" : "CALL");
    const [contactId, setContactId] = useState(defaultContactId || "none");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nextFollowUpDate) {
            return;
        }

        setLoading(true);

        const safeContactId = contactId && contactId !== "none" ? contactId : undefined;
        const taskNotes = isSimplePostpone ? "Cuenta pospuesta desde caceria" : "Tarea programada manualmente";
        const result = await createInteraction({
            companyId,
            contactId: safeContactId,
            type: "SYSTEM_NOTE",
            notes: taskNotes,
            interactedAt: new Date().toISOString(),
            nextFollowUpDate: new Date(nextFollowUpDate).toISOString(),
            followUpType,
        });

        setLoading(false);

        if (!result.success || !result.data) {
            alert("Error guardando la tarea.");
            return;
        }

        const selectedContact = contacts.find((contact) => contact.id === safeContactId) ?? null;
        onSuccess?.({
            interaction: {
                id: result.data.id,
                type: "SYSTEM_NOTE",
                outcome: null,
                interactedAt: new Date(result.data.interactedAt),
                scoreImpact: 0,
                notes: taskNotes,
                nextFollowUpDate: new Date(nextFollowUpDate),
                isFollowUpCompleted: false,
                followUpType,
                contactId: safeContactId ?? null,
                contact: selectedContact
                    ? {
                        firstName: selectedContact.firstName,
                        lastName: selectedContact.lastName,
                    }
                    : null,
            },
        });

        setOpen(false);
        setNextFollowUpDate("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button size="sm" variant="outline" className="border-dashed">
                        <CalendarClock className="mr-2 h-4 w-4" /> Agendar Tarea
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isSimplePostpone ? "Posponer Cuenta" : "Crear Nueva Tarea"}</DialogTitle>
                    <DialogDescription>
                        {isSimplePostpone
                            ? "Programa la proxima fecha para retomar esta cuenta cuando ya agotaste los contactos de hoy."
                            : "Programa un siguiente paso sin salir de la sesion de caceria."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!isSimplePostpone && (
                        <>
                            <div className="space-y-2">
                                <Label>Tipo de tarea</Label>
                                <Select value={followUpType} onValueChange={(value) => setFollowUpType(value as FollowUpType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CALL">Llamar</SelectItem>
                                        <SelectItem value="WHATSAPP">Enviar WhatsApp</SelectItem>
                                        <SelectItem value="EMAIL">Enviar Correo</SelectItem>
                                        <SelectItem value="LINKEDIN">Conectar/Mensaje LinkedIn</SelectItem>
                                        <SelectItem value="MEETING">Tener Reunion</SelectItem>
                                        <SelectItem value="OTHER">Otra Accion</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Asignar a contacto</Label>
                                <Select value={contactId} onValueChange={setContactId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Contacto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguno / General</SelectItem>
                                        {contacts.map((contact) => (
                                            <SelectItem key={contact.id} value={contact.id}>
                                                {contact.firstName} {contact.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>Fecha y hora</Label>
                        <Input
                            type="datetime-local"
                            value={nextFollowUpDate}
                            onChange={(event) => setNextFollowUpDate(event.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!nextFollowUpDate || loading}>
                        {loading ? "Programando..." : isSimplePostpone ? "Posponer" : "Crear Tarea"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
