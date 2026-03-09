"use client";

import { useState } from "react";
import { createInteraction } from "@/app/actions/crm/interaction-actions";
import type { InteractionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { PhoneCall } from "lucide-react";

interface LogInteractionModalProps {
    companyId: string;
    opportunityId?: string;
    contacts: any[];
    onSuccess?: () => void;
    triggerButton?: React.ReactNode;
}

export function LogInteractionModal({ companyId, opportunityId, contacts, onSuccess, triggerButton }: LogInteractionModalProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<InteractionType>("CALL_MADE");
    const [notes, setNotes] = useState("");
    const [contactId, setContactId] = useState(contacts[0]?.id || "");
    const [interactedAt, setInteractedAt] = useState(new Date().toISOString().split('T')[0]);
    const [nextFollowUpDate, setNextFollowUpDate] = useState("");

    const [loading, setLoading] = useState(false);

    const getScoreImpact = (t: InteractionType) => {
        switch (t) {
            case "EMAIL_SENT": return 1;
            case "EMAIL_OPENED": return 5;
            case "CALL_MADE": return 10;
            case "MEETING": return 25;
            default: return 0;
        }
    };

    const handleSave = async () => {
        if (!notes) return;
        setLoading(true);

        const result = await createInteraction({
            companyId,
            contactId: contactId && contactId !== "none" ? contactId : undefined,
            opportunityId,
            type,
            notes,
            scoreImpact: getScoreImpact(type),
            interactedAt: interactedAt,
            nextFollowUpDate: nextFollowUpDate || undefined,
        });

        setLoading(false);

        if (result.success) {
            setOpen(false);
            setNotes("");
            setNextFollowUpDate("");
            if (onSuccess) onSuccess();
        } else {
            alert("Error guardando la interacción.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button size="sm">
                        <PhoneCall className="h-4 w-4 mr-2" /> Anotar en Diario
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Anotar Nueva Interacción</DialogTitle>
                    <DialogDescription>
                        Registra los resultados de tu llamada o correo. El Termómetro (Lead Score) subirá automáticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo de Acción</Label>
                            <Select value={type} onValueChange={(val: InteractionType) => setType(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EMAIL_SENT">Correo Enviado (+1)</SelectItem>
                                    <SelectItem value="EMAIL_OPENED">Correo Abierto (+5)</SelectItem>
                                    <SelectItem value="CALL_MADE">Llamada Realizada (+10)</SelectItem>
                                    <SelectItem value="MEETING">Reunión Comercial (+25)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Con quién hablaste</Label>
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
                    </div>

                    <div className="space-y-2">
                        <Label>Notas del Cazador</Label>
                        <Textarea
                            placeholder="¿Qué te dijeron? ¿Qué necesitan? ¿Cuándo operan?"
                            className="min-h-[80px]"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="space-y-2">
                            <Label className="text-amber-900">¿Próximo Seguimiento? (Tarea)</Label>
                            <Input
                                type="date"
                                value={nextFollowUpDate}
                                onChange={(e) => setNextFollowUpDate(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!notes || loading}>
                        {loading ? "Guardando..." : "Guardar Nota"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
