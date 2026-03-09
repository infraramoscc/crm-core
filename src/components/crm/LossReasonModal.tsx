"use client";

import { useState } from "react";
import { loseOpportunity } from "@/app/actions/crm/crm-actions";
import { Button } from "@/components/ui/button";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { HeartCrack } from "lucide-react";

interface LossReasonModalProps {
    opportunityId: string | null;
    opportunityTitle: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (reason: string) => void;
    onCancel: () => void;
}

const COMMON_REASONS = [
    "Tarifa Demasiado Alta (Perdimos por Precio)",
    "Problemas de Disponibilidad/Espacio Naviero",
    "El cliente decidió posponer la importación",
    "Mala atención o lentitud al cotizar",
    "Competencia ofreció mejores condiciones logísticas",
    "Falta de crédito / Problemas Financieros",
    "Otro motivo...",
];

export function LossReasonModal({ opportunityId, opportunityTitle, isOpen, onOpenChange, onSuccess, onCancel }: LossReasonModalProps) {
    const [reasonCategory, setReasonCategory] = useState<string>(COMMON_REASONS[0]);
    const [customReason, setCustomReason] = useState("");

    const handleSave = async () => {
        if (!opportunityId) return;

        const finalReason = reasonCategory === "Otro motivo..." ? customReason : reasonCategory;

        // Mandar Acción a Prisma
        const result = await loseOpportunity(opportunityId, finalReason);

        if (result.success) {
            onSuccess(finalReason);
            onOpenChange(false);
        } else {
            alert("No se pudo registrar la pérdida: " + result.error);
        }
    };

    const handleCancel = () => {
        onCancel();
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleCancel();
        }}>
            <DialogContent className="sm:max-w-[450px] border-red-200">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <HeartCrack className="h-5 w-5" /> Negocio Perdido
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de dar por perdida la oportunidad <strong>{opportunityTitle}</strong>. Para nutrir la Inteligencia Artificial a futuro, necesitamos saber por qué.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Motivo de Pérdida</Label>
                        <Select value={reasonCategory} onValueChange={setReasonCategory}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_REASONS.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {reasonCategory === "Otro motivo..." && (
                        <div className="space-y-2">
                            <Label>Detalla el motivo</Label>
                            <Textarea
                                placeholder="Ej: El cliente canceló la compra con el proveedor Chino..."
                                className="min-h-[80px]"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>Cancelar Movimiento</Button>
                    <Button variant="destructive" onClick={handleSave} disabled={reasonCategory === "Otro motivo..." && !customReason}>Guardar Razón y Perder</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
