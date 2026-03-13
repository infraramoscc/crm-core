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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { CalendarClock } from "lucide-react";

interface TaskContactOption {
    id: string;
    firstName: string;
    lastName: string;
}

interface CreateTaskModalProps {
    companyId: string;
    contacts: TaskContactOption[];
    onSuccess?: () => void;
    triggerButton?: React.ReactNode;
    defaultContactId?: string;
    isSimplePostpone?: boolean; // If true, hides contact selection and uses OTHER for type
}

export function CreateTaskModal({ companyId, contacts, onSuccess, triggerButton, defaultContactId, isSimplePostpone }: CreateTaskModalProps) {
    const [open, setOpen] = useState(false);
    const [nextFollowUpDate, setNextFollowUpDate] = useState("");
    const [followUpType, setFollowUpType] = useState<FollowUpType>(isSimplePostpone ? "OTHER" : "CALL");
    const [contactId, setContactId] = useState(defaultContactId || "none");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nextFollowUpDate) return;
        setLoading(true);

        const result = await createInteraction({
            companyId,
            contactId: contactId && contactId !== "none" ? contactId : undefined,
            type: "SYSTEM_NOTE",
            notes: isSimplePostpone ? "Cuenta pospuesta" : "Tarea programada manualmente",
            interactedAt: new Date().toISOString(),
            nextFollowUpDate: new Date(nextFollowUpDate).toISOString(),
            followUpType,
        });

        setLoading(false);

        if (result.success) {
            setOpen(false);
            setNextFollowUpDate("");
            if (onSuccess) onSuccess();
        } else {
            alert("Error guardando la tarea.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button size="sm" variant="outline" className="border-dashed">
                        <CalendarClock className="h-4 w-4 mr-2" /> Agendar Tarea
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isSimplePostpone ? "Posponer Cuenta" : "Crear Nueva Tarea"}</DialogTitle>
                    <DialogDescription>
                        {isSimplePostpone ? "Selecciona para cuándo quieres posponer esta empresa." : "Programa una tarea futura. Aparecerá en tu campana de notificaciones."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!isSimplePostpone && (
                        <>
                            <div className="space-y-2">
                                <Label>Tipo de Tarea</Label>
                                <Select value={followUpType} onValueChange={(value) => setFollowUpType(value as FollowUpType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CALL">📞 Llamar</SelectItem>
                                        <SelectItem value="WHATSAPP">💬 Enviar WhatsApp</SelectItem>
                                        <SelectItem value="EMAIL">✉️ Enviar Correo</SelectItem>
                                        <SelectItem value="LINKEDIN">💼 Conectar/Mensaje LinkedIn</SelectItem>
                                        <SelectItem value="MEETING">🤝 Tener Reunión</SelectItem>
                                        <SelectItem value="OTHER">📌 Otra Acción</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Asignar a Contacto (Opcional)</Label>
                                <Select value={contactId} onValueChange={setContactId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Contacto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Ninguno / General</SelectItem>
                                        {contacts.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.firstName} {c.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>Fecha y Hora de la Tarea</Label>
                        <Input
                            type="datetime-local"
                            value={nextFollowUpDate}
                            onChange={(e) => setNextFollowUpDate(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!nextFollowUpDate || loading}>
                        {loading ? "Programando..." : isSimplePostpone ? "Posponer" : "Crear Tarea"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
