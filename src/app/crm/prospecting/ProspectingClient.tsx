"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Linkedin,
  Mail,
  Pencil,
  PhoneCall,
  Plus,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import type { ProspectingCompanyItem, ProspectingCompanyView, ProspectingContactItem, ProspectingInteractionItem } from "@/lib/crm-list-types";
import { deleteContactInfo } from "@/app/actions/crm/contact-actions";
import { CreateTaskModal, type CreateTaskSuccessPayload } from "@/components/crm/CreateTaskModal";
import { DisqualifyModal } from "@/components/crm/DisqualifyModal";
import { LogInteractionModal, type LogInteractionSuccessPayload } from "@/components/crm/LogInteractionModal";
import { useScopedSearch } from "@/components/layout/SearchProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { matchesSearch } from "@/lib/search";

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

type SessionState = { currentContactId: string | null; completedContactIds: string[] };

function getOutcomeTone(outcome: ProspectingInteractionItem["outcome"]) {
  switch (outcome) {
    case "REQUESTED_QUOTE":
      return "border-emerald-200 bg-emerald-50/80";
    case "SHARED_OPERATION":
      return "border-sky-200 bg-sky-50/80";
    case "CALLBACK_REQUESTED":
      return "border-amber-200 bg-amber-50/80";
    case "NO_RESPONSE":
    case "INVALID_PHONE":
    case "BOUNCED_EMAIL":
    case "NO_INTEREST":
      return "border-rose-200 bg-rose-50/70";
    default:
      return "border-border bg-muted/20";
  }
}

function getOutcomeAccent(outcome: ProspectingInteractionItem["outcome"]) {
  switch (outcome) {
    case "REQUESTED_QUOTE":
      return "bg-emerald-500";
    case "SHARED_OPERATION":
      return "bg-sky-500";
    case "CALLBACK_REQUESTED":
      return "bg-amber-500";
    case "NO_RESPONSE":
    case "INVALID_PHONE":
    case "BOUNCED_EMAIL":
    case "NO_INTEREST":
      return "bg-rose-500";
    default:
      return "bg-slate-300";
  }
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function formatDate(value: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleDateString("es-PE", options) : null;
}

function formatDateTime(value: Date | string | null | undefined) {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
}

function hasReachableChannel(contact: ProspectingContactItem) {
  return contact.phones.length > 0 || contact.emails.length > 0 || Boolean(contact.linkedin);
}

function isActionable(contact: ProspectingContactItem) {
  return hasReachableChannel(contact) && contact.commercialStatus !== "DISCARDED" && contact.commercialStatus !== "REPLACE";
}

function sortInteractions(items: ProspectingInteractionItem[]) {
  return [...items].sort((a, b) => (toDate(b.interactedAt)?.getTime() ?? 0) - (toDate(a.interactedAt)?.getTime() ?? 0));
}

function getView(company: ProspectingCompanyItem, today: string): ProspectingCompanyView {
  const allInteractions = sortInteractions(company.interactions);
  const lastInteraction = allInteractions[0] ?? null;
  const nextTask = allInteractions
    .filter((item) => item.nextFollowUpDate && !item.isFollowUpCompleted)
    .sort((a, b) => (toDate(a.nextFollowUpDate)?.getTime() ?? 0) - (toDate(b.nextFollowUpDate)?.getTime() ?? 0))[0] ?? null;
  const nextTaskFormattedDate = nextTask?.nextFollowUpDate ? toDate(nextTask.nextFollowUpDate)?.toISOString().split("T")[0] ?? null : null;

  let category: ProspectingCompanyView["category"] = "inactive";
  if (!lastInteraction && !nextTask) category = "new";
  else if (nextTaskFormattedDate && nextTaskFormattedDate <= today) category = "today";
  else if (nextTaskFormattedDate && nextTaskFormattedDate > today) category = "future";

  return { company, lastInteraction, nextTask, allInteractions, nextTaskFormattedDate, category };
}

function getSession(company: ProspectingCompanyItem, state?: SessionState) {
  const actionableContacts = company.contacts.filter(isActionable);
  const completedIds = new Set(state?.completedContactIds ?? []);
  const completedContacts = actionableContacts.filter((contact) => completedIds.has(contact.id));
  const pendingContacts = actionableContacts.filter((contact) => !completedIds.has(contact.id));
  const currentContact = actionableContacts.find((contact) => contact.id === state?.currentContactId) ?? pendingContacts[0] ?? null;
  const currentContactCompleted = currentContact ? completedIds.has(currentContact.id) : false;
  const nextPendingContact = pendingContacts.find((contact) => contact.id !== currentContact?.id) ?? null;
  return {
    actionableContacts,
    completedContacts,
    pendingContacts,
    currentContact,
    currentContactCompleted,
    nextPendingContact,
    exhausted: pendingContacts.length === 0,
    progressValue: actionableContacts.length === 0 ? 0 : Math.round((completedContacts.length / actionableContacts.length) * 100),
  };
}

function getReadiness(company: ProspectingCompanyItem, interactions: ProspectingInteractionItem[]) {
  const hasUsefulContact = company.contacts.some((contact) => ["VALIDATED_RESPONDS", "INTERESTED", "DECISION_MAKER"].includes(contact.commercialStatus));
  const hasDecisionMaker = company.contacts.some((contact) => contact.buyingRole === "DECISION_MAKER" || contact.commercialStatus === "DECISION_MAKER");
  const hasOperationSignal = interactions.some((interaction) => interaction.outcome === "SHARED_OPERATION" || interaction.outcome === "REQUESTED_QUOTE");
  if (!hasUsefulContact) return { label: "Validar contacto", tone: "bg-slate-100 text-slate-700 border-slate-200", ready: false };
  if (!hasDecisionMaker) return { label: "Falta decisor", tone: "bg-amber-100 text-amber-800 border-amber-200", ready: false };
  if (!hasOperationSignal) return { label: "Descubrir operacion", tone: "bg-blue-100 text-blue-800 border-blue-200", ready: false };
  return { label: "Lista para oportunidad", tone: "bg-emerald-100 text-emerald-800 border-emerald-200", ready: true };
}

function getBestOpportunityContact(company: ProspectingCompanyItem) {
  return company.contacts.find((contact) => contact.buyingRole === "DECISION_MAKER" || contact.commercialStatus === "DECISION_MAKER")
    || company.contacts.find((contact) => contact.commercialStatus === "INTERESTED" || contact.commercialStatus === "VALIDATED_RESPONDS")
    || company.contacts[0]
    || null;
}

export default function ProspectingClient({ initialCompanies }: { initialCompanies: ProspectingCompanyItem[] }) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [sessionByCompany, setSessionByCompany] = useState<Record<string, SessionState>>({});
  const [postponedIds, setPostponedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("today");
  const [currentPage, setCurrentPage] = useState(1);
  const todayDate = new Date().toISOString().split("T")[0];
  const { query: searchQuery } = useScopedSearch();

  useEffect(() => setCompanies(initialCompanies), [initialCompanies]);

  const views = companies
    .filter((company) => company.contacts.some(hasReachableChannel) && company.opportunities.length === 0)
    .map((company) => getView(company, todayDate));

  const visibleCompanies = views.filter((item) =>
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
    today: visibleCompanies.filter((item) => {
      const session = getSession(item.company, sessionByCompany[item.company.id]);
      return item.category === "today" && !session.exhausted;
    }),
    queue: visibleCompanies.filter((item) => {
      const session = getSession(item.company, sessionByCompany[item.company.id]);
      return !session.exhausted && (item.category === "new" || item.category === "future");
    }),
    exhausted: visibleCompanies.filter((item) => {
      const session = getSession(item.company, sessionByCompany[item.company.id]);
      return session.exhausted;
    }),
    noNextStep: visibleCompanies.filter((item) => {
      const session = getSession(item.company, sessionByCompany[item.company.id]);
      return !session.exhausted && item.category === "inactive";
    }),
  };

  const updateCompany = (companyId: string, updater: (company: ProspectingCompanyItem) => ProspectingCompanyItem) => {
    setCompanies((current) => current.map((company) => company.id === companyId ? updater(company) : company));
  };

  const toggleExpand = (companyId: string) => {
    setExpandedCompanies((current) => {
      const next = new Set(current);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  const openSession = (companyId: string, contactId?: string) => {
    const company = companies.find((item) => item.id === companyId);
    if (!company) return;
    const session = getSession(company, sessionByCompany[companyId]);
    setExpandedCompanies((current) => new Set(current).add(companyId));
    setSessionByCompany((current) => ({
      ...current,
      [companyId]: {
        currentContactId: contactId ?? current[companyId]?.currentContactId ?? session.currentContact?.id ?? null,
        completedContactIds: current[companyId]?.completedContactIds ?? [],
      },
    }));
  };

  const finishCurrentContact = (companyId: string) => {
    const company = companies.find((item) => item.id === companyId);
    if (!company) return;
    const session = getSession(company, sessionByCompany[companyId]);
    if (!session.currentContact) return;

    const completed = [...(sessionByCompany[companyId]?.completedContactIds ?? [])];
    if (!completed.includes(session.currentContact.id)) completed.push(session.currentContact.id);
    const nextPending = session.actionableContacts.filter((contact) => !completed.includes(contact.id));

    setSessionByCompany((current) => ({
      ...current,
      [companyId]: {
        currentContactId: session.currentContact?.id ?? nextPending[0]?.id ?? null,
        completedContactIds: completed,
      },
    }));
  };

  const handleInteractionSuccess = (companyId: string, payload: LogInteractionSuccessPayload) => {
    updateCompany(companyId, (company) => ({
      ...company,
      leadScore: company.leadScore + Math.max(payload.interaction.scoreImpact, 0),
      contacts: company.contacts.map((contact) =>
        payload.contactUpdate && contact.id === payload.contactUpdate.id
          ? { ...contact, commercialStatus: payload.contactUpdate.commercialStatus, buyingRole: payload.contactUpdate.buyingRole, lastValidatedAt: payload.contactUpdate.lastValidatedAt }
          : contact
      ),
      interactions: sortInteractions([payload.interaction, ...company.interactions]),
    }));
  };

  const handleTaskSuccess = (companyId: string, payload: CreateTaskSuccessPayload) => {
    updateCompany(companyId, (company) => ({
      ...company,
      interactions: sortInteractions([payload.interaction, ...company.interactions]),
    }));
  };

  const removeContactChannel = async (companyId: string, contactId: string, type: "email" | "phone", value: string) => {
    const result = await deleteContactInfo(contactId, type, value);
    if (!result.success) {
      alert("No se pudo actualizar el contacto.");
      return;
    }

    updateCompany(companyId, (company) => ({
      ...company,
      contacts: company.contacts.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              emails: type === "email" ? contact.emails.filter((item) => item !== value) : contact.emails,
              phones: type === "phone" ? contact.phones.filter((item) => item !== value) : contact.phones,
            }
          : contact
      ),
    }));
  };

  const renderExpanded = (item: ProspectingCompanyView) => {
    const { company, allInteractions, nextTask } = item;
    const session = getSession(company, sessionByCompany[company.id]);
    const readiness = getReadiness(company, allInteractions);
    const currentContact = session.currentContact;
    const quoteRequested = allInteractions.some((interaction) => interaction.outcome === "REQUESTED_QUOTE");

    return (
      <div className="space-y-4 px-3 py-4 sm:px-5 lg:px-6">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-background to-primary/[0.03] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sesion de caceria</h4>
                <p className="mt-1 text-sm text-muted-foreground">El bloque principal del hunter. Aqui se ejecuta el contacto actual y se decide el siguiente paso.</p>
              </div>
              <Badge variant="outline" className={readiness.tone}>{readiness.label}</Badge>
            </div>

            <div className="rounded-xl border bg-background/70 p-3">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground"><span>Avance de sesion</span><span>{session.completedContacts.length}/{session.actionableContacts.length || 0}</span></div>
              <Progress value={session.progressValue} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {session.exhausted
                  ? "Ya agotaste los contactos accionables."
                  : session.currentContactCompleted
                    ? `${session.pendingContacts.length} contacto(s) pendiente(s). El ultimo contacto trabajado sigue visible por si necesitas ajustar algo.`
                    : `${session.pendingContacts.length} contacto(s) pendiente(s).`}
              </p>
            </div>

            <div className="rounded-xl border bg-background/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contactos de la sesion</p>
                  <p className="mt-1 text-xs text-muted-foreground">Puedes elegir manualmente con quien comenzar o retomar la caceria.</p>
                </div>
                <Badge variant="outline">{session.actionableContacts.length} accionable(s)</Badge>
              </div>
              {session.actionableContacts.length > 0 ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {session.actionableContacts.map((contact) => {
                    const isCurrent = currentContact?.id === contact.id;
                    const isCompleted = session.completedContacts.some((item) => item.id === contact.id);
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => openSession(company.id, contact.id)}
                        className={`rounded-xl border p-3 text-left transition hover:border-primary/50 hover:bg-primary/[0.04] ${isCurrent ? "border-primary bg-primary/[0.06]" : "border-border bg-background"} ${isCompleted ? "opacity-90" : ""}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                          {isCurrent && <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">Actual</Badge>}
                          {isCompleted && <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800">Trabajado</Badge>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className={CONTACT_STATUS_STYLES[contact.commercialStatus]}>{CONTACT_STATUS_LABELS[contact.commercialStatus]}</Badge>
                          <Badge variant="outline">{BUYING_ROLE_LABELS[contact.buyingRole]}</Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {contact.phones.length} telefono(s) · {contact.emails.length} correo(s) {contact.linkedin ? "· LinkedIn disponible" : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No hay contactos accionables disponibles para elegir.</p>
              )}
            </div>

            {currentContact ? (
              <div className={`rounded-2xl border p-4 ${session.currentContactCompleted ? "border-emerald-200 bg-emerald-50/60" : "border-primary/20 bg-primary/[0.06]"}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="text-lg font-semibold">{currentContact.firstName} {currentContact.lastName}</h5>
                      <Badge variant="outline" className={CONTACT_STATUS_STYLES[currentContact.commercialStatus]}>{CONTACT_STATUS_LABELS[currentContact.commercialStatus]}</Badge>
                      <Badge variant="outline">{BUYING_ROLE_LABELS[currentContact.buyingRole]}</Badge>
                      {session.currentContactCompleted && <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800">Culminado en esta sesion</Badge>}
                      {currentContact.linkedin && <a href={currentContact.linkedin.startsWith("http") ? currentContact.linkedin : `https://${currentContact.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800"><Linkedin className="h-4 w-4" /></a>}
                    </div>
                    <div className="grid gap-2">
                      {currentContact.phones.map((phone) => <div key={phone} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"><PhoneCall className="h-3.5 w-3.5 text-emerald-600" /><span>{phone}</span><button type="button" className="ml-auto text-red-400 hover:text-red-600" onClick={() => removeContactChannel(company.id, currentContact.id, "phone", phone)}><X className="h-3.5 w-3.5" /></button></div>)}
                      {currentContact.emails.map((email) => <div key={email} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"><Mail className="h-3.5 w-3.5 text-blue-600" /><span className="truncate">{email}</span><button type="button" className="ml-auto text-red-400 hover:text-red-600" onClick={() => removeContactChannel(company.id, currentContact.id, "email", email)}><X className="h-3.5 w-3.5" /></button></div>)}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                    <LogInteractionModal companyId={company.id} contacts={company.contacts} defaultContactId={currentContact.id} lockedContact onSuccess={(payload) => handleInteractionSuccess(company.id, payload)} triggerButton={<Button className="w-full justify-start bg-primary text-primary-foreground shadow-sm"><PhoneCall className="mr-2 h-4 w-4" /> Registrar intento</Button>} />
                    <CreateTaskModal companyId={company.id} contacts={company.contacts} defaultContactId={currentContact.id} onSuccess={(payload) => handleTaskSuccess(company.id, payload)} triggerButton={<Button variant="outline" className="w-full justify-start"><CalendarClock className="mr-2 h-4 w-4" /> Crear tarea</Button>} />
                    <Button variant="outline" className="w-full justify-start" asChild><Link href={`/contacts/${currentContact.id}`}><Pencil className="mr-2 h-4 w-4" /> Corregir contacto</Link></Button>
                    {session.currentContactCompleted ? (
                      session.nextPendingContact ? (
                        <Button variant="secondary" className="w-full justify-start" onClick={() => openSession(company.id, session.nextPendingContact?.id)}><PhoneCall className="mr-2 h-4 w-4" /> Ir al siguiente pendiente</Button>
                      ) : (
                        <Button variant="secondary" className="w-full justify-start" disabled><CheckCircle2 className="mr-2 h-4 w-4" /> Contacto ya culminado</Button>
                      )
                    ) : (
                      <Button variant="secondary" className="w-full justify-start" onClick={() => finishCurrentContact(company.id)}><CheckCircle2 className="mr-2 h-4 w-4" /> Terminar contacto</Button>
                    )}
                    {quoteRequested && <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700" asChild><Link href={`/crm/opportunities/new?companyId=${company.id}&contactId=${currentContact.id}`}><TrendingUp className="mr-2 h-4 w-4" /> Abrir oportunidad ahora</Link></Button>}
                  </div>
                </div>
                <div className="mt-4 rounded-lg border bg-background/80 p-3 text-sm text-muted-foreground">{nextTask ? `Proximo seguimiento: ${formatDateTime(nextTask.nextFollowUpDate)}` : "Aun no hay seguimiento programado."}</div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 p-4">
                <p className="text-sm font-medium">{session.actionableContacts.length === 0 ? "No quedan contactos accionables." : "Ya trabajaste todos los contactos accionables de esta sesion."}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <CreateTaskModal companyId={company.id} contacts={company.contacts} defaultContactId="none" isSimplePostpone onSuccess={(payload) => { handleTaskSuccess(company.id, payload); setPostponedIds((current) => new Set(current).add(company.id)); }} triggerButton={<Button><Calendar className="mr-2 h-4 w-4" /> Posponer cuenta</Button>} />
                  <Button variant="outline" asChild><Link href={`/contacts/new?companyId=${company.id}`}><Plus className="mr-2 h-4 w-4" /> Anadir contacto</Link></Button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-background p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Historial de interacciones</h4>
                <p className="mt-1 text-sm text-muted-foreground">Tu memoria operativa inmediata. Antes de volver a llamar, mira esto.</p>
              </div>
              <Badge variant="outline">{allInteractions.length} registro(s)</Badge>
            </div>
              <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
                {allInteractions.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    Aun no hay interacciones registradas en esta cuenta.
                  </div>
                ) : allInteractions.map((interaction) => {
                  const followUpDate = interaction.nextFollowUpDate ? toDate(interaction.nextFollowUpDate)?.toISOString().split("T")[0] ?? null : null;
                  const isOverdueFollowUp = Boolean(
                    followUpDate &&
                    followUpDate < todayDate &&
                    !interaction.isFollowUpCompleted
                  );

                  return (
                    <div key={interaction.id} className={`relative overflow-hidden rounded-lg border p-3 ${getOutcomeTone(interaction.outcome)}`}>
                      <div className={`absolute inset-y-0 left-0 w-1 ${getOutcomeAccent(interaction.outcome)}`} />
                      <div className="pl-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{interaction.type}</Badge>
                          {interaction.contact && (
                            <Badge variant="outline">
                              con {interaction.contact.firstName} {interaction.contact.lastName}
                            </Badge>
                          )}
                          {interaction.outcome && (
                            <Badge variant="outline" className={interaction.outcome === "REQUESTED_QUOTE" ? "border-emerald-300 bg-emerald-100 text-emerald-800" : undefined}>
                              {OUTCOME_LABELS[interaction.outcome]}
                            </Badge>
                          )}
                          {interaction.nextFollowUpDate && !interaction.isFollowUpCompleted && (
                            <Badge variant="outline" className={isOverdueFollowUp ? "border-red-300 bg-red-100 text-red-800" : "border-amber-300 bg-amber-100 text-amber-800"}>
                              {isOverdueFollowUp ? "Seguimiento vencido" : "Seguimiento pendiente"}
                            </Badge>
                          )}
                          {interaction.outcome === "NO_RESPONSE" && (
                            <Badge variant="outline" className="border-rose-300 bg-rose-100 text-rose-800">
                              Reintento probable
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(interaction.interactedAt, { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {interaction.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">{interaction.notes}</p>
                        )}
                        {interaction.nextFollowUpDate && (
                          <p className={`mt-2 text-xs ${isOverdueFollowUp ? "font-medium text-red-700" : "text-muted-foreground"}`}>
                            {isOverdueFollowUp ? "Vence" : "Programado"}: {formatDateTime(interaction.nextFollowUpDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
        </div>

        <section className="rounded-2xl border bg-background/80 p-4">
          <div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Opinion comercial</p>
              <p className="mt-1 text-sm text-muted-foreground">Se muestra la conclusion de investigacion para no perder el contexto comercial mientras avanzas la caceria.</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border bg-background p-4">
            <p className="text-sm leading-6 text-foreground">
              {company.researchSummary?.trim() || "Aun no hay opinion comercial registrada para esta cuenta."}
            </p>
            {(company.researchLastReviewedAt || company.researchNextAction?.trim()) && (
              <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ultima revision</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(company.researchLastReviewedAt) || "Sin fecha"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Siguiente accion sugerida</p>
                  <p className="mt-1 text-sm text-muted-foreground">{company.researchNextAction?.trim() || "No se definio una siguiente accion desde investigacion."}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderDesktopTable = (data: ProspectingCompanyView[], emptyMessage: string) => {
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const paginatedData = data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    return (
      <div className="hidden flex-col gap-4 md:flex">
        <div className="overflow-hidden rounded-md border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Prospecto</TableHead><TableHead>Sesion actual</TableHead><TableHead>Seguimiento</TableHead><TableHead>Termometro</TableHead><TableHead className="text-right">Accion</TableHead></TableRow></TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow> : paginatedData.map((item) => {
                const session = getSession(item.company, sessionByCompany[item.company.id]);
                const readiness = getReadiness(item.company, item.allInteractions);
                const bestContact = getBestOpportunityContact(item.company);
                const isExpanded = expandedCompanies.has(item.company.id);
                const isOverdue = Boolean(item.nextTaskFormattedDate && item.nextTaskFormattedDate < todayDate);
                const isToday = Boolean(item.nextTaskFormattedDate && item.nextTaskFormattedDate === todayDate);
                return (
                  <Fragment key={item.company.id}>
                    <TableRow className={isExpanded ? "border-b-0" : ""}>
                      <TableCell><div className="flex items-start gap-3"><Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" /><div className="space-y-2"><div><p className="font-medium leading-none">{item.company.businessName}</p><p className="mt-1 text-[10px] text-muted-foreground">RUC: {item.company.documentNumber}</p></div><div className="flex flex-wrap gap-2"><Badge variant="outline" className={readiness.tone}>{readiness.label}</Badge><Badge variant="secondary">{item.company.leadScore} pts</Badge></div></div></div></TableCell>
                      <TableCell><div className="space-y-2 text-sm">{session.currentContact ? <><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{session.currentContact.firstName} {session.currentContact.lastName}</span><Badge variant="outline" className={`h-4 text-[9px] ${CONTACT_STATUS_STYLES[session.currentContact.commercialStatus]}`}>{CONTACT_STATUS_LABELS[session.currentContact.commercialStatus]}</Badge></div><p className="text-xs text-muted-foreground">Pendientes: {session.pendingContacts.length} - Trabajados: {session.completedContacts.length}</p></> : <p className="text-xs text-muted-foreground">Sin contactos pendientes</p>}<button type="button" onClick={() => toggleExpand(item.company.id)} className="flex items-center gap-1 text-[11px] text-primary hover:underline"><History className="h-3 w-3" /> {isExpanded ? "Ocultar" : "Abrir"} detalle {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button></div></TableCell>
                      <TableCell>{item.nextTask ? <div className="flex flex-col gap-1"><span className={`flex items-center text-xs font-bold ${isOverdue ? "text-red-600" : isToday ? "text-amber-600" : "text-blue-600"}`}>{isOverdue && <AlertCircle className="mr-1 h-3 w-3" />}{isToday && <Clock className="mr-1 h-3 w-3" />}{!isOverdue && !isToday && <Calendar className="mr-1 h-3 w-3" />}{isOverdue ? `Atrasado: ${item.nextTaskFormattedDate}` : isToday ? "Toca hoy" : `Proximo: ${item.nextTaskFormattedDate}`}</span><span className="max-w-[150px] truncate text-[10px] text-muted-foreground">Ult. nota: {item.lastInteraction?.notes || "Ninguna"}</span></div> : <Badge variant="outline" className="border-dashed text-muted-foreground">Sin seguimiento</Badge>}</TableCell>
                      <TableCell><div className="space-y-2"><Progress value={session.progressValue} /><p className="text-xs text-muted-foreground">Sesion {session.progressValue}% completada</p></div></TableCell>
                      <TableCell className="text-right"><div className="flex flex-col items-end gap-2">{session.currentContact ? <Button size="sm" variant="outline" className="h-8 w-[170px]" onClick={() => openSession(item.company.id)}><PhoneCall className="mr-1 h-3 w-3" /> Continuar sesion</Button> : <CreateTaskModal companyId={item.company.id} contacts={item.company.contacts} defaultContactId="none" isSimplePostpone onSuccess={(payload) => { handleTaskSuccess(item.company.id, payload); setPostponedIds((current) => new Set(current).add(item.company.id)); }} triggerButton={<Button size="sm" variant="outline" className="h-8 w-[170px] border-dashed border-primary/50 text-primary"><Calendar className="mr-1 h-3 w-3" /> Posponer cuenta</Button>} />}<Button variant={readiness.ready ? "default" : "ghost"} size="sm" className={readiness.ready ? "h-8 w-[170px] bg-emerald-600 hover:bg-emerald-700" : "h-7 w-[170px] text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"} asChild><Link href={`/crm/opportunities/new?companyId=${item.company.id}${bestContact ? `&contactId=${bestContact.id}` : ""}`}><TrendingUp className="mr-1 h-3 w-3" /> {readiness.ready ? "Abrir oportunidad" : "Aun verde"}</Link></Button><DisqualifyModal companyId={item.company.id} companyName={item.company.businessName} onSuccess={() => setPostponedIds((current) => new Set(current).add(item.company.id))} triggerButton={<Button variant="ghost" size="sm" className="h-7 w-[170px] text-red-500 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1 h-3 w-3" /> Descartar</Button>} /></div></TableCell>
                    </TableRow>
                    {isExpanded && <TableRow><TableCell colSpan={5} className="bg-muted/30 p-0">{renderExpanded(item)}</TableCell></TableRow>}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && <div className="flex items-center justify-between border-t border-border px-2 pt-4"><p className="text-sm text-muted-foreground">Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, data.length)} de {data.length} prospectos</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Anterior</Button><span className="text-sm font-medium">Pagina {currentPage} de {totalPages}</span><Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Siguiente</Button></div></div>}
      </div>
    );
  };

  const renderMobileCards = (data: ProspectingCompanyView[], emptyMessage: string) => (
    <div className="space-y-4 md:hidden">
      {data.length === 0 ? <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">{emptyMessage}</div> : data.map((item) => {
        const session = getSession(item.company, sessionByCompany[item.company.id]);
        const readiness = getReadiness(item.company, item.allInteractions);
        const isExpanded = expandedCompanies.has(item.company.id);
        return (
          <div key={item.company.id} className="overflow-hidden rounded-xl border bg-card">
            <div className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3"><div className="space-y-2"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><h3 className="font-semibold">{item.company.businessName}</h3></div><p className="text-xs text-muted-foreground">RUC: {item.company.documentNumber}</p><div className="flex flex-wrap gap-2"><Badge variant="outline" className={readiness.tone}>{readiness.label}</Badge><Badge variant="secondary">{item.company.leadScore} pts</Badge></div></div><button type="button" onClick={() => toggleExpand(item.company.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></div>
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">{session.currentContact ? <><p className="font-medium">Contacto actual</p><p className="mt-1">{session.currentContact.firstName} {session.currentContact.lastName}</p><p className="mt-1 text-xs text-muted-foreground">Pendientes: {session.pendingContacts.length} - Trabajados: {session.completedContacts.length}</p></> : <><p className="font-medium">Sin contactos accionables pendientes</p><p className="mt-1 text-xs text-muted-foreground">Programa seguimiento o actualiza la base.</p></>}</div>
              <Button variant="outline" onClick={() => openSession(item.company.id)}>{session.currentContact ? "Continuar sesion" : "Abrir detalle"}</Button>
            </div>
            {isExpanded && <div className="border-t bg-muted/20">{renderExpanded(item)}</div>}
          </div>
        );
      })}
    </div>
  );

  const renderGroup = (data: ProspectingCompanyView[], emptyMessage: string) => (
    <>
      {renderMobileCards(data, emptyMessage)}
      {renderDesktopTable(data, emptyMessage)}
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <PhoneCall className="h-7 w-7 text-amber-500 sm:h-8 sm:w-8" />
          Caceria (Tareas Diarias)
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Caceria termina cuando la empresa pide su primera cotizacion. Trabaja contacto por contacto, registra cada intento y solo pospone la cuenta cuando ya agotaste la sesion.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setCurrentPage(1); }} className="w-full">
        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-2 sm:grid-cols-4 md:mb-6 lg:w-[700px]">
          <TabsTrigger value="today" className="relative">Hoy{grouped.today.length > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{grouped.today.length}</span>}</TabsTrigger>
          <TabsTrigger value="queue">En Cola ({grouped.queue.length})</TabsTrigger>
          <TabsTrigger value="exhausted">Agotadas ({grouped.exhausted.length})</TabsTrigger>
          <TabsTrigger value="inactive">Sin Siguiente Paso ({grouped.noNextStep.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Hoy:</strong> Aqui vive lo urgente. Son cuentas con seguimiento para hoy o atrasado y todavia con sesion util por trabajar.</div>
          {renderGroup(grouped.today, "No tienes tareas programadas para hoy ni llamadas atrasadas. Estas al dia.")}
        </TabsContent>
        <TabsContent value="queue">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><strong>En Cola:</strong> Empresas nuevas o futuras que existen en tu radar, pero que no requieren accion hoy.</div>
          {renderGroup(grouped.queue, "No tienes cuentas en cola por ahora.")}
        </TabsContent>
        <TabsContent value="exhausted">
          <div className="rounded-md border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900"><strong>Agotadas:</strong> Cuentas donde ya no quedan contactos accionables en la sesion actual. Aqui toca posponer o enriquecer la base.</div>
          {renderGroup(grouped.exhausted, "No tienes cuentas agotadas en este momento.")}
        </TabsContent>
        <TabsContent value="inactive">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><strong>Sin Siguiente Paso:</strong> Empresas con historial pero sin una accion futura programada. Son fugas de disciplina comercial.</div>
          {renderGroup(grouped.noNextStep, "Todas tus cuentas activas tienen un siguiente paso claro.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
