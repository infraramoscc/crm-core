"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle, CheckCircle2, Clock, Building2, Phone, Mail, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import type { FollowUpType, InteractionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { completeTask } from "@/app/actions/crm/task-actions";
import { matchesSearch } from "@/lib/search";
import { useScopedSearch } from "@/components/layout/SearchProvider";

interface TaskItem {
    id: string;
    companyId: string;
    type: InteractionType;
    notes: string | null;
    nextFollowUpDate: string | Date | null;
    followUpType: FollowUpType | null;
    company: {
        id: string;
        businessName: string;
    } | null;
    contact: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
}

export default function TasksClient({ initialTasks }: { initialTasks: TaskItem[] }) {
    const [tasks, setTasks] = useState(initialTasks);
    const [completingId, setCompletingId] = useState<string | null>(null);
    const { query: searchQuery } = useScopedSearch();

    const handleCompleteTask = async (taskId: string) => {
        setCompletingId(taskId);
        const result = await completeTask(taskId);
        if (result.success) {
            setTasks((prev) => prev.filter((task) => task.id !== taskId));
        }
        setCompletingId(null);
    };

    const filteredTasks = useMemo(
        () =>
            tasks.filter((task) =>
                matchesSearch(searchQuery, task.company?.businessName, task.contact?.firstName, task.contact?.lastName, task.notes, task.followUpType)
            ),
        [tasks, searchQuery]
    );

    const dueToday = filteredTasks.filter(t => {
        if (!t.nextFollowUpDate) return false;
        const taskDate = new Date(t.nextFollowUpDate);
        taskDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
    });

    const overdue = filteredTasks.filter(t => {
        if (!t.nextFollowUpDate) return false;
        return new Date(t.nextFollowUpDate) < new Date() && !dueToday.includes(t);
    });

    const upcoming = filteredTasks.filter(t => {
        if (!t.nextFollowUpDate) return false;
        return new Date(t.nextFollowUpDate) > new Date() && !dueToday.includes(t);
    });

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    };

    const renderTaskCard = (t: TaskItem, isOverdue: boolean) => (
        <Card key={t.id} className={`group hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50/10' : ''}`}>
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className={`mt-1 p-2 rounded-full ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {t.followUpType === 'CALL' ? <Phone className="h-5 w-5" /> :
                            t.followUpType === 'EMAIL' ? <Mail className="h-5 w-5" /> :
                                <CalendarClock className="h-5 w-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                                {isOverdue && <span className="mr-1">⚠️ Atrasada:</span>}
                                {format(new Date(t.nextFollowUpDate), "EEEE d 'de' MMMM", { locale: es })} a las {formatTime(t.nextFollowUpDate)}
                            </span>
                            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                                {t.followUpType}
                            </Badge>
                        </div>
                        <Link href={`/companies/${t.companyId}`} className="text-lg font-bold hover:underline hover:text-primary flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {t.company?.businessName}
                        </Link>
                        {t.contact && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                🗣️ Contactar a <span className="font-medium text-foreground">{t.contact.firstName} {t.contact.lastName}</span>
                            </p>
                        )}
                        {t.notes && t.type === 'SYSTEM_NOTE' === false && (
                            <p className="text-xs text-muted-foreground mt-2 border-l-2 border-muted pl-2 italic">
                                &quot;{t.notes}&quot;
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <Link href={`/crm/prospecting`} className="text-xs text-blue-600 hover:underline">
                        Ir a Cacería →
                    </Link>
                    <Button
                        variant="outline"
                        className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700"
                        onClick={() => handleCompleteTask(t.id)}
                        disabled={completingId === t.id}
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {completingId === t.id ? "Marcando..." : "Marcar Hecho"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <CalendarClock className="h-8 w-8 text-amber-500" />
                        Mi Agenda
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Todas las empresas que pospusiste y las tareas pendientes que asignaste por contacto.
                    </p>
                </div>
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold text-center">
                    <div className="text-2xl">{dueToday.length}</div>
                    <div className="text-[10px] uppercase tracking-wider">Para Hoy</div>
                </div>
            </div>

            {filteredTasks.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10">
                    <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-4" />
                    <h3 className="text-xl font-bold">¡Estás al día!</h3>
                    <p className="text-muted-foreground max-w-md mt-2">No tienes tareas agendadas ni cuentas pospuestas pendientes. Ve a Prospección para encontrar nuevas oportunidades.</p>
                    <Button asChild className="mt-6">
                        <Link href="/crm/prospecting">Ir a Prospección</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {overdue.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Tareas Atrasadas ({overdue.length})
                            </h2>
                            <div className="grid gap-3">
                                {overdue.map(t => renderTaskCard(t, true))}
                            </div>
                        </div>
                    )}

                    {dueToday.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Tareas para Hoy ({dueToday.length})
                            </h2>
                            <div className="grid gap-3">
                                {dueToday.map(t => renderTaskCard(t, false))}
                            </div>
                        </div>
                    )}

                    {upcoming.length > 0 && (
                        <div className="space-y-4 opacity-75">
                            <h2 className="text-xl font-bold text-muted-foreground flex items-center gap-2">
                                <CalendarClock className="h-5 w-5" />
                                Próximas Tareas ({upcoming.length})
                            </h2>
                            <div className="grid gap-3">
                                {upcoming.map(t => renderTaskCard(t, false))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
