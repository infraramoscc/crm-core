"use client";

import Link from "next/link";
import { useState } from "react";
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    DollarSign,
    FileText,
    GripVertical,
    MessageSquarePlus,
    MoreHorizontal,
    Route,
    ShieldAlert,
    UserRound,
} from "lucide-react";
import type { OpportunityStage } from "@prisma/client";
import { matchesSearch } from "@/lib/search";
import type { OpportunityPipelineItem } from "@/lib/crm-list-types";
import { LogInteractionModal } from "@/components/crm/LogInteractionModal";
import { LossReasonModal } from "@/components/crm/LossReasonModal";
import { moveOpportunityStage } from "@/app/actions/crm/crm-actions";
import { useRouter } from "next/navigation";
import { useScopedSearch } from "@/components/layout/SearchProvider";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STAGES: { value: OpportunityStage; label: string; color: string; help: string }[] = [
    { value: "PROSPECTING", label: "Prospeccion", color: "border-blue-200 bg-blue-50", help: "Necesidad detectada, pero aun falta definir operacion y decisor." },
    { value: "QUOTING", label: "Cotizando", color: "border-amber-200 bg-amber-50", help: "La operacion ya se entendio y se esta armando la propuesta." },
    { value: "NEGOTIATING", label: "Negociando", color: "border-purple-200 bg-purple-50", help: "Ya existe propuesta enviada y ahora toca empujar decision." },
    { value: "WON", label: "Ganada", color: "border-emerald-200 bg-emerald-50", help: "Cuenta cerrada y lista para ejecucion." },
    { value: "LOST", label: "Perdida", color: "border-red-200 bg-red-50", help: "Negocio que se salio del embudo con razon registrada." },
];

const SERVICE_LINE_LABELS = {
    FORWARDING: "Forwarding",
    CUSTOMS: "Aduanas",
    INLAND: "Transporte",
    INTEGRAL: "Integral",
    WAREHOUSE: "Almacen",
    OTHER: "Otro",
} as const;

const SHIPMENT_MODE_LABELS = {
    SEA: "Maritimo",
    AIR: "Aereo",
    LAND: "Terrestre",
    MULTIMODAL: "Multimodal",
} as const;

const FREQUENCY_LABELS = {
    SPOT: "Spot",
    RECURRENT: "Recurrente",
    TENDER: "Tender",
} as const;

const DRIVER_LABELS = {
    PRICE: "Precio",
    EXPERIENCE: "Servicio",
    SPEED: "Velocidad",
    UNKNOWN: "Por descubrir",
} as const;

function formatShortDate(value?: Date | null) {
    return value ? new Date(value).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) : null;
}

function getRouteLabel(opportunity: OpportunityPipelineItem) {
    if (!opportunity.originLabel && !opportunity.destinationLabel) {
        return null;
    }

    return `${opportunity.originLabel || "Origen por definir"} -> ${opportunity.destinationLabel || "Destino por definir"}`;
}

function getCommercialWarnings(opportunity: OpportunityPipelineItem) {
    const warnings: string[] = [];

    if ((opportunity.stage === "QUOTING" || opportunity.stage === "NEGOTIATING") && !opportunity.externalQuoteRef) {
        warnings.push("Falta referencia de cotizacion");
    }

    if (opportunity.stage !== "WON" && opportunity.stage !== "LOST" && !opportunity.nextStep) {
        warnings.push("Sin siguiente paso");
    }

    if (opportunity.nextStepDate && opportunity.stage !== "WON" && opportunity.stage !== "LOST" && opportunity.nextStepDate < new Date()) {
        warnings.push("Seguimiento vencido");
    }

    return warnings;
}

function sortBySalesPriority(opportunities: OpportunityPipelineItem[]) {
    return [...opportunities].sort((a, b) => {
        const aWarnings = getCommercialWarnings(a).length;
        const bWarnings = getCommercialWarnings(b).length;
        if (aWarnings !== bWarnings) {
            return bWarnings - aWarnings;
        }

        const aNext = a.nextStepDate ? new Date(a.nextStepDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bNext = b.nextStepDate ? new Date(b.nextStepDate).getTime() : Number.MAX_SAFE_INTEGER;
        if (aNext !== bNext) {
            return aNext - bNext;
        }

        const aClose = a.closeDate ? new Date(a.closeDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bClose = b.closeDate ? new Date(b.closeDate).getTime() : Number.MAX_SAFE_INTEGER;
        if (aClose !== bClose) {
            return aClose - bClose;
        }

        return (b.expectedValue || 0) - (a.expectedValue || 0);
    });
}

export default function PipelineClient({ initialOpportunities }: { initialOpportunities: OpportunityPipelineItem[] }) {
    const router = useRouter();
    const { query: searchQuery } = useScopedSearch();
    const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<OpportunityStage | null>(null);
    const [optimisticOpps, setOptimisticOpps] = useState<OpportunityPipelineItem[]>(initialOpportunities);
    const [lossModalOpen, setLossModalOpen] = useState(false);
    const [pendingLossOppId, setPendingLossOppId] = useState<string | null>(null);
    const [pendingLossOppTitle, setPendingLossOppTitle] = useState("");

    const opportunities = optimisticOpps.length > 0 ? optimisticOpps : initialOpportunities;
    const oppsToRender = opportunities.filter((opportunity) =>
        matchesSearch(
            searchQuery,
            opportunity.title,
            opportunity.company.businessName,
            `${opportunity.contact?.firstName || ""} ${opportunity.contact?.lastName || ""}`,
            opportunity.externalQuoteRef,
            opportunity.originLabel,
            opportunity.destinationLabel,
            opportunity.nextStep,
            opportunity.competitorName,
            opportunity.incotermCode,
            opportunity.serviceLine,
            opportunity.shipmentMode,
            opportunity.operationFrequency,
            opportunity.stage,
            opportunity.lossReason,
            opportunity.decisionDriver
        )
    );

    const handleDragStart = (event: React.DragEvent, opportunityId: string) => {
        setDraggedOppId(opportunityId);
        setTimeout(() => {
            if (event.target instanceof HTMLElement) {
                event.target.style.opacity = "0.4";
            }
        }, 0);
    };

    const handleDragEnd = (event: React.DragEvent) => {
        setDraggedOppId(null);
        setDragOverStage(null);
        if (event.target instanceof HTMLElement) {
            event.target.style.opacity = "1";
        }
    };

    const handleDragOver = (event: React.DragEvent, stage: OpportunityStage) => {
        event.preventDefault();
        setDragOverStage(stage);
    };

    const handleDrop = async (event: React.DragEvent, stage: OpportunityStage) => {
        event.preventDefault();
        setDragOverStage(null);

        if (!draggedOppId) return;

        const opportunity = optimisticOpps.find((item) => item.id === draggedOppId);
        if (!opportunity || opportunity.stage === stage) return;

        if (stage === "LOST") {
            setPendingLossOppId(opportunity.id);
            setPendingLossOppTitle(opportunity.title);
            setLossModalOpen(true);
            return;
        }

        if (stage === "NEGOTIATING" && !opportunity.externalQuoteRef) {
            alert("Antes de pasar a negociacion registra la referencia de la cotizacion enviada.");
            return;
        }

        const previous = optimisticOpps;
        setOptimisticOpps((current) => current.map((item) => item.id === draggedOppId ? { ...item, stage } : item));

        const result = await moveOpportunityStage(draggedOppId, stage);
        if (!result.success) {
            setOptimisticOpps(previous);
            alert(result.error || "No se pudo mover la oportunidad.");
            return;
        }

        router.refresh();
    };

    return (
        <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline Comercial</h1>
                    <p className="text-muted-foreground">
                        Gestiona operaciones reales. Cada tarjeta debe decir que se vende, que falta y cual es el siguiente paso.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/crm/opportunities/new">Nueva Oportunidad</Link>
                </Button>
            </div>

            <div className="flex h-full flex-1 gap-4 overflow-x-auto pb-4">
                {STAGES.map((stage) => {
                    const columnOpps = sortBySalesPriority(oppsToRender.filter((opportunity) => opportunity.stage === stage.value));
                    const totalValue = columnOpps.reduce((sum, opportunity) => sum + (opportunity.expectedValue || 0), 0);

                    return (
                        <div
                            key={stage.value}
                            className={`flex min-w-[340px] max-w-[420px] flex-1 flex-col rounded-lg border p-4 transition-colors ${
                                dragOverStage === stage.value
                                    ? "border-dashed border-primary/50 bg-muted/80"
                                    : "border-border/50 bg-muted/30"
                            }`}
                            onDragOver={(event) => handleDragOver(event, stage.value)}
                            onDrop={(event) => handleDrop(event, stage.value)}
                        >
                            <div className="mb-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-sm">{stage.label}</h3>
                                        <Badge variant="secondary" className="rounded-full">{columnOpps.length}</Badge>
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        ${totalValue.toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{stage.help}</p>
                            </div>

                            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                                {columnOpps.map((opportunity) => {
                                    const routeLabel = getRouteLabel(opportunity);
                                    const warnings = getCommercialWarnings(opportunity);
                                    const quoteSent = Boolean(opportunity.externalQuoteRef);
                                    const nextStepOverdue = Boolean(
                                        opportunity.nextStepDate &&
                                        opportunity.stage !== "WON" &&
                                        opportunity.stage !== "LOST" &&
                                        opportunity.nextStepDate < new Date()
                                    );

                                    return (
                                        <Card
                                            key={opportunity.id}
                                            draggable
                                            onDragStart={(event) => handleDragStart(event, opportunity.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`cursor-grab border-l-4 shadow-sm transition-colors duration-200 active:cursor-grabbing ${stage.color}`}
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-start gap-2">
                                                            <GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <h4 className="line-clamp-2 text-sm font-semibold text-foreground" title={opportunity.title}>
                                                                    {opportunity.title}
                                                                </h4>
                                                                <p className="mt-1 text-xs text-muted-foreground">{opportunity.company.businessName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 pl-6">
                                                            <Badge variant="outline">{SERVICE_LINE_LABELS[opportunity.serviceLine]}</Badge>
                                                            <Badge variant="outline">{SHIPMENT_MODE_LABELS[opportunity.shipmentMode]}</Badge>
                                                            <Badge variant="outline">{FREQUENCY_LABELS[opportunity.operationFrequency]}</Badge>
                                                        </div>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-6 w-6 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/crm/opportunities/${opportunity.id}`}>Editar oportunidad</Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4 p-4 pt-0">
                                                {routeLabel && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Route className="h-3.5 w-3.5" />
                                                        <span className="line-clamp-1">{routeLabel}</span>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="rounded-md bg-muted/50 p-2">
                                                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Driver</span>
                                                        <span className="font-medium">{DRIVER_LABELS[opportunity.decisionDriver]}</span>
                                                    </div>
                                                    <div className="rounded-md bg-muted/50 p-2">
                                                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Incoterm</span>
                                                        <span className="font-medium">{opportunity.incotermCode || "No definido"}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 rounded-md border bg-background/70 p-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <UserRound className="h-3.5 w-3.5" />
                                                            Contacto clave
                                                        </span>
                                                        <span className="font-medium">
                                                            {opportunity.contact
                                                                ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
                                                                : "Sin definir"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <FileText className="h-3.5 w-3.5" />
                                                            Cotizacion
                                                        </span>
                                                        <span className={`font-medium ${quoteSent ? "text-emerald-700" : "text-amber-700"}`}>
                                                            {opportunity.externalQuoteRef || "Pendiente"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            Proximo paso
                                                        </span>
                                                        <span className={`font-medium ${nextStepOverdue ? "text-red-600" : ""}`}>
                                                            {formatShortDate(opportunity.nextStepDate) || "Sin fecha"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {opportunity.nextStep && (
                                                    <div className="rounded-md bg-muted/40 p-3 text-xs text-foreground">
                                                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Siguiente paso</span>
                                                        <p className="mt-1 line-clamp-3">{opportunity.nextStep}</p>
                                                    </div>
                                                )}

                                                {warnings.length > 0 && (
                                                    <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                                                        {warnings.map((warning) => (
                                                            <div key={warning} className="flex items-center gap-2 text-xs font-medium text-amber-800">
                                                                {warning === "Seguimiento vencido"
                                                                    ? <AlertTriangle className="h-3.5 w-3.5" />
                                                                    : <ShieldAlert className="h-3.5 w-3.5" />}
                                                                <span>{warning}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-xs font-medium text-emerald-700">
                                                            <DollarSign className="mr-1 h-3.5 w-3.5" />
                                                            {opportunity.expectedValue?.toLocaleString() || "0"} {opportunity.expectedCurrency}
                                                        </div>
                                                        {opportunity.closeDate && (
                                                            <div className="flex items-center text-xs text-muted-foreground">
                                                                <Calendar className="mr-1 h-3 w-3" />
                                                                Cierre {formatShortDate(opportunity.closeDate)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <LogInteractionModal
                                                            companyId={opportunity.companyId}
                                                            opportunityId={opportunity.id}
                                                            contacts={opportunity.company.contacts}
                                                            onSuccess={() => router.refresh()}
                                                            triggerButton={
                                                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                                                                    <MessageSquarePlus className="h-3.5 w-3.5" />
                                                                </Button>
                                                            }
                                                        />
                                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                            <Link href={`/crm/opportunities/${opportunity.id}`}>
                                                                <ArrowRight className="h-3.5 w-3.5" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>

                                                {opportunity.stage === "LOST" && opportunity.lossReason && (
                                                    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                                                        <span>{opportunity.lossReason}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {columnOpps.length === 0 && (
                                    <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-sm text-muted-foreground">
                                        Sin oportunidades
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <LossReasonModal
                isOpen={lossModalOpen}
                onOpenChange={setLossModalOpen}
                opportunityId={pendingLossOppId}
                opportunityTitle={pendingLossOppTitle}
                onCancel={() => {
                    setPendingLossOppId(null);
                    setPendingLossOppTitle("");
                }}
                onSuccess={(reason) => {
                    setOptimisticOpps((current) =>
                        current.map((opportunity) =>
                            opportunity.id === pendingLossOppId
                                ? { ...opportunity, stage: "LOST", lossReason: reason }
                                : opportunity
                        )
                    );
                    router.refresh();
                    setPendingLossOppId(null);
                    setPendingLossOppTitle("");
                    setDraggedOppId(null);
                }}
            />
        </div>
    );
}
