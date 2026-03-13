"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { AlertCircle, Building2, Calendar, CalendarClock, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Clock, History, Linkedin, MessageCircle, Pencil, PhoneCall, Plus, Target, Trash2, TrendingUp, UserRoundSearch, X } from "lucide-react";
import type { ProspectingCompanyItem, ProspectingCompanyView } from "@/lib/crm-list-types";
import { matchesSearch } from "@/lib/search";
import { deleteContactInfo } from "@/app/actions/crm/contact-actions";
import { useScopedSearch } from "@/components/layout/SearchProvider";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogInteractionModal } from "@/components/crm/LogInteractionModal";
import { CreateTaskModal } from "@/components/crm/CreateTaskModal";
import { DisqualifyModal } from "@/components/crm/DisqualifyModal";

const ITEMS_PER_PAGE = 10;

const CONTACT_STATUS_STYLES = {
    UNVALIDATED: "bg-slate-100 text-slate-700 border-slate-200",
    VALIDATED_NO_RESPONSE: "bg-amber-100 text-amber-800 border-amber-200",
    VALIDATED_RESPONDS: "bg-blue-100 text-blue-800 border-blue-200",
    INTERESTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    NOT_DECISION_MAKER: "bg-orange-100 text-orange-800 border-orange-200",
    DECISION_MAKER: "bg-violet-100 text-violet-800 border-violet-200",
    REPLACE: "bg-rose-100 text-rose-700 border-rose-200",
    DISCARDED: "bg-zinc-100 text-zinc-600 border-zinc-200",
} as const;

const CONTACT_STATUS_LABELS = {
    UNVALIDATED: "Sin validar",
    VALIDATED_NO_RESPONSE: "Validado sin respuesta",
    VALIDATED_RESPONDS: "Responde",
    INTERESTED: "Interesado",
    NOT_DECISION_MAKER: "No decide",
    DECISION_MAKER: "Decisor",
    REPLACE: "Reemplazar",
    DISCARDED: "Descartado",
} as const;

const BUYING_ROLE_LABELS = {
    UNKNOWN: "Rol sin definir",
    OPERATIONS: "Operaciones",
    USER: "Usuario",
    INFLUENCER: "Influenciador",
    DECISION_MAKER: "Decisor",
    BLOCKER: "Bloqueador",
} as const;

const OUTCOME_LABELS = {
    NO_RESPONSE: "No respondio",
    INVALID_PHONE: "Numero invalido",
    BOUNCED_EMAIL: "Correo rebotado",
    VERIFIED_CONTACT: "Contacto validado",
    REFERRED_TO_OTHER: "Derivo a otra persona",
    CALLBACK_REQUESTED: "Pidio retomar",
    SHARED_OPERATION: "Compartio operacion",
    REQUESTED_QUOTE: "Pidio cotizacion",
    NO_INTEREST: "Sin interes",
    HAS_CURRENT_VENDOR: "Ya trabaja con otro operador",
    OTHER: "Otro",
} as const;

function interactionLabel(type: string) {
    switch (type) {
        case "CALL_MADE": return "Llamada";
        case "WHATSAPP_SENT": return "WhatsApp Enviado";
        case "EMAIL_SENT": return "Correo Enviado";
        case "EMAIL_OPENED": return "Correo Abierto";
        case "MEETING": return "Reunion";
        default: return type;
    }
}

function interactionMarker(type: string) {
    switch (type) {
        case "CALL_MADE": return "L";
        case "WHATSAPP_SENT": return "W";
        case "EMAIL_SENT": return "E";
        case "MEETING": return "R";
        default: return "N";
    }
}

function getCompanyReadiness(company: ProspectingCompanyItem, interactions: ProspectingCompanyView["allInteractions"]) {
    const validatedContacts = company.contacts.filter((contact) =>
        ["VALIDATED_RESPONDS", "INTERESTED", "DECISION_MAKER"].includes(contact.commercialStatus)
    );
    const hasDecisionMaker = company.contacts.some((contact) =>
        contact.commercialStatus === "DECISION_MAKER" || contact.buyingRole === "DECISION_MAKER"
    );
    const hasOperationSignal = interactions.some((interaction) =>
        interaction.outcome === "SHARED_OPERATION" || interaction.outcome === "REQUESTED_QUOTE"
    );

    if (validatedContacts.length === 0) {
        return {
            label: "Validar contacto",
            description: "Aun falta confirmar un contacto util.",
            ready: false,
            tone: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }

    if (!hasDecisionMaker) {
        return {
            label: "Falta decisor",
            description: "La cuenta responde, pero aun no aparece quien decide.",
            ready: false,
            tone: "bg-amber-100 text-amber-800 border-amber-200",
        };
    }

    if (!hasOperationSignal) {
        return {
            label: "Descubrir operacion",
            description: "Ya hay decisor, pero aun falta bajar la necesidad concreta.",
            ready: false,
            tone: "bg-blue-100 text-blue-800 border-blue-200",
        };
    }

    return {
        label: "Lista para oportunidad",
        description: "Ya hay contacto util y senal clara de negocio.",
        ready: true,
        tone: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
}

function getBestOpportunityContact(company: ProspectingCompanyItem) {
    return company.contacts.find((contact) =>
        contact.commercialStatus === "DECISION_MAKER" || contact.buyingRole === "DECISION_MAKER"
    ) || company.contacts.find((contact) =>
        contact.commercialStatus === "INTERESTED" || contact.commercialStatus === "VALIDATED_RESPONDS"
    ) || company.contacts[0] || null;
}

function getCoverageSummary(company: ProspectingCompanyItem) {
    const validated = company.contacts.filter((contact) =>
        ["VALIDATED_RESPONDS", "INTERESTED", "DECISION_MAKER"].includes(contact.commercialStatus)
    ).length;
    const decisionMakers = company.contacts.filter((contact) =>
        contact.buyingRole === "DECISION_MAKER" || contact.commercialStatus === "DECISION_MAKER"
    ).length;
    const influencers = company.contacts.filter((contact) => contact.buyingRole === "INFLUENCER").length;
    const operations = company.contacts.filter((contact) => contact.buyingRole === "OPERATIONS").length;

    return {
        validated,
        decisionMakers,
        influencers,
        operations,
    };
}

function getDiscoveryPlaybook(company: ProspectingCompanyItem, interactions: ProspectingCompanyView["allInteractions"]) {
    const hasQuoteSignal = interactions.some((interaction) => interaction.outcome === "REQUESTED_QUOTE");
    const hasOperationSignal = interactions.some((interaction) => interaction.outcome === "SHARED_OPERATION");

    let focus = "Descubrir la operacion y quien decide";
    let questions = [
        "Que embarques o despachos mueve hoy y con que frecuencia?",
        "Con quien trabaja actualmente y que le incomoda de ese servicio?",
        "Quien revisa propuesta y quien toma la decision final?",
    ];

    if (company.importVolume === "HIGH" || (company.annualDams ?? 0) > 30) {
        focus = "Abrir cuenta recurrente y no solo negocio spot";
        questions = [
            "Cuantos embarques o DAMs mueve al mes y en que rutas principales?",
            "Que KPI le duele mas hoy: costo, tiempos, libres o observaciones?",
            "Si mejoramos esa parte, que tan viable es probar con una operacion piloto?",
        ];
    } else if (company.valueDriver === "SPEED") {
        focus = "Vender velocidad, control y respuesta operativa";
        questions = [
            "En que parte pierde mas tiempo hoy: cotizacion, embarque, arribo o levante?",
            "Que urgencias le han costado sobrecosto recientemente?",
            "Que tendria que pasar para que nos pruebe en una operacion sensible?",
        ];
    } else if (company.valueDriver === "PRICE") {
        focus = "Bajar a comparativo economico concreto sin regalar margen a ciegas";
        questions = [
            "Que concepto siente hoy mas inflado en su operacion?",
            "Compara solo tarifa o tambien dias libres, seguimiento y respuesta?",
            "Si le mostramos ahorro real en una ruta puntual, quien aprueba la prueba?",
        ];
    }

    const convertSignal = hasQuoteSignal
        ? "Ya hay senal de cotizacion. Empuja cierre o abre oportunidad formal."
        : hasOperationSignal
            ? "Ya hay operacion concreta. Falta amarrar decisor o siguiente paso."
            : "Aun falta aterrizar una necesidad concreta antes de convertir.";

    return { focus, questions, convertSignal };
}

export default function ProspectingClient({ initialCompanies }: { initialCompanies: ProspectingCompanyItem[] }) {
    const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState("today");
    const [currentPage, setCurrentPage] = useState(1);
    const [postponedIds, setPostponedIds] = useState<Set<string>>(new Set());
    const todayDate = new Date().toISOString().split("T")[0];
    const { query: searchQuery } = useScopedSearch();

    const companiesWithData = useMemo<ProspectingCompanyView[]>(() => initialCompanies
        .filter((company) => company.contacts.some((contact) => contact.emails.length > 0 || contact.phones.length > 0) && company.opportunities.length === 0)
        .map((company) => {
            const allInteractions = [...company.interactions].sort((a, b) => new Date(b.interactedAt).getTime() - new Date(a.interactedAt).getTime());
            const lastInteraction = allInteractions[0] ?? null;
            const nextTask = allInteractions
                .filter((interaction) => interaction.nextFollowUpDate && !interaction.isFollowUpCompleted)
                .sort((a, b) => new Date(a.nextFollowUpDate as Date).getTime() - new Date(b.nextFollowUpDate as Date).getTime())[0] ?? null;
            const nextTaskFormattedDate = nextTask?.nextFollowUpDate ? new Date(nextTask.nextFollowUpDate).toISOString().split("T")[0] : null;

            let category: ProspectingCompanyView["category"] = "inactive";
            if (!lastInteraction && !nextTask) category = "new";
            else if (nextTaskFormattedDate && nextTaskFormattedDate <= todayDate) category = "today";
            else if (nextTaskFormattedDate && nextTaskFormattedDate > todayDate) category = "future";

            return { company, lastInteraction, nextTask, allInteractions, nextTaskFormattedDate, category };
        }), [initialCompanies, todayDate]);

    const visibleCompanies = companiesWithData.filter((item) =>
        !postponedIds.has(item.company.id) &&
        matchesSearch(
            searchQuery,
            item.company.businessName,
            item.company.documentNumber,
            item.company.contacts.map((contact) => `${contact.firstName} ${contact.lastName} ${contact.emails.join(" ")} ${contact.phones.join(" ")} ${CONTACT_STATUS_LABELS[contact.commercialStatus]} ${BUYING_ROLE_LABELS[contact.buyingRole]}`),
            item.allInteractions.map((interaction) => `${interaction.notes || ""} ${interaction.outcome ? OUTCOME_LABELS[interaction.outcome] : ""}`)
        )
    );
    const grouped = {
        today: visibleCompanies.filter((item) => item.category === "today"),
        new: visibleCompanies.filter((item) => item.category === "new"),
        future: visibleCompanies.filter((item) => item.category === "future"),
        inactive: visibleCompanies.filter((item) => item.category === "inactive"),
    };

    const toggleExpand = (companyId: string) => {
        setExpandedCompanies((prev) => {
            const next = new Set(prev);
            if (next.has(companyId)) next.delete(companyId);
            else next.add(companyId);
            return next;
        });
    };

    const renderTable = (data: ProspectingCompanyView[], emptyMessage: string) => {
        const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
        const paginatedData = data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return (
            <div className="flex flex-col gap-4">
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Prospecto a Atacar</TableHead>
                                <TableHead>Contactos Clave</TableHead>
                                <TableHead>Seguimiento</TableHead>
                                <TableHead>Termometro (Score)</TableHead>
                                <TableHead className="text-right">Accion Requerida</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">{emptyMessage}</TableCell>
                                </TableRow>
                            ) : paginatedData.map(({ company, lastInteraction, nextTask, allInteractions, nextTaskFormattedDate }) => {
                                const contacts = company.contacts.filter((contact) => contact.emails.length > 0 || contact.phones.length > 0);
                                const readiness = getCompanyReadiness(company, allInteractions);
                                const bestOpportunityContact = getBestOpportunityContact(company);
                                const isExpanded = expandedCompanies.has(company.id);
                                const isOverdue = Boolean(nextTaskFormattedDate && nextTaskFormattedDate < todayDate);
                                const isToday = Boolean(nextTaskFormattedDate && nextTaskFormattedDate === todayDate);

                                return (
                                    <Fragment key={company.id}>
                                        <TableRow className={isExpanded ? "border-b-0" : ""}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium leading-none">{company.businessName}</p>
                                                        <p className="mt-1 text-[10px] text-muted-foreground">RUC: {company.documentNumber}</p>
                                                        <div className="mt-2 flex gap-2">
                                                            {company.importVolume === "HIGH" && <Badge variant="secondary" className="bg-emerald-100 text-[10px] text-emerald-800">Volumen Alto</Badge>}
                                                            {company.valueDriver === "PRICE" && <Badge variant="secondary" className="bg-blue-100 text-[10px] text-blue-800">Busca Precio</Badge>}
                                                            <Badge variant="outline" className={readiness.tone}>
                                                                {readiness.label}
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-2 text-[10px] text-muted-foreground">
                                                            {readiness.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-3">
                                                    {contacts.slice(0, 3).map((contact) => {
                                                        const contactedToday = allInteractions.some((interaction) => interaction.contactId === contact.id && interaction.interactedAt.toISOString().split("T")[0] === todayDate);
                                                        return (
                                                            <div key={contact.id} className={`border-b pb-2 text-sm last:border-0 last:pb-0 ${contactedToday ? "rounded border-emerald-100 bg-emerald-50/50 p-1 -ml-1" : ""}`}>
                                                                <div className="group mb-1 flex items-center justify-between font-semibold">
                                                                    <div className="flex items-center gap-1">
                                                                        {contact.firstName} {contact.lastName}
                                                                        <Badge variant="outline" className={`ml-1 h-4 text-[9px] ${CONTACT_STATUS_STYLES[contact.commercialStatus]}`}>
                                                                            {CONTACT_STATUS_LABELS[contact.commercialStatus]}
                                                                        </Badge>
                                                                        <Badge variant="outline" className="h-4 text-[9px]">
                                                                            {BUYING_ROLE_LABELS[contact.buyingRole]}
                                                                        </Badge>
                                                                        {contact.linkedin && (
                                                                            <a href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:text-blue-800" title="Perfil de LinkedIn">
                                                                                <Linkedin className="inline h-3 w-3" />
                                                                            </a>
                                                                        )}
                                                                        {contactedToday && <CheckCircle2 className="ml-1 h-3 w-3 text-emerald-500" />}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 opacity-100 transition-opacity md:opacity-0 group-hover:opacity-100">
                                                                        <LogInteractionModal companyId={company.id} contacts={contacts} defaultContactId={contact.id} lockedContact onSuccess={() => {}} triggerButton={<Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 hover:text-primary" title="Registrar Accion"><PhoneCall className="h-3 w-3" /></Button>} />
                                                                        <CreateTaskModal companyId={company.id} contacts={contacts} defaultContactId={contact.id} onSuccess={() => {}} triggerButton={<Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600 hover:bg-amber-100 hover:text-amber-700" title="Agendar Tarea"><CalendarClock className="h-3 w-3" /></Button>} />
                                                                        <Link href={`/contacts/${contact.id}`} className="text-muted-foreground hover:text-blue-600" title="Editar Contacto"><Pencil className="h-3 w-3" /></Link>
                                                                    </div>
                                                                </div>
                                                                {contact.lastValidatedAt && (
                                                                    <p className="pl-4 text-[10px] text-muted-foreground">
                                                                        Validado: {new Date(contact.lastValidatedAt).toLocaleDateString("es-PE")}
                                                                    </p>
                                                                )}
                                                                {contact.phones.map((phone, index) => (
                                                                    <div key={`${contact.id}-phone-${index}`} className="group mb-1 flex items-center justify-between pl-4 text-xs text-muted-foreground">
                                                                        <div className="flex items-center gap-2"><PhoneCall className="h-3 w-3" /><span>{phone}</span></div>
                                                                        <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 group-hover:opacity-100">
                                                                            <a href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${contact.firstName}, soy Gualbert, analizando las importaciones de ${company.businessName}...`)}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600" title="Hablar por WhatsApp"><MessageCircle className="h-3 w-3" /></a>
                                                                            <button onClick={() => deleteContactInfo(contact.id, "phone", phone)} className="text-red-400 hover:text-red-600" title="Descartar numero"><X className="h-3 w-3" /></button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {contact.emails.map((email, index) => (
                                                                    <div key={`${contact.id}-email-${index}`} className="group mb-1 flex items-center justify-between pl-4 text-xs text-muted-foreground">
                                                                        <span>{email}</span>
                                                                        <button onClick={() => deleteContactInfo(contact.id, "email", email)} className="text-red-400 opacity-100 transition-opacity hover:text-red-600 md:opacity-0 group-hover:opacity-100" title="Descartar correo que reboto"><X className="h-3 w-3" /></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                    {contacts.length > 3 && <span className="text-xs italic text-muted-foreground">+{contacts.length - 3} contactos ocultos</span>}
                                                    <Link href={`/contacts/new?companyId=${company.id}`} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"><Plus className="h-3 w-3" /> Anadir Contacto</Link>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    {nextTask ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`flex items-center text-xs font-bold ${isOverdue ? "text-red-600" : isToday ? "text-amber-600" : "text-blue-600"}`}>
                                                                {isOverdue && <AlertCircle className="mr-1 h-3 w-3" />}
                                                                {isToday && <Clock className="mr-1 h-3 w-3" />}
                                                                {!isOverdue && !isToday && <Calendar className="mr-1 h-3 w-3" />}
                                                                {isOverdue ? `Atrasado: ${nextTaskFormattedDate}` : isToday ? "Toca Hoy" : `Proximo: ${nextTaskFormattedDate}`}
                                                            </span>
                                                            <span className="max-w-[150px] truncate text-[10px] text-muted-foreground">Ult. nota: {lastInteraction?.notes || "Ninguna"}</span>
                                                        </div>
                                                    ) : lastInteraction ? (
                                                        <span className="flex items-center text-xs text-muted-foreground">Ult: {new Date(lastInteraction.interactedAt).toLocaleDateString()}</span>
                                                    ) : (
                                                        <Badge variant="outline" className="border-dashed text-muted-foreground">Sin Contactar</Badge>
                                                    )}
                                                    {allInteractions.length > 0 && (
                                                        <button onClick={() => toggleExpand(company.id)} className="mt-1 flex items-center gap-1 text-[11px] text-primary hover:underline">
                                                            <History className="h-3 w-3" />{isExpanded ? "Ocultar" : "Ver"} Historial ({allInteractions.length}){isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold">{company.leadScore} pts</span>
                                                    <div className="h-2 w-16 overflow-hidden rounded-full bg-muted"><div className={`h-full ${company.leadScore > 50 ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${Math.min(company.leadScore, 100)}%` }} /></div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="min-h-full text-right">
                                                <div className="flex flex-col items-end justify-center gap-2">
                                                    <CreateTaskModal companyId={company.id} contacts={contacts} defaultContactId="none" isSimplePostpone onSuccess={() => setPostponedIds((prev) => new Set(prev).add(company.id))} triggerButton={<Button size="sm" variant="outline" className="h-8 w-[140px] border-dashed border-primary/50 text-primary"><Calendar className="mr-1 h-3 w-3" /> Posponer Cuenta</Button>} />
                                                    <Button variant={readiness.ready ? "default" : "ghost"} size="sm" className={readiness.ready ? "h-8 bg-emerald-600 hover:bg-emerald-700" : "h-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"} asChild><Link href={`/crm/opportunities/new?companyId=${company.id}${bestOpportunityContact ? `&contactId=${bestOpportunityContact.id}` : ""}`}>{readiness.ready ? <><TrendingUp className="mr-1 h-3 w-3" /> Abrir Oportunidad</> : <><TrendingUp className="mr-1 h-3 w-3" /> Aun verde</>}</Link></Button>
                                                    <DisqualifyModal companyId={company.id} companyName={company.businessName} onSuccess={() => setPostponedIds((prev) => new Set(prev).add(company.id))} triggerButton={<Button variant="ghost" size="sm" className="h-7 text-red-500 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1 h-3 w-3" /> Descartar</Button>} />
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {isExpanded && allInteractions.length > 0 && (
                                            <TableRow key={`${company.id}-timeline`}>
                                                <TableCell colSpan={5} className="bg-muted/30 p-0">
                                                    <div className="px-6 py-4">
                                                        <div className="mb-4 grid gap-4 lg:grid-cols-2">
                                                            <div className="rounded-lg border bg-background p-4">
                                                                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                    <UserRoundSearch className="h-3.5 w-3.5" /> Cobertura de Cuenta
                                                                </h4>
                                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                                    <div className="rounded-md bg-muted/40 p-3">
                                                                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Validados</span>
                                                                        <span className="text-lg font-semibold">{getCoverageSummary(company).validated}</span>
                                                                    </div>
                                                                    <div className="rounded-md bg-muted/40 p-3">
                                                                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Decisores</span>
                                                                        <span className="text-lg font-semibold">{getCoverageSummary(company).decisionMakers}</span>
                                                                    </div>
                                                                    <div className="rounded-md bg-muted/40 p-3">
                                                                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Influenciadores</span>
                                                                        <span className="text-lg font-semibold">{getCoverageSummary(company).influencers}</span>
                                                                    </div>
                                                                    <div className="rounded-md bg-muted/40 p-3">
                                                                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Operaciones</span>
                                                                        <span className="text-lg font-semibold">{getCoverageSummary(company).operations}</span>
                                                                    </div>
                                                                </div>
                                                                <p className="mt-3 text-xs text-muted-foreground">
                                                                    {getCoverageSummary(company).decisionMakers > 0
                                                                        ? "La cuenta ya tiene al menos un decisor identificado."
                                                                        : "Todavia falta alguien que realmente mueva la compra."}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-lg border bg-background p-4">
                                                                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                    <ClipboardList className="h-3.5 w-3.5" /> Playbook de Descubrimiento
                                                                </h4>
                                                                <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-900">
                                                                    <span className="block text-[10px] uppercase tracking-wider text-blue-700">Foco</span>
                                                                    <p className="mt-1 font-medium">{getDiscoveryPlaybook(company, allInteractions).focus}</p>
                                                                </div>
                                                                <div className="mt-3 space-y-2">
                                                                    {getDiscoveryPlaybook(company, allInteractions).questions.map((question) => (
                                                                        <div key={question} className="flex items-start gap-2 text-xs text-foreground">
                                                                            <Target className="mt-0.5 h-3.5 w-3.5 text-blue-600" />
                                                                            <span>{question}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <p className="mt-3 text-xs text-muted-foreground">
                                                                    {getDiscoveryPlaybook(company, allInteractions).convertSignal}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <h4 className="mb-3 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground"><History className="h-3 w-3" /> Historial de Interacciones - {company.businessName}</h4>
                                                        <div className="relative ml-2 space-y-4 border-l-2 border-primary/20">
                                                            {allInteractions.map((interaction, index) => (
                                                                <div key={interaction.id} className="relative pl-6">
                                                                    <div className={`absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 text-[8px] ${index === 0 ? "border-primary bg-primary text-white" : "border-muted-foreground/40 bg-background text-muted-foreground"}`}>{interactionMarker(interaction.type)}</div>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="text-xs font-semibold">{interactionLabel(interaction.type)}</span>
                                                                            <span className="text-[10px] text-muted-foreground">{new Date(interaction.interactedAt).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                                                                            {interaction.contact && <Badge variant="outline" className="h-4 text-[10px]">con {interaction.contact.firstName} {interaction.contact.lastName}</Badge>}
                                                                            {interaction.outcome && <Badge variant="outline" className="h-4 text-[10px]">{OUTCOME_LABELS[interaction.outcome]}</Badge>}
                                                                            {interaction.scoreImpact > 0 && <span className="text-[10px] font-bold text-emerald-600">+{interaction.scoreImpact} pts</span>}
                                                                        </div>
                                                                        {interaction.notes && <p className="text-xs leading-relaxed text-muted-foreground">{interaction.notes}</p>}
                                                                        {interaction.nextFollowUpDate && <span className={`mt-0.5 flex items-center gap-1 text-[10px] ${interaction.isFollowUpCompleted ? "text-muted-foreground line-through" : "font-semibold text-amber-600"}`}><Calendar className="h-2.5 w-2.5" /> Seguimiento: {new Date(interaction.nextFollowUpDate).toLocaleDateString("es-PE")}{interaction.isFollowUpCompleted && " - Hecho"}</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-2 pt-4">
                        <p className="text-sm text-muted-foreground">Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, data.length)} de {data.length} prospectos</p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Anterior</Button>
                            <span className="text-sm font-medium">Pagina {currentPage} de {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Siguiente</Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight"><PhoneCall className="h-8 w-8 text-amber-500" /> Caceria (Tareas Diarias)</h1>
                    <p className="mt-1 text-muted-foreground">Tu agenda de prospeccion. Llama, anota en el diario programando la proxima llamada, hasta lograr una cotizacion.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setCurrentPage(1); }} className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="today" className="relative">Para Hoy / Atrasadas{grouped.today.length > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{grouped.today.length}</span>}</TabsTrigger>
                    <TabsTrigger value="new">Nuevos ({grouped.new.length})</TabsTrigger>
                    <TabsTrigger value="future">Futuros ({grouped.future.length})</TabsTrigger>
                    <TabsTrigger value="inactive">Inactivos ({grouped.inactive.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-4">
                    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Objetivo de Hoy:</strong> Tienes {grouped.today.length} empresa(s) agendadas para llamar o que dejaste atrasadas. A cazar.</div>
                    {renderTable(grouped.today, "No tienes tareas programadas para hoy ni llamadas atrasadas. Estas al dia.")}
                </TabsContent>
                <TabsContent value="new">
                    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><strong>Nuevos Leads:</strong> Empresas que salieron de Investigacion y ya tienen correo o telefono, pero todavia no han sido contactadas.</div>
                    {renderTable(grouped.new, "No hay prospectos nuevos intocados.")}
                </TabsContent>
                <TabsContent value="future">{renderTable(grouped.future, "No tienes tareas programadas para dias posteriores a hoy.")}</TabsContent>
                <TabsContent value="inactive">
                    <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><strong>Sin Seguimiento:</strong> Empresas a las que llamaste alguna vez, pero olvidaste programarles un proximo seguimiento. Retomalas.</div>
                    {renderTable(grouped.inactive, "Todas tus interacciones pasadas tienen una futura llamada programada.")}
                </TabsContent>
            </Tabs>
        </div>
    );
}
