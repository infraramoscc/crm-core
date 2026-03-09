"use client";

import { useState } from "react";
import { type Interaction, InteractionType, mockContacts } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Mail, MailOpen, Phone, Users, Plus, Calendar } from "lucide-react";

interface InteractionLoggerProps {
    companyId: string;
    interactions: Interaction[];
}

export function InteractionLogger({ companyId, interactions: initialInteractions }: InteractionLoggerProps) {
    const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions);
    const [isAdding, setIsAdding] = useState(false);

    // Estados del nuevo registro
    const [type, setType] = useState<InteractionType>("MEETING");
    const [notes, setNotes] = useState("");
    const [contactId, setContactId] = useState("");
    const [interactedAt, setInteractedAt] = useState(new Date().toISOString().split('T')[0]);
    const [nextFollowUpDate, setNextFollowUpDate] = useState("");

    const companyContacts = mockContacts.filter(c => c.companyId === companyId);

    const getTypeIcon = (t: InteractionType) => {
        switch (t) {
            case "EMAIL_SENT": return <Mail className="h-4 w-4 text-blue-500" />;
            case "EMAIL_OPENED": return <MailOpen className="h-4 w-4 text-emerald-500" />;
            case "CALL_MADE": return <Phone className="h-4 w-4 text-amber-500" />;
            case "MEETING": return <Users className="h-4 w-4 text-purple-500" />;
        }
    };

    const getTypeLabel = (t: InteractionType) => {
        switch (t) {
            case "EMAIL_SENT": return "Correo Enviado";
            case "EMAIL_OPENED": return "Correo Abierto";
            case "CALL_MADE": return "Llamada Realizada";
            case "MEETING": return "Reunión Comercial";
        }
    };

    const getScoreImpact = (t: InteractionType) => {
        switch (t) {
            case "EMAIL_SENT": return 1;
            case "EMAIL_OPENED": return 5;
            case "CALL_MADE": return 10;
            case "MEETING": return 25;
            default: return 0;
        }
    };

    const handleAddInteraction = () => {
        if (!notes) return;

        const newInteraction: Interaction = {
            id: Math.random().toString(),
            companyId,
            contactId: contactId || undefined,
            type,
            notes,
            scoreImpact: getScoreImpact(type),
            interactedAt: interactedAt,
            nextFollowUpDate: nextFollowUpDate || undefined,
            isFollowUpCompleted: false,
        };

        // Agregamos al principio de la lista visualmente
        setInteractions([newInteraction, ...interactions]);
        setIsAdding(false);
        setNotes("");
        setNextFollowUpDate("");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">✨ Diario del Cazador (Interacciones)</h3>
                    <p className="text-sm text-muted-foreground">
                        Registra cada punto de contacto para enriquecer el Perfil y aumentar el Score.
                    </p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Agregar Nota
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-primary bg-primary/5">
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de Acción</Label>
                                <Select value={type} onValueChange={(val: InteractionType) => setType(val)}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMAIL_SENT">Correo Enviado (+1)</SelectItem>
                                        <SelectItem value="EMAIL_OPENED">Correo Abierto (+5)</SelectItem>
                                        <SelectItem value="CALL_MADE">Llamada Realizada (+10)</SelectItem>
                                        <SelectItem value="MEETING">Reunión Comercial (+25)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Contacto Implicado</Label>
                                <Select value={contactId} onValueChange={setContactId}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Opcional..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nadie en específico</SelectItem>
                                        {companyContacts.map(c => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.firstName} {c.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Fecha</Label>
                                <Input
                                    type="date"
                                    value={interactedAt}
                                    onChange={(e) => setInteractedAt(e.target.value)}
                                    className="bg-background"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notas y Descubrimientos del Cazador</Label>
                            <Textarea
                                placeholder="Ej. Descubrimos que traen FCL de Asia pero su agente actual les falla en aduanas..."
                                className="min-h-[100px] bg-background"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg border border-dashed flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1">
                                <h4 className="font-medium text-sm">¿Agendar Próximo Seguimiento?</h4>
                                <p className="text-xs text-muted-foreground">Esta empresa saldrá en tu &quot;Bandeja de Cacería&quot; ese día.</p>
                            </div>
                            <Input
                                type="date"
                                value={nextFollowUpDate}
                                onChange={(e) => setNextFollowUpDate(e.target.value)}
                                className="bg-background max-w-[200px]"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                            <Button onClick={handleAddInteraction}>Guardar en el Diario</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Historial Timeline */}
            <div className="relative border-l-2 border-muted ml-4 pl-6 space-y-6 before:absolute before:inset-y-0 before:-left-[1px]">
                {interactions.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic py-4">
                        Aún no hay interacciones con este prospecto. ¡Haz la primera llamada!
                    </p>
                ) : (
                    interactions.map((interaction) => {
                        const contact = mockContacts.find(c => c.id === interaction.contactId);

                        return (
                            <div key={interaction.id} className="relative">
                                {/* Timeline dot */}
                                <div className="absolute -left-[35px] bg-background border-2 border-muted rounded-full p-1.5 shadow-sm">
                                    {getTypeIcon(interaction.type)}
                                </div>

                                <Card className="shadow-none">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-semibold text-sm">
                                                    {getTypeLabel(interaction.type)}
                                                </span>
                                                {contact && (
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                        con {contact.firstName} {contact.lastName}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    +{interaction.scoreImpact} pts
                                                </span>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(interaction.interactedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                            {interaction.notes}
                                        </p>

                                        {interaction.nextFollowUpDate && (
                                            <div className="mt-4 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs font-medium">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>Tarea Programada para:</span>
                                                <span className="underline">
                                                    {new Date(interaction.nextFollowUpDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
