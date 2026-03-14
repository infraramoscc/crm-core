"use client";

import { useState } from "react";
import { createInteraction } from "@/app/actions/crm/interaction-actions";
import type {
    ContactBuyingRole,
    ContactCommercialStatus,
    FollowUpType,
    InteractionDirection,
    InteractionOutcome,
    InteractionPurpose,
    InteractionStageContext,
    InteractionType,
} from "@prisma/client";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PhoneCall } from "lucide-react";

interface InteractionContactOption {
    id: string;
    firstName: string;
    lastName: string;
}

export interface LogInteractionSuccessPayload {
    interaction: {
        id: string;
        type: InteractionType;
        stageContext: InteractionStageContext;
        direction: InteractionDirection;
        purpose: InteractionPurpose;
        outcome: InteractionOutcome | null;
        interactedAt: Date;
        scoreImpact: number;
        notes: string | null;
        nextFollowUpDate: Date | null;
        isFollowUpCompleted: boolean;
        followUpType: FollowUpType | null;
        contactId: string | null;
        contact: {
            firstName: string;
            lastName: string;
        } | null;
    };
    contactUpdate?: {
        id: string;
        commercialStatus: ContactCommercialStatus;
        buyingRole: ContactBuyingRole;
        lastValidatedAt: Date | null;
    };
}

interface LogInteractionModalProps {
    companyId: string;
    opportunityId?: string;
    contacts: InteractionContactOption[];
    onSuccess?: (payload: LogInteractionSuccessPayload) => void;
    triggerButton?: React.ReactNode;
    defaultContactId?: string;
    lockedContact?: boolean;
}

export function LogInteractionModal({
    companyId,
    opportunityId,
    contacts,
    onSuccess,
    triggerButton,
    defaultContactId,
    lockedContact,
}: LogInteractionModalProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<InteractionType>("EMAIL_SENT");
    const [stageContext, setStageContext] = useState<InteractionStageContext>(opportunityId ? "OPPORTUNITY" : "PROSPECTING");
    const [direction, setDirection] = useState<InteractionDirection>("OUTBOUND");
    const [purpose, setPurpose] = useState<InteractionPurpose>(opportunityId ? "QUOTE" : "FOLLOW_UP");
    const [outcome, setOutcome] = useState<InteractionOutcome>("NO_RESPONSE");
    const [notes, setNotes] = useState("");
    const [contactId, setContactId] = useState(defaultContactId || contacts[0]?.id || "");
    const [contactCommercialStatus, setContactCommercialStatus] = useState<ContactCommercialStatus>("VALIDATED_NO_RESPONSE");
    const [contactBuyingRole, setContactBuyingRole] = useState<ContactBuyingRole>("UNKNOWN");
    const [createTask, setCreateTask] = useState(false);
    const [nextFollowUpDate, setNextFollowUpDate] = useState("");
    const [followUpType, setFollowUpType] = useState<FollowUpType>("CALL");
    const [loading, setLoading] = useState(false);

    const getScoreImpact = (interactionType: InteractionType) => {
        switch (interactionType) {
            case "LINKEDIN_CONNECT":
                return 2;
            case "LINKEDIN_MESSAGE":
                return 3;
            case "EMAIL_SENT":
                return 1;
            case "EMAIL_OPENED":
                return 5;
            case "WHATSAPP_SENT":
                return 6;
            case "CALL_MADE":
                return 10;
            case "MEETING":
                return 25;
            default:
                return 0;
        }
    };

    const resetForm = () => {
        setNotes("");
        setNextFollowUpDate("");
        setOutcome("NO_RESPONSE");
        setStageContext(opportunityId ? "OPPORTUNITY" : "PROSPECTING");
        setDirection("OUTBOUND");
        setPurpose(opportunityId ? "QUOTE" : "FOLLOW_UP");
        setContactCommercialStatus("VALIDATED_NO_RESPONSE");
        setContactBuyingRole("UNKNOWN");
        setCreateTask(false);
    };

    const handleSave = async () => {
        if (!notes) {
            return;
        }

        setLoading(true);

        const safeContactId = contactId && contactId !== "none" ? contactId : undefined;
        const scoreImpact = getScoreImpact(type);
        const result = await createInteraction({
            companyId,
            contactId: safeContactId,
            opportunityId,
            type,
            stageContext,
            direction,
            purpose,
            outcome,
            notes,
            scoreImpact,
            interactedAt: new Date().toISOString(),
            nextFollowUpDate: createTask && nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
            followUpType: createTask && nextFollowUpDate ? followUpType : undefined,
            contactCommercialStatus: safeContactId ? contactCommercialStatus : undefined,
            contactBuyingRole: safeContactId ? contactBuyingRole : undefined,
        });

        setLoading(false);

        if (!result.success || !result.data) {
            alert("Error guardando la interaccion.");
            return;
        }

        const selectedContact = contacts.find((contact) => contact.id === safeContactId) ?? null;
        onSuccess?.({
            interaction: {
                id: result.data.id,
                type,
                stageContext,
                direction,
                purpose,
                outcome,
                interactedAt: new Date(result.data.interactedAt),
                scoreImpact,
                notes,
                nextFollowUpDate: createTask && nextFollowUpDate ? new Date(nextFollowUpDate) : null,
                isFollowUpCompleted: false,
                followUpType: createTask && nextFollowUpDate ? followUpType : null,
                contactId: safeContactId ?? null,
                contact: selectedContact
                    ? {
                        firstName: selectedContact.firstName,
                        lastName: selectedContact.lastName,
                    }
                    : null,
            },
            contactUpdate: safeContactId
                ? {
                    id: safeContactId,
                    commercialStatus: contactCommercialStatus,
                    buyingRole: contactBuyingRole,
                    lastValidatedAt: contactCommercialStatus === "UNVALIDATED" ? null : new Date(),
                }
                : undefined,
        });

        setOpen(false);
        resetForm();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button size="sm">
                        <PhoneCall className="mr-2 h-4 w-4" /> Anotar en Diario
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Anotar Nueva Interaccion</DialogTitle>
                    <DialogDescription>
                        Registra el intento, el resultado y el siguiente paso sin salir de la sesion de caceria.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Tipo de accion</Label>
                            <Select value={type} onValueChange={(value) => setType(value as InteractionType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EMAIL_SENT">Correo Enviado (+1)</SelectItem>
                                    <SelectItem value="EMAIL_OPENED">Correo Abierto (+5)</SelectItem>
                                    <SelectItem value="WHATSAPP_SENT">WhatsApp Enviado (+6)</SelectItem>
                                    <SelectItem value="CALL_MADE">Llamada Realizada (+10)</SelectItem>
                                    <SelectItem value="MEETING">Reunion Comercial (+25)</SelectItem>
                                    <SelectItem value="LINKEDIN_CONNECT">Conectar LinkedIn (+2)</SelectItem>
                                    <SelectItem value="LINKEDIN_MESSAGE">Mensaje LinkedIn (+3)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Con quien hablaste</Label>
                            <Select value={contactId} onValueChange={setContactId} disabled={lockedContact}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Contacto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {!lockedContact && <SelectItem value="none">Ninguno / General</SelectItem>}
                                    {contacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            {contact.firstName} {contact.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Etapa</Label>
                            <Select value={stageContext} onValueChange={(value) => setStageContext(value as InteractionStageContext)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INVESTIGATION">Investigacion</SelectItem>
                                    <SelectItem value="PROSPECTING">Caceria</SelectItem>
                                    <SelectItem value="OPPORTUNITY">Oportunidad</SelectItem>
                                    <SelectItem value="POST_SALE">Post venta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Direccion</Label>
                            <Select value={direction} onValueChange={(value) => setDirection(value as InteractionDirection)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OUTBOUND">Saliente</SelectItem>
                                    <SelectItem value="INBOUND">Entrante</SelectItem>
                                    <SelectItem value="INTERNAL">Interna</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Proposito</Label>
                            <Select value={purpose} onValueChange={(value) => setPurpose(value as InteractionPurpose)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RESEARCH">Investigacion</SelectItem>
                                    <SelectItem value="VALIDATION">Validacion</SelectItem>
                                    <SelectItem value="FOLLOW_UP">Seguimiento</SelectItem>
                                    <SelectItem value="DISCOVERY">Descubrimiento</SelectItem>
                                    <SelectItem value="QUOTE">Cotizacion</SelectItem>
                                    <SelectItem value="NEGOTIATION">Negociacion</SelectItem>
                                    <SelectItem value="RELATIONSHIP">Relacion</SelectItem>
                                    <SelectItem value="TASK">Tarea</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
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
                            <Select
                                value={contactCommercialStatus}
                                onValueChange={(value) => setContactCommercialStatus(value as ContactCommercialStatus)}
                            >
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
                        <Label>Notas del cazador</Label>
                        <Textarea
                            placeholder="Que te dijeron, que necesitan y cual es el siguiente movimiento comercial."
                            className="min-h-[96px]"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                        />
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="flex flex-col gap-4">
                            <label className="flex cursor-pointer items-center gap-2 font-semibold text-amber-900">
                                <input
                                    type="checkbox"
                                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    checked={createTask}
                                    onChange={(event) => setCreateTask(event.target.checked)}
                                />
                                Programar tarea de seguimiento
                            </label>

                            {createTask && (
                                <div className="grid grid-cols-1 gap-4 border-l-2 border-amber-200 pl-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-amber-900">Proxima accion</Label>
                                        <Select value={followUpType} onValueChange={(value) => setFollowUpType(value as FollowUpType)}>
                                            <SelectTrigger className="bg-white">
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
                                        <Label className="text-amber-900">Fecha y hora</Label>
                                        <Input
                                            type="datetime-local"
                                            value={nextFollowUpDate}
                                            onChange={(event) => setNextFollowUpDate(event.target.value)}
                                            className="bg-white"
                                            required={createTask}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!notes || loading}>
                        {loading ? "Guardando..." : "Guardar Interaccion"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
