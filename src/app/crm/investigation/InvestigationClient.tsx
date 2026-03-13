"use client";

import Link from "next/link";
import { Search, Building2, Plus, MoreHorizontal, UserX, Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { InvestigationCompanyItem } from "@/lib/crm-list-types";
import { matchesSearch } from "@/lib/search";
import { DisqualifyModal } from "@/components/crm/DisqualifyModal";
import { useScopedSearch } from "@/components/layout/SearchProvider";

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

export default function InvestigationClient({ initialCompanies }: { initialCompanies: InvestigationCompanyItem[] }) {
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const { query: searchQuery } = useScopedSearch();
    const itemsPerPage = 10;

    const filteredCompanies = useMemo(
        () =>
            initialCompanies.filter((company) =>
                matchesSearch(searchQuery, company.businessName, company.documentType, company.documentNumber, company.annualDams, company.contacts.map((contact) => `${contact.firstName} ${contact.lastName} ${contact.inactiveReason || ""}`))
            ),
        [initialCompanies, searchQuery]
    );

    const effectivePage = searchQuery ? 1 : currentPage;
    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const paginatedCompanies = filteredCompanies.slice(
        (effectivePage - 1) * itemsPerPage,
        effectivePage * itemsPerPage
    );

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
                        {paginatedCompanies.map((company) => {
                            const inactiveContacts = company.contacts.filter((contact) => contact.isActive === false);
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
                                                        {inactiveContacts.map((ic, index: number) => (
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

                        {filteredCompanies.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No hay empresas pendientes de investigación. ¡Buen trabajo!
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {(effectivePage - 1) * itemsPerPage + 1} a {Math.min(effectivePage * itemsPerPage, filteredCompanies.length)} de {filteredCompanies.length} empresas
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <span className="text-sm font-medium">
                            Página {effectivePage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
