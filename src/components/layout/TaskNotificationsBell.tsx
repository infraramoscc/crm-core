"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPendingTasks } from "@/app/actions/crm/task-actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function TaskNotificationsBell() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        const doFetch = async () => {
            const result = await getPendingTasks();
            if (mounted && result.success && result.data) {
                setTasks(result.data);
            }
        };
        doFetch();
        const interval = setInterval(doFetch, 5 * 60 * 1000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const dueToday = tasks.filter(t => {
        if (!t.nextFollowUpDate) return false;
        const taskDate = new Date(t.nextFollowUpDate);
        taskDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
    });

    const overdue = tasks.filter(t => {
        if (!t.nextFollowUpDate) return false;
        return new Date(t.nextFollowUpDate) < new Date() && !dueToday.includes(t);
    });

    const pendingCount = dueToday.length + overdue.length;

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="group relative" onClick={() => { if (!open) fetchTasks(); }}>
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {pendingCount > 0 && (
                        <span className="absolute 0 top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold border-2 border-background">
                            {pendingCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[340px]">
                <DropdownMenuLabel className="font-bold flex justify-between items-center">
                    Tus Tareas
                    <Badge variant="secondary" className="text-xs">{pendingCount} Pendientes</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="max-h-[300px] overflow-y-auto">
                    {overdue.length > 0 && (
                        <div className="px-2 py-1 text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50">
                            Atrasadas
                        </div>
                    )}
                    {overdue.map(t => (
                        <DropdownMenuItem key={t.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer" asChild>
                            <Link href="/crm/prospecting">
                                <div className="flex justify-between w-full">
                                    <span className="font-semibold text-sm">{t.company?.businessName}</span>
                                    <span className="text-xs text-red-500 flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Ayer</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {t.followUpType === 'CALL' ? '📞 Llamada' : t.followUpType === 'EMAIL' ? '✉️ Correo' : t.followUpType === 'MEETING' ? '🤝 Reunión' : '📌 Tarea'}{t.contact ? ` con ${t.contact.firstName}` : ''}
                                </span>
                            </Link>
                        </DropdownMenuItem>
                    ))}

                    {dueToday.length > 0 && (
                        <div className="px-2 py-1 text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 rounded-t-sm mt-1">
                            Para Hoy
                        </div>
                    )}
                    {dueToday.map(t => (
                        <DropdownMenuItem key={t.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-amber-50/50" asChild>
                            <Link href="/crm/prospecting">
                                <div className="flex justify-between w-full">
                                    <span className="font-semibold text-sm">{t.company?.businessName}</span>
                                    <span className="text-xs text-amber-600 flex items-center gap-1 font-bold">
                                        <CalendarClock className="h-3 w-3" /> {formatTime(t.nextFollowUpDate)}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {t.followUpType === 'CALL' ? '📞 Llamada a' : t.followUpType === 'EMAIL' ? '✉️ Correo a' : t.followUpType === 'MEETING' ? '🤝 Reunión con' : '📌 Tarea:'} {t.contact ? `${t.contact.firstName}` : 'General'}
                                </span>
                            </Link>
                        </DropdownMenuItem>
                    ))}

                    {pendingCount === 0 && (
                        <div className="p-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            <p className="text-sm">¡Estás al día!</p>
                            <p className="text-xs">No hay tareas pendientes por ahora.</p>
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
