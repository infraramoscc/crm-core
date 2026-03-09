"use client";

import Link from "next/link";
import { Search, Building2, Plus, MoreHorizontal, UserX, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { getCompaniesForInvestigation } from "@/app/actions/crm/company-actions";
import { DisqualifyModal } from "@/components/crm/DisqualifyModal";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function InvestigationInboxPage() {
    const [refresh, setRefresh] = useState(0);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeads() {
            setLoading(true);
            // Llamamos a la API súper optimizada que solo extrae lo necesario (ahorrando recursos DB)
            const res = await getCompaniesForInvestigation();

            if (res.success && res.data) {
                // Ya no filtramos en cliente. El backend nos da exactamente la data de Investigación filtrada.
                setCompanies(res.data);
            }
            setLoading(false);
        }
        fetchLeads();
    }, [refresh]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Search className="h-8 w-8 text-blue-500" />
                        Bandeja de Investigación
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Empresas que aún <strong>no tienen contactos asignados</strong > o todos sus contactos conocidos <strong>han sido descartados</strong> como inactivos.
                    </p>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Razón Social / RUC</TableHead>
                            <TableHead>Cantidad de DAMs</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acción Requerida</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && companies.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Cargando empresas sin contacto...
                                </TableCell>
                            </TableRow>
                        )}
                        {companies.map((company) => {
                            const inactiveContacts = company.contacts?.filter((c: any) => c.isActive === false) || [];
                            const hasOnlyInactiveContacts = inactiveContacts.length > 0;

                            return (
                                <TableRow key={company.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium leading-none">{company.businessName}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{company.documentType}: {company.documentNumber}</p>

                                                {/* Render amigable del historial de contactos descartados para contexto rápido */}
                                                {hasOnlyInactiveContacts && (
                                                    <div className="flex flex-col gap-1 mt-3 p-2 bg-muted/30 rounded-md border border-muted">
                                                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                                                            <Info className="h-3 w-3" /> Motivos de Descarte Previos
                                                        </span>
                                                        {inactiveContacts.map((ic: any, index: number) => (
                                                            <p key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                                                                <UserX className="h-3 w-3 mt-[2px] shrink-0 text-red-400" />
                                                                <span className="line-clamp-2">
                                                                    <strong>{ic.firstName}:</strong> {ic.inactiveReason || "Sin justificación"}
                                                                </span>
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {company.annualDams !== null && company.annualDams !== undefined ? (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                                {company.annualDams} DAMs
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground font-normal">Sin Datos</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {hasOnlyInactiveContacts ? (
                                            <Badge variant="destructive" className="bg-red-50 text-red-800 border-red-200 hover:bg-red-100 border focus:ring-0">Contactos Inactivos</Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border focus:ring-0 text-[10px]">0 Contactos</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`https://www.google.com/search?q=${encodeURIComponent(company.businessName + ' linkedin')}`} target="_blank" rel="noopener noreferrer">
                                                <Search className="h-4 w-4 mr-2" /> Google/LinkedIn
                                            </a>
                                        </Button>
                                        <Button size="sm" asChild>
                                            <Link href={`/companies/${company.id}?tab=contacts`}>
                                                <Plus className="h-4 w-4 mr-2" /> Agregar Info
                                            </Link>
                                        </Button>
                                        <DisqualifyModal
                                            companyId={company.id}
                                            companyName={company.businessName}
                                            onSuccess={() => setRefresh(prev => prev + 1)}
                                            triggerButton={
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            )
                        })}

                        {(!loading && companies.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No hay empresas pendientes de investigación. ¡Buen trabajo!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
