"use client";

import Link from "next/link";
import { Plus, MoreHorizontal, Calendar, DollarSign, Building, MessageSquarePlus, AlertTriangle } from "lucide-react";
import { mockCompanies, mockContacts, type OpportunityStage } from "@/lib/mock-data";
import { matchesSearch } from "@/lib/search";
import { LogInteractionModal } from "@/components/crm/LogInteractionModal";
import { LossReasonModal } from "@/components/crm/LossReasonModal";
import { useState } from "react";
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

const STAGES: { value: OpportunityStage; label: string; color: string }[] = [
    { value: "PROSPECTING", label: "Prospección", color: "border-blue-200 bg-blue-50" },
    { value: "QUOTING", label: "Cotizando", color: "border-amber-200 bg-amber-50" },
    { value: "NEGOTIATING", label: "En Negociación", color: "border-purple-200 bg-purple-50" },
    { value: "WON", label: "Ganada (Cerrada)", color: "border-emerald-200 bg-emerald-50" },
    { value: "LOST", label: "Perdida", color: "border-red-200 bg-red-50" },
];

export default function PipelineClient({ initialOpportunities }: { initialOpportunities: any[] }) {
    const router = useRouter();
    const { query: searchQuery } = useScopedSearch();

    // D&D State
    const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<OpportunityStage | null>(null);

    // Occurred a drag drop locally, keep track of optimistic state
    const [optimisticOpps, setOptimisticOpps] = useState<any[]>(initialOpportunities);

    // Cuando llegan nuevos props del server, sincronizamos
    // Si estuviéramos usando React 19 optimisic updates sería diferente, 
    // pero useEffect sincronizando prop funciona bien para tableros simples.
    // Para simplificar, confiaremos en refresh de router y set optimista.

    // Loss Modal State
    const [lossModalOpen, setLossModalOpen] = useState(false);
    const [pendingLossOppId, setPendingLossOppId] = useState<string | null>(null);
    const [pendingLossOppTitle, setPendingLossOppTitle] = useState("");

    const getCompanyById = (id: string) => mockCompanies.find(c => c.id === id);

    const handleDragStart = (e: React.DragEvent, oppId: string) => {
        setDraggedOppId(oppId);
        setTimeout(() => {
            if (e.target instanceof HTMLElement) {
                e.target.style.opacity = '0.4';
            }
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedOppId(null);
        setDragOverStage(null);
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '1';
        }
    };

    const handleDragOver = (e: React.DragEvent, stage: OpportunityStage) => {
        e.preventDefault();
        setDragOverStage(stage);
    };

    const handleDrop = async (e: React.DragEvent, stage: OpportunityStage) => {
        e.preventDefault();
        setDragOverStage(null);

        if (!draggedOppId) return;

        const opp = optimisticOpps.find(o => o.id === draggedOppId);
        if (!opp || opp.stage === stage) return;

        if (stage === "LOST") {
            setPendingLossOppTitle(opp.title);
            setPendingLossOppId(opp.id);
            setLossModalOpen(true);
            return;
        }

        // Actualización optimista
        setOptimisticOpps(prev => prev.map(o => o.id === draggedOppId ? { ...o, stage } : o));

        // DB Update
        await moveOpportunityStage(draggedOppId, stage);
        router.refresh();
    };

    const oppsToRender = (optimisticOpps.length > 0 ? optimisticOpps : initialOpportunities).filter((opp) =>
        matchesSearch(searchQuery, opp.title, opp.company?.businessName, getCompanyById(opp.companyId)?.businessName, opp.expectedCurrency, opp.stage, opp.lossReason)
    );

    return (
        <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline de Ventas (CRM)</h1>
                    <p className="text-muted-foreground">
                        Visualiza y gestiona las Oportunidades comerciales y Tarifarios en curso.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/crm/opportunities/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Oportunidad
                    </Link>
                </Button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 h-full flex-1">
                {STAGES.map((stage) => {
                    const columnOpps = oppsToRender.filter(opp => opp.stage === stage.value);
                    const totalValue = columnOpps.reduce((sum, opp) => sum + (opp.expectedValue || 0), 0);

                    return (
                        <div
                            key={stage.value}
                            className={`flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-lg border p-4 transition-colors ${dragOverStage === stage.value ? 'bg-muted/80 border-primary/50 border-dashed' : 'bg-muted/30 border-border/50'
                                }`}
                            onDragOver={(e) => handleDragOver(e, stage.value)}
                            onDrop={(e) => handleDrop(e, stage.value)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm">{stage.label}</h3>
                                    <Badge variant="secondary" className="rounded-full">{columnOpps.length}</Badge>
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">
                                    ${totalValue.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                                {columnOpps.map(opp => {
                                    // Fallback UI para la compañía asociada de la DB
                                    const companyName = opp.company?.businessName || getCompanyById(opp.companyId)?.businessName || "Empresa Desconocida";
                                    return (
                                        <Card
                                            key={opp.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, opp.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`shadow-sm border-l-4 ${stage.color} hover:border-primary transition-colors duration-200 cursor-grab active:cursor-grabbing`}
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-2" title={opp.title}>
                                                        {opp.title}
                                                    </h4>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-6 w-6 p-0 -mt-1 -mr-2">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/crm/opportunities/${opp.id}`}>Editar</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>Crear Cotización</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                                    <Building className="h-3.5 w-3.5" />
                                                    <span className="truncate">{companyName}</span>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-0.5 rounded-sm">
                                                            <DollarSign className="h-3 w-3 mr-0.5" />
                                                            {opp.expectedValue?.toLocaleString()} {opp.expectedCurrency}
                                                        </div>
                                                        {(opp as any).lossReason && stage.value === ("LOST" as any) && (
                                                            <div className="text-red-500 hover:text-red-700 transition flex items-center" title={`Motivo de pérdida: ${(opp as any).lossReason}`}>
                                                                <AlertTriangle className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {opp.closeDate && (
                                                        <div className="flex items-center text-xs text-muted-foreground mr-2">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {new Date(opp.closeDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                                        </div>
                                                    )}

                                                    {opp.companyId && (
                                                        <LogInteractionModal
                                                            companyId={opp.companyId}
                                                            opportunityId={opp.id}
                                                            contacts={mockContacts.filter(c => c.companyId === opp.companyId)}
                                                            onSuccess={() => router.refresh()}
                                                            triggerButton={
                                                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-full text-blue-600 border-blue-200 hover:bg-blue-50">
                                                                    <MessageSquarePlus className="h-3.5 w-3.5" />
                                                                </Button>
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {columnOpps.length === 0 && (
                                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm h-32">
                                        Sin Oportunidades
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
                    // Update locally
                    setOptimisticOpps(prev => prev.map(o => o.id === pendingLossOppId ? { ...o, stage: "LOST", lossReason: reason } : o));
                    router.refresh();
                    setPendingLossOppId(null);
                    setPendingLossOppTitle("");
                    setDraggedOppId(null);
                }}
            />
        </div>
    );
}
