"use client";

import { useState } from "react";
import { createInteraction } from "@/app/actions/crm/interaction-actions";
import type { ContactBuyingRole, ContactCommercialStatus, FollowUpType, InteractionOutcome, InteractionType } from "@prisma/client";
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

interface InteractionContactOption {
    id: string;
    firstName: string;
    lastName: string;
}

interface LogInteractionModalProps {
    companyId: string;
    opportunityId?: string;
    contacts: InteractionContactOption[];
    onSuccess?: () => void;
    triggerButton?: React.ReactNode;
    defaultContactId?: string;
    lockedContact?: boolean;
}

export function LogInteractionModal({ companyId, opportunityId, contacts, onSuccess, triggerButton, defaultContactId, lockedContact }: LogInteractionModalProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<InteractionType>("EMAIL_SENT"); // Por defecto correo enviado como seguimiento
    const [outcome, setOutcome] = useState<InteractionOutcome>("NO_RESPONSE");
    const [notes, setNotes] = useState("");
    const [contactId, setContactId] = useState(defaultContactId || contacts[0]?.id || "");
    const [contactCommercialStatus, setContactCommercialStatus] = useState<ContactCommercialStatus>("VALIDATED_NO_RESPONSE");
    const [contactBuyingRole, setContactBuyingRole] = useState<ContactBuyingRole>("UNKNOWN");
    // Tarea Futura
    const [createTask, setCreateTask] = useState(false);
    const [nextFollowUpDate, setNextFollowUpDate] = useState("");
    const [followUpType, setFollowUpType] = useState<FollowUpType>("CALL");

    const [loading, setLoading] = useState(false);

    const getScoreImpact = (t: InteractionType) => {
        switch (t) {
            case "LINKEDIN_CONNECT": return 2;
            case "LINKEDIN_MESSAGE": return 3;
            case "EMAIL_SENT": return 1;
            case "EMAIL_OPENED": return 5;
            case "WHATSAPP_SENT": return 6;
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
            outcome,
            notes,
            scoreImpact: getScoreImpact(type),
            interactedAt: new Date().toISOString(),
            nextFollowUpDate: createTask && nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
            followUpType: createTask && nextFollowUpDate ? followUpType : undefined,
            contactCommercialStatus: contactId && contactId !== "none" ? contactCommercialStatus : undefined,
            contactBuyingRole: contactId && contactId !== "none" ? contactBuyingRole : undefined,
        });

        setLoading(false);

        if (result.success) {
            setOpen(false);
            setNotes("");
            setNextFollowUpDate("");
            setOutcome("NO_RESPONSE");
            setContactCommercialStatus("VALIDATED_NO_RESPONSE");
            setContactBuyingRole("UNKNOWN");
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
                                    <SelectItem value="WHATSAPP_SENT">WhatsApp Enviado (+6)</SelectItem>
                                    <SelectItem value="CALL_MADE">Llamada Realizada (+10)</SelectItem>
                                    <SelectItem value="MEETING">Reunión Comercial (+25)</SelectItem>
                                    <SelectItem value="LINKEDIN_CONNECT">Conectar LinkedIn (+2)</SelectItem>
                                    <SelectItem value="LINKEDIN_MESSAGE">Mensaje LinkedIn (+3)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Con quién hablaste</Label>
                            <Select value={contactId} onValueChange={setContactId} disabled={lockedContact}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Contacto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {!lockedContact && <SelectItem value="none">Ninguno / General</SelectItem>}
                                    {contacts.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.firstName} {c.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Resultado</Label>
                            <Select value={outcome} onValueChange={(value) => setOutcome(value as InteractionOutcome)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NO_RESPONSE">No respondio</SelectItem>
                                    <SelectItem value="INVALID_PHONE">Numero invalido</SelectItem>
                                    <SelectItem value="BOUNCED_EMAIL">Correo rebotado</SelectItem>
                                    <SelectItem value="VERIFIED_CONTACT">Contacto validado</SelectItem>
                                    <SelectItem value="REFERRED_TO_OTHER">Derivo a otra persona</SelectItem>
                                    <SelectItem value="CALLBACK_REQUESTED">Pidio retomar</SelectItem>
                                    <SelectItem value="SHARED_OPERATION">Compartio operacion</SelectItem>
                                    <SelectItem value="REQUESTED_QUOTE">Pidio cotizacion</SelectItem>
                                    <SelectItem value="NO_INTEREST">Sin interes</SelectItem>
                                    <SelectItem value="HAS_CURRENT_VENDOR">Ya trabaja con otro operador</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Estado comercial</Label>
                            <Select value={contactCommercialStatus} onValueChange={(value) => setContactCommercialStatus(value as ContactCommercialStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNVALIDATED">Sin validar</SelectItem>
                                    <SelectItem value="VALIDATED_NO_RESPONSE">Validado sin respuesta</SelectItem>
                                    <SelectItem value="VALIDATED_RESPONDS">Validado y responde</SelectItem>
                                    <SelectItem value="INTERESTED">Interesado</SelectItem>
                                    <SelectItem value="NOT_DECISION_MAKER">No decide</SelectItem>
                                    <SelectItem value="DECISION_MAKER">Decisor</SelectItem>
                                    <SelectItem value="REPLACE">Reemplazar</SelectItem>
                                    <SelectItem value="DISCARDED">Descartado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Rol de compra</Label>
                            <Select value={contactBuyingRole} onValueChange={(value) => setContactBuyingRole(value as ContactBuyingRole)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNKNOWN">Sin definir</SelectItem>
                                    <SelectItem value="OPERATIONS">Operaciones</SelectItem>
                                    <SelectItem value="USER">Usuario</SelectItem>
                                    <SelectItem value="INFLUENCER">Influenciador</SelectItem>
                                    <SelectItem value="DECISION_MAKER">Decisor</SelectItem>
                                    <SelectItem value="BLOCKER">Bloqueador</SelectItem>
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
                        <div className="flex flex-col gap-4">
                            <label className="flex items-center gap-2 text-amber-900 font-semibold cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    checked={createTask}
                                    onChange={(e) => setCreateTask(e.target.checked)}
                                />
                                Programar Tarea (Próximo Seguimiento)
                            </label>

                            {createTask && (
                                <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-amber-200">
                                    <div className="space-y-2">
                                        <Label className="text-amber-900">¿Qué harás?</Label>
                                        <Select value={followUpType} onValueChange={(value) => setFollowUpType(value as FollowUpType)}>
                                            <SelectTrigger className="bg-white">
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
                                        <Label className="text-amber-900">Fecha y Hora</Label>
                                        <Input
                                            type="datetime-local"
                                            value={nextFollowUpDate}
                                            onChange={(e) => setNextFollowUpDate(e.target.value)}
                                            className="bg-white"
                                            required={createTask}
                                        />
                                    </div>
                                </div>
                            )}
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
