"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, ExternalLink, Globe, Info, Linkedin, MoreHorizontal, Plus, Search, UserRoundSearch, UserX } from "lucide-react";
import type { InvestigationCompanyItem, InvestigationContactItem } from "@/lib/crm-list-types";
import { InvestigationOpinionModal } from "@/components/crm/InvestigationOpinionModal";
import { DisqualifyModal } from "@/components/crm/DisqualifyModal";
import { useScopedSearch } from "@/components/layout/SearchProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { matchesSearch } from "@/lib/search";

type InvestigationFilter =
    | "all"
    | "no-contact"
    | "with-opinion"
    | "blocked";

const PRIORITY_STYLES = {
    HIGH: "border-emerald-200 bg-emerald-100 text-emerald-800",
    MEDIUM: "border-amber-200 bg-amber-100 text-amber-800",
    LOW: "border-slate-200 bg-slate-100 text-slate-700",
} as const;

const PRIORITY_LABELS = {
    HIGH: "Prioridad alta",
    MEDIUM: "Prioridad media",
    LOW: "Prioridad baja",
} as const;

const EFFORT_STYLES = {
    LIGHT: "border-sky-200 bg-sky-100 text-sky-800",
    MEDIUM: "border-orange-200 bg-orange-100 text-orange-800",
    HEAVY: "border-rose-200 bg-rose-100 text-rose-800",
} as const;

const EFFORT_LABELS = {
    LIGHT: "Carga ligera",
    MEDIUM: "Carga media",
    HEAVY: "Carga pesada",
} as const;

const STATUS_STYLES = {
    NEW: "border-slate-200 bg-slate-100 text-slate-700",
    RESEARCHING: "border-blue-200 bg-blue-100 text-blue-800",
    SOURCE_FOUND: "border-emerald-200 bg-emerald-100 text-emerald-800",
    CONTACT_PENDING_VALIDATION: "border-amber-200 bg-amber-100 text-amber-800",
    BLOCKED: "border-rose-200 bg-rose-100 text-rose-800",
    VISIT_REQUIRED: "border-violet-200 bg-violet-100 text-violet-800",
    ESCALATE_LATER: "border-slate-300 bg-slate-100 text-slate-700",
} as const;

const STATUS_LABELS = {
    NEW: "Sin investigar",
    RESEARCHING: "En investigacion",
    SOURCE_FOUND: "Fuente encontrada",
    CONTACT_PENDING_VALIDATION: "Contacto encontrado",
    BLOCKED: "No ubicable",
    VISIT_REQUIRED: "Requiere visita",
    ESCALATE_LATER: "Escalar despues",
} as const;

const SOURCE_LABELS = {
    GOOGLE: "Google",
    WEBSITE: "Website",
    WEB: "Web",
    LINKEDIN: "LinkedIn",
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    CENTRAL_CALL: "Llamada a central",
    VISIT: "Visita",
    INTERNAL_REFERRAL: "Referencia interna",
    DIRECTORY: "Directorio",
    OTHER: "Otro",
} as const;

const PRIORITY_WEIGHT = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
const STATUS_WEIGHT = {
    CONTACT_PENDING_VALIDATION: 5,
    SOURCE_FOUND: 4,
    RESEARCHING: 3,
    NEW: 2,
    VISIT_REQUIRED: 1,
    ESCALATE_LATER: 0,
    BLOCKED: 0,
} as const;

function formatReviewedAt(date: Date | string | null) {
    if (!date) return "Sin revision registrada";
    return `Ultima revision: ${new Date(date).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
    })}`;
}

function getInvestigationAge(createdAt: Date | string) {
    const created = new Date(createdAt);
    const today = new Date();
    const diffMs = today.getTime() - created.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return diffDays === 0 ? "Ingreso hoy" : `${diffDays} dias en bandeja`;
}

function hasAnyChannel(contact: InvestigationContactItem) {
    return contact.emails.length > 0 || contact.phones.length > 0 || Boolean(contact.linkedin?.trim());
}

function hasResearchOpinion(company: InvestigationCompanyItem) {
    return Boolean(company.researchSummary?.trim()) && Boolean(company.researchLastReviewedAt);
}

function getPrimaryChannel(contact: InvestigationContactItem) {
    if (contact.emails.length > 0) return "Email";
    if (contact.phones.length > 0) return "Telefono";
    if (contact.linkedin?.trim()) return "LinkedIn";
    return "Sin canal visible";
}

function getPerceivedValue(company: InvestigationCompanyItem) {
    if (company.researchPriority === "HIGH") return "Vale tiempo ahora";
    if (company.researchPriority === "MEDIUM") return "Vale seguimiento";
    return "Vale revisar despues";
}

function getOperationalRead(company: InvestigationCompanyItem) {
    if (company.researchEffort === "HEAVY") return "Se percibe demandante para operacion.";
    if (company.researchEffort === "MEDIUM") return "Carga operativa moderada.";
    return "Carga operativa relativamente ligera.";
}

function getInvestigationFlowMessage(company: InvestigationCompanyItem) {
    const activeContacts = company.contacts.filter((contact) => contact.isActive);

    if (activeContacts.length === 0) {
        return {
            tone: "border-amber-200 bg-amber-50 text-amber-900",
            title: "Falta al menos un contacto",
            body: "Investigacion solo necesita dejar al menos un contacto activo. La opinion comercial aqui es opcional y tambien puede registrarse despues desde caceria.",
        };
    }

    return {
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
        title: "Lista para pasar a caceria",
        body: hasResearchOpinion(company)
            ? "Esta cuenta ya tiene contacto activo y opinion comercial. En cuanto refresque la bandeja, saldra de investigacion."
            : "Esta cuenta ya tiene contacto activo. En cuanto refresque la bandeja, saldra de investigacion y podras completar la opinion comercial desde caceria.",
    };
}

function getWebsiteUrl(website: string) {
    return website.startsWith("http://") || website.startsWith("https://") ? website : `https://${website}`;
}

function hasActiveContacts(company: InvestigationCompanyItem) {
    return company.contacts.some((contact) => contact.isActive);
}

function matchesInvestigationFilter(company: InvestigationCompanyItem, filter: InvestigationFilter) {
    const activeContacts = hasActiveContacts(company);
    const hasOpinion = hasResearchOpinion(company);
    const isBlocked = company.researchStatus === "BLOCKED" || company.researchStatus === "VISIT_REQUIRED";

    switch (filter) {
        case "no-contact":
            return !activeContacts;
        case "with-opinion":
            return hasOpinion;
        case "blocked":
            return isBlocked;
        case "all":
        default:
            return true;
    }
}

export default function InvestigationClient({ initialCompanies }: { initialCompanies: InvestigationCompanyItem[] }) {
    const [companies, setCompanies] = useState(initialCompanies);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState<InvestigationFilter>("all");
    const { query: searchQuery } = useScopedSearch();
    const itemsPerPage = 10;

    useEffect(() => {
        setCompanies(initialCompanies);
    }, [initialCompanies]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter]);

    const searchedCompanies = useMemo(
        () =>
            companies
                .filter((company) =>
                    matchesSearch(
                        searchQuery,
                        company.businessName,
                        company.documentType,
                        company.documentNumber,
                        company.annualDams,
                        company.dominantIncoterm || "",
                        company.dominantCustomsChannel || "",
                        PRIORITY_LABELS[company.researchPriority],
                        EFFORT_LABELS[company.researchEffort],
                        STATUS_LABELS[company.researchStatus],
                        company.researchSourceChannel ? SOURCE_LABELS[company.researchSourceChannel] : "",
                        company.researchLastFinding || "",
                        company.researchSummary || "",
                        company.researchNextAction || "",
                        company.contacts.map((contact) =>
                            `${contact.firstName} ${contact.lastName} ${contact.position || ""} ${contact.sourceChannel ? SOURCE_LABELS[contact.sourceChannel] : ""}`
                        )
                    )
                )
                .sort((left, right) => {
                    const priorityGap = PRIORITY_WEIGHT[right.researchPriority] - PRIORITY_WEIGHT[left.researchPriority];
                    if (priorityGap !== 0) return priorityGap;

                    const statusGap = STATUS_WEIGHT[right.researchStatus] - STATUS_WEIGHT[left.researchStatus];
                    if (statusGap !== 0) return statusGap;

                    return (right.annualDams ?? 0) - (left.annualDams ?? 0);
                }),
        [companies, searchQuery]
    );

    const filterCounts = useMemo(
        () => ({
            all: searchedCompanies.length,
            "no-contact": searchedCompanies.filter((company) => matchesInvestigationFilter(company, "no-contact")).length,
            "with-opinion": searchedCompanies.filter((company) => matchesInvestigationFilter(company, "with-opinion")).length,
            blocked: searchedCompanies.filter((company) => matchesInvestigationFilter(company, "blocked")).length,
        }),
        [searchedCompanies]
    );

    const filteredCompanies = useMemo(
        () => searchedCompanies.filter((company) => matchesInvestigationFilter(company, activeFilter)),
        [activeFilter, searchedCompanies]
    );

    const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / itemsPerPage));
    const effectivePage = Math.min(currentPage, totalPages);
    const paginatedCompanies = filteredCompanies.slice((effectivePage - 1) * itemsPerPage, effectivePage * itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-3">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                        <Search className="h-8 w-8 text-blue-500" />
                        Bandeja de Investigacion
                    </h1>
                    <p className="mt-1 max-w-4xl text-muted-foreground">
                        Investigacion debe habilitar rapido la cuenta para caceria. Aqui se actualizan <strong>incoterm</strong> y <strong>canal aduanero</strong> mas frecuentes y se cargan los contactos encontrados. La <strong>opinion comercial</strong> puede registrarse aqui o despues desde caceria.
                    </p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Frontera del modulo</p>
                    <p className="mt-1 text-sm text-slate-700">
                        La validacion fina del contacto y el afinamiento de criterio comercial ya corresponden a caceria. En investigacion basta con dejar al menos un contacto activo para que la cuenta salga de esta bandeja.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridad alta</p>
                    <p className="mt-2 text-2xl font-semibold">{filteredCompanies.filter((company) => company.researchPriority === "HIGH").length}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Con contactos cargados</p>
                    <p className="mt-2 text-2xl font-semibold">{filteredCompanies.filter((company) => hasActiveContacts(company)).length}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Con opinion</p>
                    <p className="mt-2 text-2xl font-semibold">{filteredCompanies.filter((company) => hasResearchOpinion(company)).length}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No ubicables o visita</p>
                    <p className="mt-2 text-2xl font-semibold">
                        {filteredCompanies.filter((company) => company.researchStatus === "BLOCKED" || company.researchStatus === "VISIT_REQUIRED").length}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    variant={activeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                >
                    Todos ({filterCounts.all})
                </Button>
                <Button
                    variant={activeFilter === "no-contact" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("no-contact")}
                >
                    Sin contactos ({filterCounts["no-contact"]})
                </Button>
                <Button
                    variant={activeFilter === "with-opinion" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("with-opinion")}
                >
                    Con opinion ({filterCounts["with-opinion"]})
                </Button>
                <Button
                    variant={activeFilter === "blocked" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter("blocked")}
                >
                    Trabadas ({filterCounts.blocked})
                </Button>
            </div>

            <div className="grid gap-4">
                {paginatedCompanies.map((company) => {
                    const activeContacts = company.contacts.filter((contact) => contact.isActive);
                    const inactiveContacts = company.contacts.filter((contact) => contact.isActive === false);
                    const flowMessage = getInvestigationFlowMessage(company);

                    return (
                        <article key={company.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="space-y-4 xl:max-w-5xl">
                                    <div className="flex items-start gap-2">
                                        <Building2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="space-y-2">
                                            <div>
                                                <p className="font-semibold">{company.businessName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {company.documentType}: {company.documentNumber}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className={PRIORITY_STYLES[company.researchPriority]}>
                                                    {PRIORITY_LABELS[company.researchPriority]}
                                                </Badge>
                                                <Badge variant="outline" className={EFFORT_STYLES[company.researchEffort]}>
                                                    {EFFORT_LABELS[company.researchEffort]}
                                                </Badge>
                                                <Badge variant="outline" className={STATUS_STYLES[company.researchStatus]}>
                                                    {STATUS_LABELS[company.researchStatus]}
                                                </Badge>
                                                {company.annualDams !== null && company.annualDams !== undefined ? (
                                                    <Badge variant="secondary" className="border-blue-200 bg-blue-50 text-blue-700">
                                                        {company.annualDams} DAMs
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">
                                                        Sin DAMs visibles
                                                    </Badge>
                                                )}
                                                {company.dominantIncoterm && (
                                                    <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-800">
                                                        Incoterm: {company.dominantIncoterm}
                                                    </Badge>
                                                )}
                                                {company.dominantCustomsChannel && (
                                                    <Badge variant="outline" className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800">
                                                        Canal: {company.dominantCustomsChannel}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <p className="font-medium">{getPerceivedValue(company)}</p>
                                                <p className="text-muted-foreground">{getOperationalRead(company)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatReviewedAt(company.researchLastReviewedAt)} | {getInvestigationAge(company.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`rounded-xl border p-3 ${flowMessage.tone}`}>
                                        <p className="text-sm font-semibold">{flowMessage.title}</p>
                                        <p className="mt-1 text-sm">{flowMessage.body}</p>
                                    </div>

                                    <div className="grid gap-3 lg:grid-cols-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ultimo hallazgo</p>
                                            <p className="mt-1 font-medium">{company.researchLastFinding || "Todavia no hay hallazgo registrado."}</p>
                                            <p className="mt-1 text-muted-foreground">
                                                {company.researchSourceChannel ? `Canal: ${SOURCE_LABELS[company.researchSourceChannel]}` : "Sin canal de investigacion registrado"}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opinion</p>
                                            <p className="mt-1 text-muted-foreground">{company.researchSummary || "Aun no hay opinion comercial registrada."}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Siguiente accion</p>
                                            <p className="mt-1 font-medium">{company.researchNextAction || "Falta definir el siguiente movimiento de investigacion."}</p>
                                        </div>
                                    </div>

                                    {activeContacts.length > 0 && (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                            <div className="flex items-center gap-2 text-emerald-900">
                                                <UserRoundSearch className="h-4 w-4" />
                                                <p className="text-sm font-semibold">Contactos cargados para caceria</p>
                                            </div>
                                            <div className="mt-3 grid gap-2 lg:grid-cols-2">
                                                {activeContacts.map((contact) => (
                                                    <div key={contact.id} className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm">
                                                        <p className="font-medium">
                                                            {contact.firstName} {contact.lastName}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{contact.position || "Sin cargo registrado"}</p>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <Badge variant="outline" className="text-[10px]">
                                                                {getPrimaryChannel(contact)}
                                                            </Badge>
                                                            {contact.sourceChannel && (
                                                                <Badge variant="secondary" className="text-[10px]">
                                                                    {SOURCE_LABELS[contact.sourceChannel]}
                                                                </Badge>
                                                            )}
                                                            {!hasAnyChannel(contact) && (
                                                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-800">
                                                                    Sin canal visible
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {inactiveContacts.length > 0 && (
                                        <div className="flex flex-col gap-1 rounded-xl border border-muted bg-muted/30 p-3">
                                            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                <Info className="h-3 w-3" /> Motivos de descarte previos
                                            </span>
                                            {inactiveContacts.map((contact) => (
                                                <p key={contact.id} className="flex items-start gap-1 text-xs text-muted-foreground">
                                                    <UserX className="mt-[2px] h-3 w-3 shrink-0 text-red-400" />
                                                    <span className="line-clamp-2">
                                                        <strong>{contact.firstName}:</strong> {contact.inactiveReason || "Sin justificacion"}
                                                    </span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 xl:min-w-[220px] xl:max-w-[220px]">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`https://www.google.com/search?q=${encodeURIComponent(company.businessName)}`} target="_blank" rel="noopener noreferrer">
                                            <Search className="mr-2 h-4 w-4" /> Google
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(company.businessName)}`} target="_blank" rel="noopener noreferrer">
                                            <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`https://www.facebook.com/search/top?q=${encodeURIComponent(company.businessName)}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" /> Facebook
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(company.businessName)}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" /> Instagram
                                        </a>
                                    </Button>
                                    {company.website && (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={getWebsiteUrl(company.website)} target="_blank" rel="noopener noreferrer">
                                                <Globe className="mr-2 h-4 w-4" /> Website
                                            </a>
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/companies/${company.id}`}>
                                            <Building2 className="mr-2 h-4 w-4" /> Actualizar Empresa
                                        </Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href={`/contacts/new?companyId=${company.id}`}>
                                            <Plus className="mr-2 h-4 w-4" /> {activeContacts.length > 0 ? "Agregar Contacto" : "Crear Contacto"}
                                        </Link>
                                    </Button>
                                    <InvestigationOpinionModal
                                        companyId={company.id}
                                        companyName={company.businessName}
                                        stageContext="INVESTIGATION"
                                        initialPriority={company.researchPriority}
                                        initialEffort={company.researchEffort}
                                        initialStatus={company.researchStatus}
                                        initialSourceChannel={company.researchSourceChannel}
                                        initialLastFinding={company.researchLastFinding}
                                        initialSummary={company.researchSummary}
                                        initialNextAction={company.researchNextAction}
                                        onSuccess={(payload) => {
                                            setCompanies((current) =>
                                                current.flatMap((item) => {
                                                    if (item.id !== company.id) return [item];

                                                    const updatedItem = { ...item, ...payload };
                                                    const shouldMoveToProspecting = updatedItem.contacts.some((contact) => contact.isActive);

                                                    return shouldMoveToProspecting ? [] : [updatedItem];
                                                })
                                            );
                                        }}
                                        triggerButton={<Button variant="outline" size="sm">Opinion Comercial</Button>}
                                    />
                                    <DisqualifyModal
                                        companyId={company.id}
                                        companyName={company.businessName}
                                        triggerButton={
                                            <Button variant="ghost" size="sm" className="justify-between text-muted-foreground hover:text-red-600">
                                                Descartar o mover <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                </div>
                            </div>
                        </article>
                    );
                })}

                {filteredCompanies.length === 0 && (
                    <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground shadow-sm">
                        No hay empresas pendientes de investigacion. Buen trabajo.
                    </div>
                )}
            </div>

            {filteredCompanies.length > 0 && totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {(effectivePage - 1) * itemsPerPage + 1} a {Math.min(effectivePage * itemsPerPage, filteredCompanies.length)} de {filteredCompanies.length} empresas
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={effectivePage === 1}>
                            Anterior
                        </Button>
                        <span className="text-sm font-medium">Pagina {effectivePage} de {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={effectivePage === totalPages}>
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
