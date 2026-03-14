"use client";

import Link from "next/link";
import { Building2, HeartHandshake, MoreHorizontal, Pencil, Plus, Sparkles, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { ContactListItem } from "@/lib/crm-list-types";
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

const RELATIONSHIP_LABELS = {
    COLD: "Fria",
    WARM: "Cercana",
    TRUSTED: "Confia",
    ADVOCATE: "Promotor",
} as const;

const RELATIONSHIP_STYLES = {
    COLD: "border-slate-200 bg-slate-100 text-slate-700",
    WARM: "border-amber-200 bg-amber-100 text-amber-800",
    TRUSTED: "border-emerald-200 bg-emerald-100 text-emerald-800",
    ADVOCATE: "border-violet-200 bg-violet-100 text-violet-800",
} as const;

const CHANNEL_LABELS = {
    EMAIL: "Email",
    PHONE: "Telefono",
    WHATSAPP: "WhatsApp",
    LINKEDIN: "LinkedIn",
    IN_PERSON: "En persona",
} as const;

const DECISION_STYLE_LABELS = {
    ANALYTICAL: "Analitico",
    DIRECT: "Directo",
    RELATIONAL: "Relacional",
    CAUTIOUS: "Cauteloso",
    POLITICAL: "Politico",
} as const;

function formatDate(value: Date | string | null) {
    if (!value) return "Sin fecha";
    return new Date(value).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
    });
}

export default function ContactsClient({ initialContacts }: { initialContacts: ContactListItem[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const { query: searchQuery } = useScopedSearch();

    const filteredContacts = useMemo(
        () =>
            initialContacts.filter((contact) =>
                matchesSearch(
                    searchQuery,
                    contact.firstName,
                    contact.lastName,
                    contact.position,
                    contact.emails,
                    contact.phones,
                    contact.company?.businessName,
                    contact.profile?.relationshipStrength,
                    contact.profile?.preferredContactChannel,
                    contact.profile?.decisionStyle,
                    contact.profile?.primaryDriver,
                    contact.profile?.contacts.map((item) => item.company?.businessName || "")
                )
            ),
        [initialContacts, searchQuery]
    );

    const effectivePage = searchQuery ? 1 : currentPage;
    const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
    const paginatedContacts = filteredContacts.slice((effectivePage - 1) * ITEMS_PER_PAGE, effectivePage * ITEMS_PER_PAGE);

    const metrics = useMemo(
        () => ({
            trusted: filteredContacts.filter((contact) => contact.profile?.relationshipStrength === "TRUSTED" || contact.profile?.relationshipStrength === "ADVOCATE").length,
            withHistory: filteredContacts.filter((contact) => (contact.profile?.contacts.length || 0) > 1).length,
            withTouch: filteredContacts.filter((contact) => Boolean(contact.profile?.nextPersonalTouchAt)).length,
        }),
        [filteredContacts]
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Contactos</h1>
                    <p className="max-w-3xl text-muted-foreground">
                        Esta pagina ya no debe leerse como un directorio basico. Debe ayudarte a entender quien decide, como conviene abordarlo y como sostener la relacion aunque cambie de empresa.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/contacts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Contacto
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contactos visibles</p>
                    <p className="mt-2 text-2xl font-semibold">{filteredContacts.length}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relacion fuerte</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.trusted}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Con trayectoria</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.withHistory}</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Con toque pendiente</p>
                    <p className="mt-2 text-2xl font-semibold">{metrics.withTouch}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Persona</TableHead>
                            <TableHead>Empresa actual</TableHead>
                            <TableHead>Poder comercial</TableHead>
                            <TableHead>Relacion</TableHead>
                            <TableHead>Trayectoria</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredContacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No hay contactos registrados aun.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedContacts.map((contact) => {
                                const otherCompanies = (contact.profile?.contacts || []).filter((item) => item.companyId !== contact.companyId);
                                return (
                                    <TableRow key={contact.id}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    {contact.firstName} {contact.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{contact.position || "Sin cargo registrado"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {contact.emails[0] || contact.phones[0] || "Sin canal principal"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <Link href={`/companies/${contact.companyId}`} className="text-primary hover:underline">
                                                    {contact.company?.businessName || "Desconocida"}
                                                </Link>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline">{contact.buyingRole}</Badge>
                                                <Badge variant="outline">{contact.commercialStatus}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                {contact.profile ? (
                                                    <>
                                                        <Badge variant="outline" className={RELATIONSHIP_STYLES[contact.profile.relationshipStrength]}>
                                                            {RELATIONSHIP_LABELS[contact.profile.relationshipStrength]}
                                                        </Badge>
                                                        <div className="text-xs text-muted-foreground">
                                                            <p>{contact.profile.preferredContactChannel ? `Canal: ${CHANNEL_LABELS[contact.profile.preferredContactChannel]}` : "Canal por descubrir"}</p>
                                                            <p>{contact.profile.decisionStyle ? `Estilo: ${DECISION_STYLE_LABELS[contact.profile.decisionStyle]}` : "Estilo por descubrir"}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Sin perfil maestro aun</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <UserRound className="h-3.5 w-3.5" />
                                                    <span>{contact.profile?.contacts.length || 1} relacion(es) en CRM</span>
                                                </div>
                                                {otherCompanies.length > 0 && (
                                                    <div className="flex items-start gap-2">
                                                        <Sparkles className="mt-0.5 h-3.5 w-3.5" />
                                                        <span>{otherCompanies.map((item) => item.company?.businessName || "Empresa").join(", ")}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <HeartHandshake className="h-3.5 w-3.5" />
                                                    <span>
                                                        {contact.profile?.nextPersonalTouchAt
                                                            ? `Proximo toque: ${formatDate(contact.profile.nextPersonalTouchAt)}`
                                                            : "Sin toque relacional programado"}
                                                    </span>
                                                </div>
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
                                                        <Link href={`/contacts/${contact.id}`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar perfil
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
                        Mostrando {(effectivePage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(effectivePage * ITEMS_PER_PAGE, filteredContacts.length)} de {filteredContacts.length} contactos
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
