"use client";

import { useState } from "react";
import { updateCompanyStatus } from "@/app/actions/crm/company-actions";
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
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Skull, Trash2 } from "lucide-react";

interface DisqualifyModalProps {
    companyId: string;
    companyName: string;
    onSuccess?: () => void;
    triggerButton?: React.ReactNode;
}

const COMMON_REASONS = [
    "No tiene volumen / Importa muy poco",
    "Ya tiene contrato exclusivo con otro proveedor",
    "Es competencia directa",
    "Demasiado enfocado en precio (No rentable)",
    "No pudimos contactar tras varios intentos",
    "Otro motivo...",
];

export function DisqualifyModal({ companyId, companyName, onSuccess, triggerButton }: DisqualifyModalProps) {
    const [open, setOpen] = useState(false);
    const [reasonCategory, setReasonCategory] = useState<string>(COMMON_REASONS[0]);
    const [customReason, setCustomReason] = useState("");
    const handleSave = async () => {
        const finalReason = reasonCategory === "Otro motivo..." ? customReason : reasonCategory;

        const result = await updateCompanyStatus(companyId, "DISQUALIFIED", finalReason);

        if (result.success) {
            setOpen(false);
            if (onSuccess) onSuccess();
        } else {
            alert("Error descartando la empresa: " + result.error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || (
                    <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" /> Descalificar
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[450px] border-red-200">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <Skull className="h-5 w-5" /> Enviar al Cementerio
                    </DialogTitle>
                    <DialogDescription>
                        Estás a punto de descalificar a <strong>{companyName}</strong>. Esta empresa desaparecerá de tus bandejas diarias de prospección.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>¿Por qué la descartas?</Label>
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
                                placeholder="Ej: Solo importan mercadería prohibida..."
                                className="min-h-[80px]"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2">
                        <p className="text-xs text-red-800 leading-relaxed">
                            <strong>Nota:</strong> Este prospecto no será eliminado de la Base de Datos para mantener el historial (por si te los vuelves a cruzar en el futuro), pero ya no te estorbará en tu trabajo diario.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleSave} disabled={reasonCategory === "Otro motivo..." && !customReason}>Confirmar Descarte</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
