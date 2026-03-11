"use client";

import Link from "next/link";
import { PhoneCall, Building2, Calendar, TrendingUp, Clock, AlertCircle, Trash2, MessageCircle, X, ChevronDown, ChevronUp, History, Pencil, CheckCircle2, MoreHorizontal, CalendarClock, Linkedin, Plus } from "lucide-react";
import { useState, useMemo, Fragment, useEffect } from "react";
import { deleteContactInfo } from "@/app/actions/crm/contact-actions";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogInteractionModal } from "@/components/crm/LogInteractionModal";
import { CreateTaskModal } from "@/components/crm/CreateTaskModal";
import { DisqualifyModal } from "@/components/crm/DisqualifyModal";

export default function ProspectingClient({ initialCompanies }: { initialCompanies: any[] }) {
    const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState("today");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [postponedIds, setPostponedIds] = useState<Set<string>>(new Set());
    const [lockedCategories, setLockedCategories] = useState<{ [id: string]: string }>({});

    const toggleExpand = (companyId: string) => {
        setExpandedCompanies(prev => {
            const next = new Set(prev);
            if (next.has(companyId)) next.delete(companyId);
            else next.add(companyId);
            return next;
        });
    };

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        setCurrentPage(1); // Reset page on tab change
    };

    const todayDate = new Date().toISOString().split('T')[0];

    const companiesList = useMemo(() => {
        if (!initialCompanies) return [];
        return initialCompanies.filter((company: any) => {
            const validContacts = company.contacts?.filter((c: any) => (c.emails && c.emails.length > 0) || (c.phones && c.phones.length > 0)) || [];
            const oppsCount = company.opportunities?.length || 0;
            return validContacts.length > 0 && oppsCount === 0;
        });
    }, [initialCompanies]);

    const companiesWithData = useMemo(() => {
        return companiesList.map((company: any) => {
            const ints = company.interactions || [];
            ints.sort((a: any, b: any) => new Date(b.interactedAt).getTime() - new Date(a.interactedAt).getTime());

            const lastInteraction = ints.length > 0 ? ints[0] : null;

            const pendingFollowUps = ints.filter((i: any) => i.nextFollowUpDate && !i.isFollowUpCompleted);
            pendingFollowUps.sort((a: any, b: any) => new Date(a.nextFollowUpDate!).getTime() - new Date(b.nextFollowUpDate!).getTime());
            const nextTask = pendingFollowUps.length > 0 ? pendingFollowUps[0] : null;

            let nextTaskFormattedDate = null;
            if (nextTask && nextTask.nextFollowUpDate) {
                nextTaskFormattedDate = new Date(nextTask.nextFollowUpDate).toISOString().split('T')[0];
            }

            return { company, lastInteraction, nextTask, allInteractions: ints, nextTaskFormattedDate };
        });
    }, [companiesList]);

    useEffect(() => {
        setLockedCategories(prev => {
            const next = { ...prev };
            let changed = false;
            companiesWithData.forEach(c => {
                if (!next[c.company.id]) {
                    let category = '';
                    if (!c.lastInteraction && !c.nextTask) category = 'new';
                    else if (c.nextTaskFormattedDate && c.nextTaskFormattedDate <= todayDate) category = 'today';
                    else if (c.nextTaskFormattedDate && c.nextTaskFormattedDate > todayDate) category = 'future';
                    else if (c.lastInteraction && !c.nextTask) category = 'inactive';

                    if (category) {
                        next[c.company.id] = category;
                        changed = true;
                    }
                }
            });
            return changed ? next : prev;
        });
    }, [companiesWithData, todayDate]);

    // Segmentación
    const visibleCompanies = companiesWithData.filter(c => !postponedIds.has(c.company.id));
    const nuevos = visibleCompanies.filter((c: any) => lockedCategories[c.company.id] === 'new');
    const paraHoyAtrasadas = visibleCompanies.filter((c: any) => lockedCategories[c.company.id] === 'today');
    const futuras = visibleCompanies.filter((c: any) => lockedCategories[c.company.id] === 'future');
    const sinSeguimientoActivo = visibleCompanies.filter((c: any) => lockedCategories[c.company.id] === 'inactive');

    const renderTable = (data: typeof companiesWithData, emptyMessage: string) => {
        const totalPages = Math.ceil(data.length / itemsPerPage);
        const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return (
            <div className="flex flex-col gap-4">
                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Prospecto a Atacar</TableHead>
                                <TableHead>Contactos Clave</TableHead>
                                <TableHead>Seguimiento</TableHead>
                                <TableHead>Termómetro (Score)</TableHead>
                                <TableHead className="text-right">Acción Requerida</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map(({ company, lastInteraction, nextTask, allInteractions, nextTaskFormattedDate }) => {
                                    const companyContacts = company.contacts?.filter((c: any) => (c.emails && c.emails.length > 0) || (c.phones && c.phones.length > 0)) || [];

                                    const isOverdue = nextTaskFormattedDate && nextTaskFormattedDate < todayDate;
                                    const isToday = nextTaskFormattedDate && nextTaskFormattedDate === todayDate;
                                    const isExpanded = expandedCompanies.has(company.id);

                                    const interactionTypeLabel = (t: string) => {
                                        switch (t) {
                                            case 'CALL_MADE': return '📞 Llamada';
                                            case 'WHATSAPP_SENT': return '💬 WhatsApp Enviado';
                                            case 'EMAIL_SENT': return '✉️ Correo Enviado';
                                            case 'EMAIL_OPENED': return '📨 Correo Abierto';
                                            case 'MEETING': return '🤝 Reunión';
                                            default: return t;
                                        }
                                    };

                                    return (
                                        <Fragment key={company.id}>
                                            <TableRow className={isExpanded ? 'border-b-0' : ''}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium leading-none">{company.businessName}</p>
                                                            <p className="text-[10px] text-muted-foreground mt-1">RUC: {company.documentNumber}</p>
                                                            <div className="flex gap-2 mt-2">
                                                                {company.importVolume === 'HIGH' && <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">Volumen Alto</Badge>}
                                                                {company.valueDriver === 'PRICE' && <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px]">Busca Precio</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col gap-3">
                                                        {companyContacts.slice(0, 3).map((c: any) => {
                                                            // Verify if contacted today
                                                            const contactedToday = allInteractions.some((int: any) => int.contactId === c.id && int.interactedAt.split('T')[0] === todayDate);

                                                            return (
                                                                <div key={c.id} className={`text-sm border-b pb-2 last:border-0 last:pb-0 ${contactedToday ? 'bg-emerald-50/50 p-1 rounded -ml-1 border-emerald-100' : ''}`}>
                                                                    <div className="flex items-center justify-between font-semibold mb-1 group">
                                                                        <div className="flex items-center gap-1">
                                                                            🗣️ {c.firstName} {c.lastName}
                                                                            {c.linkedin && (
                                                                                <a
                                                                                    href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-blue-600 hover:text-blue-800 ml-1"
                                                                                    title="Perfil de LinkedIn"
                                                                                >
                                                                                    <Linkedin className="h-3 w-3 inline" />
                                                                                </a>
                                                                            )}
                                                                            {contactedToday && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1" />}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <LogInteractionModal
                                                                                companyId={company.id}
                                                                                contacts={companyContacts}
                                                                                defaultContactId={c.id}
                                                                                lockedContact={true}
                                                                                onSuccess={() => { }}
                                                                                triggerButton={
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 hover:text-primary" title="Registrar Acción">
                                                                                        <PhoneCall className="h-3 w-3" />
                                                                                    </Button>
                                                                                }
                                                                            />
                                                                            <CreateTaskModal
                                                                                companyId={company.id}
                                                                                contacts={companyContacts}
                                                                                defaultContactId={c.id}
                                                                                onSuccess={() => { }}
                                                                                triggerButton={
                                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600 hover:bg-amber-100 hover:text-amber-700" title="Agendar Tarea">
                                                                                        <CalendarClock className="h-3 w-3" />
                                                                                    </Button>
                                                                                }
                                                                            />
                                                                            <Link href={`/contacts/${c.id}`} className="text-muted-foreground hover:text-blue-600" title="Editar Contacto">
                                                                                <Pencil className="h-3 w-3" />
                                                                            </Link>
                                                                        </div>
                                                                    </div>

                                                                    {/* Lista de Teléfonos */}
                                                                    {
                                                                        c.phones && c.phones.length > 0 && c.phones.map((phone: string, idx: number) => (
                                                                            <div key={idx} className="flex items-center justify-between group pl-4 mb-1 text-xs text-muted-foreground">
                                                                                <div className="flex items-center gap-2">
                                                                                    <PhoneCall className="h-3 w-3" />
                                                                                    <span>{phone}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <a
                                                                                        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${c.firstName}, soy Gualbert, analizando las importaciones de ${company.businessName}...`)}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-emerald-500 hover:text-emerald-600"
                                                                                        title="Hablar por WhatsApp"
                                                                                    >
                                                                                        <MessageCircle className="h-3 w-3" />
                                                                                    </a>
                                                                                    <button
                                                                                        onClick={() => deleteContactInfo(c.id, 'phone', phone)}
                                                                                        className="text-red-400 hover:text-red-600"
                                                                                        title="Descartar número"
                                                                                    >
                                                                                        <X className="h-3 w-3" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    }

                                                                    {/* Lista de Correos */}
                                                                    {
                                                                        c.emails && c.emails.length > 0 && c.emails.map((email: string, idx: number) => (
                                                                            <div key={idx} className="flex items-center justify-between group pl-4 mb-1 text-xs text-muted-foreground">
                                                                                <span>✉️ {email}</span>
                                                                                <button
                                                                                    onClick={() => deleteContactInfo(c.id, 'email', email)}
                                                                                    className="text-red-400 hover:text-red-600 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                    title="Descartar correo que rebotó"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </button>
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </div>
                                                            );
                                                        })}
                                                        {companyContacts.length > 3 && (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                +{companyContacts.length - 3} contactos ocultos
                                                            </span>
                                                        )}
                                                        <Link href={`/contacts/new?companyId=${company.id}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px] mt-1 font-medium">
                                                            <Plus className="h-3 w-3" /> Añadir Contacto
                                                        </Link>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col gap-2">
                                                        {nextTask ? (
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`flex items-center text-xs font-bold ${isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-blue-600'}`}>
                                                                    {isOverdue && <AlertCircle className="h-3 w-3 mr-1" />}
                                                                    {isToday && <Clock className="h-3 w-3 mr-1" />}
                                                                    {!isOverdue && !isToday && <Calendar className="h-3 w-3 mr-1" />}
                                                                    {isOverdue ? `Atrasado: ${nextTaskFormattedDate}` : isToday ? 'Toca Hoy' : `Próximo: ${nextTaskFormattedDate}`}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                                    Últ. nota: {lastInteraction?.notes || "Ninguna"}
                                                                </span>
                                                            </div>
                                                        ) : lastInteraction ? (
                                                            <span className="flex items-center text-xs text-muted-foreground">
                                                                Últ: {new Date(lastInteraction.interactedAt).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground border-dashed">Sin Contactar</Badge>
                                                        )}

                                                        {/* Botón Ver Historial */}
                                                        {allInteractions.length > 0 && (
                                                            <button
                                                                onClick={() => toggleExpand(company.id)}
                                                                className="flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                                                            >
                                                                <History className="h-3 w-3" />
                                                                {isExpanded ? 'Ocultar' : 'Ver'} Historial ({allInteractions.length})
                                                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold">{company.leadScore} pts</span>
                                                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div className={`h-full ${company.leadScore > 50 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(company.leadScore, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right flex flex-col items-end justify-center gap-2 min-h-full">
                                                    <CreateTaskModal
                                                        companyId={company.id}
                                                        contacts={companyContacts}
                                                        defaultContactId="none"
                                                        isSimplePostpone={true}
                                                        onSuccess={() => setPostponedIds(p => new Set(p).add(company.id))}
                                                        triggerButton={
                                                            <Button size="sm" variant="outline" className="h-8 border-dashed border-primary/50 text-primary w-[140px]">
                                                                <Calendar className="h-3 w-3 mr-1" /> Posponer Cuenta
                                                            </Button>
                                                        }
                                                    />
                                                    <Button variant="ghost" size="sm" className="h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                                                        <Link href={`/crm/opportunities/new?companyId=${company.id}`}>
                                                            <TrendingUp className="h-3 w-3 mr-1" /> Convertir a Oportunidad
                                                        </Link>
                                                    </Button>
                                                    <DisqualifyModal
                                                        companyId={company.id}
                                                        companyName={company.businessName}
                                                        onSuccess={() => setPostponedIds(p => new Set(p).add(company.id))}
                                                        triggerButton={
                                                            <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                <Trash2 className="h-3 w-3 mr-1" /> Descartar
                                                            </Button>
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>

                                            {/* === FILA EXPANDIBLE: Mini-Timeline === */}
                                            {
                                                isExpanded && allInteractions.length > 0 && (
                                                    <TableRow key={`${company.id}-timeline`}>
                                                        <TableCell colSpan={5} className="bg-muted/30 p-0">
                                                            <div className="px-6 py-4">
                                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                                                                    <History className="h-3 w-3" /> Historial de Interacciones — {company.businessName}
                                                                </h4>
                                                                <div className="relative border-l-2 border-primary/20 ml-2 space-y-4">
                                                                    {allInteractions.map((interaction: any, idx: number) => (
                                                                        <div key={interaction.id} className="relative pl-6">
                                                                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] ${idx === 0 ? 'bg-primary border-primary text-white' : 'bg-background border-muted-foreground/40 text-muted-foreground'
                                                                                }`}>
                                                                                {interaction.type === 'CALL_MADE' ? '📞' : interaction.type === 'WHATSAPP_SENT' ? '💬' : interaction.type === 'EMAIL_SENT' ? '✉' : interaction.type === 'MEETING' ? '🤝' : '📨'}
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <span className="text-xs font-semibold">{interactionTypeLabel(interaction.type)}</span>
                                                                                    <span className="text-[10px] text-muted-foreground">
                                                                                        {new Date(interaction.interactedAt).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                                                    </span>
                                                                                    {interaction.contact && (
                                                                                        <Badge variant="outline" className="text-[10px] h-4">
                                                                                            con {interaction.contact.firstName} {interaction.contact.lastName}
                                                                                        </Badge>
                                                                                    )}
                                                                                    {interaction.scoreImpact > 0 && (
                                                                                        <span className="text-[10px] font-bold text-emerald-600">+{interaction.scoreImpact} pts</span>
                                                                                    )}
                                                                                </div>
                                                                                {interaction.notes && (
                                                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                                                        {interaction.notes}
                                                                                    </p>
                                                                                )}
                                                                                {interaction.nextFollowUpDate && (
                                                                                    <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${interaction.isFollowUpCompleted ? 'text-muted-foreground line-through' : 'text-amber-600 font-semibold'
                                                                                        }`}>
                                                                                        <Calendar className="h-2.5 w-2.5" />
                                                                                        Seguimiento: {new Date(interaction.nextFollowUpDate).toLocaleDateString('es-PE')}
                                                                                        {interaction.isFollowUpCompleted && ' ✔ Hecho'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            }
                                        </Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {
                    totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border pt-4 px-2">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, data.length)} de {data.length} prospectos
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
                                    Página {currentPage} de {totalPages}
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
                    )
                }
            </div >
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <PhoneCall className="h-8 w-8 text-amber-500" />
                        Cacería (Tareas Diarias)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Tu agenda de prospección. Llama, anota en el diario programando la próxima llamada, hasta lograr una cotización.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full lg:w-[600px] grid-cols-4 mb-6">
                    <TabsTrigger value="today" className="relative">
                        Para Hoy / Atrasadas
                        {paraHoyAtrasadas.length > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                                {paraHoyAtrasadas.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="new">Nuevos ({nuevos.length})</TabsTrigger>
                    <TabsTrigger value="future">Futuros ({futuras.length})</TabsTrigger>
                    <TabsTrigger value="inactive">Inactivos ({sinSeguimientoActivo.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-4">
                    <div className="bg-amber-50 text-amber-900 border border-amber-200 p-4 rounded-md text-sm mb-4">
                        <strong>Objetivo de Hoy:</strong> Tienes {paraHoyAtrasadas.length} empresa(s) agendadas para llamar o que dejaste atrasadas. ¡A cazar!
                    </div>
                    {renderTable(paraHoyAtrasadas, "No tienes tareas programadas para hoy ni llamadas atrasadas. ¡Estás al día! 🎉")}
                </TabsContent>

                <TabsContent value="new">
                    <div className="bg-blue-50 text-blue-900 border border-blue-200 p-4 rounded-md text-sm mb-4">
                        <strong>Nuevos Leads:</strong> Empresas que salieron de &apos;Investigación&apos; (ya tienen correo/teléfono) pero a las que jamás has contactado.
                    </div>
                    {renderTable(nuevos, "No hay prospectos nuevos intocados.")}
                </TabsContent>

                <TabsContent value="future">
                    {renderTable(futuras, "No tienes tareas programas para días posteriores a hoy.")}
                </TabsContent>

                <TabsContent value="inactive">
                    <div className="bg-slate-50 text-slate-600 border border-slate-200 p-4 rounded-md text-sm mb-4">
                        <strong>Sin Seguimiento:</strong> Empresas a las que llamaste alguna vez, pero olvidaste programarles un &quot;Próximo Seguimiento&quot;. Retómalas.
                    </div>
                    {renderTable(sinSeguimientoActivo, "Todas tus interacciones pasadas tienen una futura llamada programada. ¡Excelente!")}
                </TabsContent>
            </Tabs>
        </div>
    );
}
