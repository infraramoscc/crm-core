"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
    OpportunityFrequency,
    OpportunityServiceLine,
    OpportunityStage,
    ShipmentMode,
    ValueDriver,
} from "@prisma/client";
import { createOpportunity, updateOpportunity } from "@/app/actions/crm/crm-actions";
import type {
    OpportunityCompanyOption,
    OpportunityContactOption,
    OpportunityDetail,
} from "@/lib/crm-list-types";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface OpportunityFormProps {
    initialData?: OpportunityDetail;
    companies: OpportunityCompanyOption[];
    contacts: OpportunityContactOption[];
}

function toDateInput(value?: Date | null) {
    if (!value) return "";
    return value.toISOString().slice(0, 10);
}

function toDateTimeLocalInput(value?: Date | null) {
    if (!value) return "";
    return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function OpportunityForm({ initialData, companies, contacts }: OpportunityFormProps) {
    const router = useRouter();
    const isEditing = Boolean(initialData);
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useState(initialData?.companyId || companies[0]?.id || "");
    const [contactId, setContactId] = useState(initialData?.contactId || "none");
    const [stage, setStage] = useState<OpportunityStage>(initialData?.stage || "PROSPECTING");
    const [serviceLine, setServiceLine] = useState<OpportunityServiceLine>(initialData?.serviceLine || "FORWARDING");
    const [shipmentMode, setShipmentMode] = useState<ShipmentMode>(initialData?.shipmentMode || "SEA");
    const [operationFrequency, setOperationFrequency] = useState<OpportunityFrequency>(initialData?.operationFrequency || "SPOT");
    const [decisionDriver, setDecisionDriver] = useState<ValueDriver>(initialData?.decisionDriver || "UNKNOWN");
    const [expectedCurrency, setExpectedCurrency] = useState(initialData?.expectedCurrency || "USD");

    const companyContacts = useMemo(
        () => contacts.filter((contact) => contact.companyId === companyId),
        [companyId, contacts]
    );

    const handleCompanyChange = (value: string) => {
        setCompanyId(value);
        setContactId("none");
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const expectedValueRaw = (formData.get("expectedValue") as string).trim();

        const payload = {
            companyId,
            contactId: contactId !== "none" ? contactId : undefined,
            title: (formData.get("title") as string).trim(),
            stage,
            serviceLine,
            shipmentMode,
            operationFrequency,
            decisionDriver,
            originLabel: (formData.get("originLabel") as string).trim() || undefined,
            destinationLabel: (formData.get("destinationLabel") as string).trim() || undefined,
            incotermCode: (formData.get("incotermCode") as string).trim() || undefined,
            competitorName: (formData.get("competitorName") as string).trim() || undefined,
            nextStep: (formData.get("nextStep") as string).trim() || undefined,
            nextStepDate: (formData.get("nextStepDate") as string) || undefined,
            externalQuoteRef: (formData.get("externalQuoteRef") as string).trim() || undefined,
            externalQuoteIssuedAt: (formData.get("externalQuoteIssuedAt") as string) || undefined,
            expectedValue: expectedValueRaw ? Number(expectedValueRaw) : undefined,
            expectedCurrency,
            closeDate: (formData.get("closeDate") as string) || undefined,
        };

        const result = isEditing && initialData?.id
            ? await updateOpportunity(initialData.id, payload)
            : await createOpportunity(payload);

        setLoading(false);

        if (!result.success) {
            alert(result.error || "No se pudo guardar la oportunidad.");
            return;
        }

        router.push("/crm");
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Ficha Comercial de la Oportunidad</CardTitle>
                    <CardDescription>
                        Registra una operacion concreta que realmente pueda ganarse. La disciplina del pipeline depende de tener claro que se vende, a quien y cual es el siguiente paso.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="title">Nombre de la oportunidad</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={initialData?.title || ""}
                                placeholder="Ej. 4 FCL mensuales Ningbo-Callao con despacho aduanero"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Empresa</Label>
                            <Select value={companyId} onValueChange={handleCompanyChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona la cuenta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((company) => (
                                        <SelectItem key={company.id} value={company.id}>
                                            {company.businessName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Contacto clave</Label>
                            <Select value={contactId} onValueChange={setContactId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Quien mueve la decision" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin definir aun</SelectItem>
                                    {companyContacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            {contact.firstName} {contact.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Linea de servicio</Label>
                            <Select value={serviceLine} onValueChange={(value) => setServiceLine(value as OpportunityServiceLine)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FORWARDING">Forwarding internacional</SelectItem>
                                    <SelectItem value="CUSTOMS">Agenciamiento de aduanas</SelectItem>
                                    <SelectItem value="INLAND">Transporte local</SelectItem>
                                    <SelectItem value="INTEGRAL">Servicio integral</SelectItem>
                                    <SelectItem value="WAREHOUSE">Almacenaje</SelectItem>
                                    <SelectItem value="OTHER">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Modo operativo</Label>
                            <Select value={shipmentMode} onValueChange={(value) => setShipmentMode(value as ShipmentMode)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SEA">Maritimo</SelectItem>
                                    <SelectItem value="AIR">Aereo</SelectItem>
                                    <SelectItem value="LAND">Terrestre</SelectItem>
                                    <SelectItem value="MULTIMODAL">Multimodal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Frecuencia esperada</Label>
                            <Select value={operationFrequency} onValueChange={(value) => setOperationFrequency(value as OpportunityFrequency)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SPOT">Spot / puntual</SelectItem>
                                    <SelectItem value="RECURRENT">Recurrente</SelectItem>
                                    <SelectItem value="TENDER">Licitacion / concurso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Driver de compra</Label>
                            <Select value={decisionDriver} onValueChange={(value) => setDecisionDriver(value as ValueDriver)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRICE">Precio</SelectItem>
                                    <SelectItem value="EXPERIENCE">Experiencia / servicio</SelectItem>
                                    <SelectItem value="SPEED">Velocidad</SelectItem>
                                    <SelectItem value="UNKNOWN">Por descubrir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 rounded-lg border bg-muted/20 p-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="originLabel">Origen</Label>
                            <Input
                                id="originLabel"
                                name="originLabel"
                                defaultValue={initialData?.originLabel || ""}
                                placeholder="Ej. Ningbo / Shanghai / Miami"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destinationLabel">Destino</Label>
                            <Input
                                id="destinationLabel"
                                name="destinationLabel"
                                defaultValue={initialData?.destinationLabel || ""}
                                placeholder="Ej. Callao / Lima"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="incotermCode">Incoterm</Label>
                            <Input
                                id="incotermCode"
                                name="incotermCode"
                                defaultValue={initialData?.incotermCode || ""}
                                placeholder="Ej. FOB / CIF / EXW"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="competitorName">Competidor actual</Label>
                            <Input
                                id="competitorName"
                                name="competitorName"
                                defaultValue={initialData?.competitorName || ""}
                                placeholder="Ej. operador actual o agente con el que compites"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="nextStep">Siguiente paso comprometido</Label>
                            <Textarea
                                id="nextStep"
                                name="nextStep"
                                defaultValue={initialData?.nextStep || ""}
                                placeholder="Ej. reenviar comparativo, llamar luego de revisar recargos, confirmar booking forecast"
                                className="min-h-[90px]"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nextStepDate">Fecha del siguiente paso</Label>
                                <Input
                                    id="nextStepDate"
                                    name="nextStepDate"
                                    type="datetime-local"
                                    defaultValue={toDateTimeLocalInput(initialData?.nextStepDate)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="closeDate">Fecha estimada de cierre</Label>
                                <Input
                                    id="closeDate"
                                    name="closeDate"
                                    type="date"
                                    defaultValue={toDateInput(initialData?.closeDate)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 rounded-lg border border-amber-200 bg-amber-50/40 p-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="externalQuoteRef">Referencia de cotizacion externa</Label>
                            <Input
                                id="externalQuoteRef"
                                name="externalQuoteRef"
                                defaultValue={initialData?.externalQuoteRef || ""}
                                placeholder="Ej. COT-EXT-2026-0187"
                            />
                            <p className="text-xs text-muted-foreground">
                                Para este pipeline, pasar a negociacion sin referencia formal debilita el control comercial.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="externalQuoteIssuedAt">Fecha de envio de cotizacion</Label>
                            <Input
                                id="externalQuoteIssuedAt"
                                name="externalQuoteIssuedAt"
                                type="date"
                                defaultValue={toDateInput(initialData?.externalQuoteIssuedAt)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="expectedValue">Valor esperado</Label>
                            <div className="flex gap-2">
                                <Select value={expectedCurrency} onValueChange={setExpectedCurrency}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="PEN">PEN</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="expectedValue"
                                    name="expectedValue"
                                    type="number"
                                    step="0.01"
                                    defaultValue={initialData?.expectedValue ?? ""}
                                    placeholder="Monto estimado"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Etapa del pipeline</Label>
                            <Select value={stage} onValueChange={(value) => setStage(value as OpportunityStage)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PROSPECTING">Prospeccion</SelectItem>
                                    <SelectItem value="QUOTING">Cotizando</SelectItem>
                                    <SelectItem value="NEGOTIATING">Negociando</SelectItem>
                                    <SelectItem value="WON">Ganada</SelectItem>
                                    <SelectItem value="LOST">Perdida</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 border-t pt-6">
                        <Button type="button" variant="outline" onClick={() => router.push("/crm")}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : isEditing ? "Guardar Oportunidad" : "Crear Oportunidad"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
