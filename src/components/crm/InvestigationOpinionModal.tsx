"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ResearchEffort, ResearchPriority, ResearchSourceChannel, ResearchStatus } from "@prisma/client";
import { updateInvestigationOpinion } from "@/app/actions/crm/company-actions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface InvestigationOpinionModalProps {
    companyId: string;
    companyName: string;
    initialPriority: ResearchPriority;
    initialEffort: ResearchEffort;
    initialStatus: ResearchStatus;
    initialSourceChannel: ResearchSourceChannel | null;
    initialLastFinding: string | null;
    initialSummary: string | null;
    initialNextAction: string | null;
    triggerButton: ReactNode;
    onSuccess?: (payload: {
        researchPriority: ResearchPriority;
        researchEffort: ResearchEffort;
        researchStatus: ResearchStatus;
        researchSourceChannel: ResearchSourceChannel | null;
        researchLastFinding: string | null;
        researchSummary: string | null;
        researchNextAction: string | null;
        researchLastReviewedAt: Date;
    }) => void;
}

export function InvestigationOpinionModal({
    companyId,
    companyName,
    initialPriority,
    initialEffort,
    initialStatus,
    initialSourceChannel,
    initialLastFinding,
    initialSummary,
    initialNextAction,
    triggerButton,
    onSuccess,
}: InvestigationOpinionModalProps) {
    const [open, setOpen] = useState(false);
    const [researchPriority, setResearchPriority] = useState<ResearchPriority>(initialPriority);
    const [researchEffort, setResearchEffort] = useState<ResearchEffort>(initialEffort);
    const [researchStatus, setResearchStatus] = useState<ResearchStatus>(initialStatus);
    const [researchSourceChannel, setResearchSourceChannel] = useState<ResearchSourceChannel | "">(initialSourceChannel ?? "");
    const [researchLastFinding, setResearchLastFinding] = useState(initialLastFinding ?? "");
    const [researchSummary, setResearchSummary] = useState(initialSummary ?? "");
    const [researchNextAction, setResearchNextAction] = useState(initialNextAction ?? "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setResearchPriority(initialPriority);
            setResearchEffort(initialEffort);
            setResearchStatus(initialStatus);
            setResearchSourceChannel(initialSourceChannel ?? "");
            setResearchLastFinding(initialLastFinding ?? "");
            setResearchSummary(initialSummary ?? "");
            setResearchNextAction(initialNextAction ?? "");
        }
    }, [initialEffort, initialLastFinding, initialNextAction, initialPriority, initialSourceChannel, initialStatus, initialSummary, open]);

    const handleSave = async () => {
        if (!researchSummary.trim()) {
            alert("La opinion comercial es obligatoria para cerrar esta revision de investigacion.");
            return;
        }

        setLoading(true);
        const result = await updateInvestigationOpinion({
            companyId,
            researchPriority,
            researchEffort,
            researchStatus,
            researchSourceChannel: researchSourceChannel || undefined,
            researchLastFinding,
            researchSummary,
            researchNextAction,
        });
        setLoading(false);

        if (!result.success || !result.data) {
            alert("No se pudo guardar la opinion de investigacion.");
            return;
        }

        onSuccess?.({
            researchPriority,
            researchEffort,
            researchStatus,
            researchSourceChannel: researchSourceChannel || null,
            researchLastFinding: researchLastFinding || null,
            researchSummary: researchSummary || null,
            researchNextAction: researchNextAction || null,
            researchLastReviewedAt: result.data.researchLastReviewedAt
                ? new Date(result.data.researchLastReviewedAt)
                : new Date(),
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{triggerButton}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Opinion de Investigacion</DialogTitle>
                    <DialogDescription>
                        Resume lo encontrado en la base de importaciones y define si <strong>{companyName}</strong> merece prioridad en caceria.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Prioridad</Label>
                            <Select value={researchPriority} onValueChange={(value) => setResearchPriority(value as ResearchPriority)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HIGH">Alta</SelectItem>
                                    <SelectItem value="MEDIUM">Media</SelectItem>
                                    <SelectItem value="LOW">Baja</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Carga operativa</Label>
                            <Select value={researchEffort} onValueChange={(value) => setResearchEffort(value as ResearchEffort)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LIGHT">Ligera</SelectItem>
                                    <SelectItem value="MEDIUM">Media</SelectItem>
                                    <SelectItem value="HEAVY">Pesada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Estado</Label>
                                <Select value={researchStatus} onValueChange={(value) => setResearchStatus(value as ResearchStatus)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">Sin investigar</SelectItem>
                                        <SelectItem value="RESEARCHING">En investigacion</SelectItem>
                                        <SelectItem value="SOURCE_FOUND">Fuente encontrada</SelectItem>
                                        <SelectItem value="CONTACT_PENDING_VALIDATION">Contacto encontrado</SelectItem>
                                        <SelectItem value="BLOCKED">No ubicable</SelectItem>
                                        <SelectItem value="VISIT_REQUIRED">Requiere visita</SelectItem>
                                        <SelectItem value="ESCALATE_LATER">Escalar despues</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Ultimo canal investigado</Label>
                            <Select value={researchSourceChannel} onValueChange={(value) => setResearchSourceChannel(value as ResearchSourceChannel)}>
                                <SelectTrigger><SelectValue placeholder="Como se investigo esta cuenta" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GOOGLE">Google</SelectItem>
                                    <SelectItem value="WEBSITE">Website</SelectItem>
                                    <SelectItem value="WEB">Web</SelectItem>
                                    <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                                    <SelectItem value="FACEBOOK">Facebook</SelectItem>
                                    <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                                    <SelectItem value="CENTRAL_CALL">Llamada a central</SelectItem>
                                    <SelectItem value="VISIT">Visita</SelectItem>
                                    <SelectItem value="INTERNAL_REFERRAL">Referencia interna</SelectItem>
                                    <SelectItem value="DIRECTORY">Directorio</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                        <Label>Ultimo hallazgo</Label>
                        <Textarea
                            value={researchLastFinding}
                            onChange={(event) => setResearchLastFinding(event.target.value)}
                            placeholder="Ej. Usa FOB y canal verde la mayor parte del ano. Web solo muestra correo generico y se encontro un nombre en LinkedIn."
                            className="min-h-[80px]"
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Opinion comercial</Label>
                        <Textarea
                            value={researchSummary}
                            onChange={(event) => setResearchSummary(event.target.value)}
                            placeholder="Ej. Cuenta con buen potencial por su mix de incoterm y recurrencia. Vale priorizarla en caceria apenas se carguen contactos."
                            className="min-h-[96px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Siguiente accion sugerida</Label>
                        <Textarea
                            value={researchNextAction}
                            onChange={(event) => setResearchNextAction(event.target.value)}
                            placeholder="Ej. Buscar import manager en LinkedIn, revisar website y luego cargar todos los contactos encontrados."
                            className="min-h-[80px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Guardando..." : "Guardar criterio"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
