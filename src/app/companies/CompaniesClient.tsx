"use client";

import Link from "next/link";
import { Building2, FileSearch, MoreHorizontal, Pencil, Plus, Target, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompanyListItem } from "@/lib/crm-list-types";
import { matchesSearch } from "@/lib/search";
import { useScopedSearch } from "@/components/layout/SearchProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const ITEMS_PER_PAGE = 10;

const STAGE_LABELS = {
    COLD: "Base creada",
    PROSPECTING: "En caceria",
    QUALIFIED: "Con oportunidad",
    CUSTOMER: "Cliente",
    DISQUALIFIED: "Descartada",
} as const;

const STAGE_STYLES = {
    COLD: "border-slate-200 bg-slate-100 text-slate-700",
    PROSPECTING: "border-blue-200 bg-blue-100 text-blue-800",
    QUALIFIED: "border-emerald-200 bg-emerald-100 text-emerald-800",
    CUSTOMER: "border-violet-200 bg-violet-100 text-violet-800",
    DISQUALIFIED: "border-rose-200 bg-rose-100 text-rose-800",
} as const;

function formatDate(value: Date | string | null) {
    if (!value) return "Sin movimiento";
    return new Date(value).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
    });
}

function getCompanyMaturity(company: CompanyListItem) {
    const activeContacts = company.contacts.filter((contact) => contact.isActive).length;
    const hasHints = Boolean(company.dominantIncoterm || company.dominantCustomsChannel || company.tradeRole !== "NONE" || company.website || company.city || company.countryCode);

    if (company.opportunities.length > 0) {
        return {
            label: "Con oportunidad",
            tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
        };
    }

    if (activeContacts > 0) {
        return {
            label: "Con contactos",
            tone: "border-blue-200 bg-blue-50 text-blue-900",
        };
    }

    if (hasHints || company.researchLastReviewedAt) {
        return {
            label: "Enriquecida",
            tone: "border-amber-200 bg-amber-50 text-amber-900",
        };
    }

    return {
        label: "Base minima",
        tone: "border-slate-200 bg-slate-50 text-slate-700",
    };
}

export default function CompaniesClient({ initialCompanies }: { initialCompanies: CompanyListItem[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const { query: searchQuery } = useScopedSearch();

    const filteredCompanies = useMemo(
        () =>
            initialCompanies.filter((company) =>
                matchesSearch(
                    searchQuery,
                    company.businessName,
                    company.tradeName,
                    company.documentType,
                    company.documentNumber,
                    company.companyType,
                    company.tradeRole,
                    company.city,
                    company.countryCode,
                    company.website,
                    STAGE_LABELS[company.prospectingStatus],
                    company.dominantIncoterm || "",
                    company.dominantCustomsChannel || ""
                )
            ),
        [initialCompanies, searchQuery]
    );

    const effectivePage = searchQuery ? 1 : currentPage;
    const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
    const paginatedCompanies = filteredCompanies.slice((effectivePage - 1) * ITEMS_PER_PAGE, effectivePage * ITEMS_PER_PAGE);

    const metrics = useMemo(
        () => ({
            base: filteredCompanies.filter((company) => getCompanyMaturity(company).label === "Base minima").length,
            enriched: filteredCompanies.filter((company) => getCompanyMaturity(company).label === "Enriquecida").length,
            withContacts: filteredCompanies.filter((company) => company.contacts.some((contact) => contact.isActive)).length,
            withOpportunity: filteredCompanies.filter((company) => company.opportunities.length > 0).length,
        }),
        [filteredCompanies]
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
                    <p className="max-w-3xl text-muted-foreground">
                        Esta tabla debe funcionar como cuenta maestra del CRM. La alta inicial puede ser minima; el resto de informacion debe entrar despues desde investigacion, caceria y oportunidad.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/companies/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Empresa
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base minima</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.base}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enriquecidas</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.enriched}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Con contactos</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.withContacts}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Con oportunidad</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.withOpportunity}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cuenta maestra</TableHead>
                            <TableHead>Madurez</TableHead>
                            <TableHead>Estado CRM</TableHead>
                            <TableHead>Cobertura</TableHead>
                            <TableHead>Ultimo movimiento</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCompanies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No hay empresas registradas aun. La alta minima debe poder hacerse con RUC y Razon Social.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedCompanies.map((company) => {
                                const maturity = getCompanyMaturity(company);
                                const activeContacts = company.contacts.filter((contact) => contact.isActive).length;
                                return (
                                    <TableRow key={company.id}>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium">{company.businessName}</p>
                                                        {company.tradeName && (
                                                            <p className="text-xs text-muted-foreground">{company.tradeName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                    <span>{company.documentType}: {company.documentNumber}</span>
                                                    <span>{company.companyType}</span>
                                                    {company.tradeRole !== "NONE" && <span>{company.tradeRole}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={maturity.tone}>
                                                {maturity.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <Badge variant="outline" className={STAGE_STYLES[company.prospectingStatus]}>
                                                    {STAGE_LABELS[company.prospectingStatus]}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground">
                                                    {company.isActive ? "Registro activo" : "Registro inactivo"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span>{activeContacts} contacto(s) activo(s)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-3.5 w-3.5" />
                                                    <span>{company.opportunities.length} oportunidad(es)</span>
                                                </div>
                                                {(company.dominantIncoterm || company.dominantCustomsChannel) && (
                                                    <div className="flex items-center gap-2">
                                                        <FileSearch className="h-3.5 w-3.5" />
                                                        <span>
                                                            {company.dominantIncoterm ? `Incoterm ${company.dominantIncoterm}` : "Incoterm por descubrir"}
                                                            {company.dominantCustomsChannel ? ` / Canal ${company.dominantCustomsChannel}` : ""}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                <p>Creada: {formatDate(company.createdAt)}</p>
                                                <p>Ult. actividad: {formatDate(company.interactions[0]?.interactedAt ?? null)}</p>
                                                <p>Ult. revision: {formatDate(company.researchLastReviewedAt)}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/companies/${company.id}`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {(effectivePage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(effectivePage * ITEMS_PER_PAGE, filteredCompanies.length)} de {filteredCompanies.length} empresas
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                            Anterior
                        </Button>
                        <span className="text-sm font-medium">Pagina {effectivePage} de {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
