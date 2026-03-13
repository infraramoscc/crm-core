"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Mail, Phone, User, MessageSquareText, PhoneCall, Calendar } from "lucide-react";
import { createCompany, updateCompany } from "@/app/actions/crm/company-actions";
import type { CompanyDetail, CompanyUpdateInput } from "@/lib/crm-list-types";
import type { CompanyType, ImportVolume, TradeRole, ValueDriver } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CompanyFormProps {
    initialData?: CompanyDetail;
}

export function CompanyForm({ initialData }: CompanyFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [documentType, setDocumentType] = useState(initialData?.documentType || "RUC");
    const [companyType, setCompanyType] = useState(initialData?.companyType || "CLIENT");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const companyData: CompanyUpdateInput = {
            businessName: formData.get('businessName') as string,
            tradeName: (formData.get('tradeName') as string) || undefined,
            documentType: documentType,
            documentNumber: formData.get('documentNumber') as string,
            companyType: companyType as CompanyType,
            tradeRole: formData.get('tradeRole') as TradeRole,
            annualDams: formData.get('annualDams') ? parseInt(formData.get('annualDams') as string, 10) : undefined,
            legalRepresentative: (formData.get('legalRepresentative') as string) || undefined,
            address: (formData.get('address') as string) || undefined,
            city: (formData.get('city') as string) || undefined,
            countryCode: (formData.get('countryCode') as string) || undefined,
            // CRM Data
            importVolume: ((formData.get('importVolume') as string) || undefined) as ImportVolume | undefined,
            valueDriver: ((formData.get('valueDriver') as string) || undefined) as ValueDriver | undefined,
            strategyTags: (formData.get('strategyTags') as string) || undefined,
        };

        let result;
        if (isEditing && initialData?.id) {
            result = await updateCompany(initialData.id, companyData);
        } else {
            result = await createCompany(companyData);
        }

        setLoading(false);

        if (result.success) {
            if (!isEditing) {
                // Si es creación, regresamos
                router.back();
            } else {
                // Si es edición, nos quedamos en el modal pero avisamos al usuario
                const triggerAlert = document.createElement("div");
                triggerAlert.style.position = "fixed";
                triggerAlert.style.bottom = "20px";
                triggerAlert.style.right = "20px";
                triggerAlert.style.backgroundColor = "#10b981"; // emerald-500
                triggerAlert.style.color = "white";
                triggerAlert.style.padding = "12px 24px";
                triggerAlert.style.borderRadius = "8px";
                triggerAlert.style.zIndex = "9999";
                triggerAlert.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                triggerAlert.style.transition = "opacity 0.3s ease-in-out";
                triggerAlert.innerText = "Empresa actualizada con éxito";
                document.body.appendChild(triggerAlert);
                
                setTimeout(() => {
                    triggerAlert.style.opacity = "0";
                    setTimeout(() => triggerAlert.remove(), 300);
                }, 3000);
            }
            router.refresh(); // Para refrescar la tabla de fondo
        } else {
            alert(`Error ${isEditing ? 'editando' : 'creando'} la empresa: ` + (result.error || "Desconocido"));
        }
    };

    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="flex flex-wrap h-auto w-full mb-6 justify-start gap-2">
                    <TabsTrigger value="general">Datos Generales</TabsTrigger>
                    <TabsTrigger value="crm" disabled={!isEditing}>Perfil Comercial (CRM)</TabsTrigger>
                    <TabsTrigger value="aduanas" disabled={!isEditing}>Métricas / Aduanas</TabsTrigger>
                    <TabsTrigger value="contacts" disabled={!isEditing}>Contactos asociados</TabsTrigger>
                    <TabsTrigger value="history" disabled={!isEditing}>Historial de Actividad</TabsTrigger>
                </TabsList>

                <TabsContent value="general" forceMount className="data-[state=inactive]:hidden min-h-[450px]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Generales</CardTitle>
                            <CardDescription>
                                Información comercial y fiscal de la entidad.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Razón Social *</Label>
                                    <Input
                                        id="businessName"
                                        name="businessName"
                                        defaultValue={initialData?.businessName}
                                        placeholder="Ej. Importaciones Globales S.A.C."
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tradeName">Nombre Comercial</Label>
                                    <Input
                                        id="tradeName"
                                        name="tradeName"
                                        defaultValue={initialData?.tradeName}
                                        placeholder="Ej. Global Imports"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="legalRepresentative">Representante Legal</Label>
                                    <Input
                                        id="legalRepresentative"
                                        name="legalRepresentative"
                                        defaultValue={initialData?.legalRepresentative}
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="documentType">Tipo de Documento *</Label>
                                    <Select value={documentType} onValueChange={setDocumentType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RUC">RUC</SelectItem>
                                            <SelectItem value="DNI">DNI</SelectItem>
                                            <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                                            <SelectItem value="OTHER">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="documentNumber">Número de Documento *</Label>
                                    <Input
                                        id="documentNumber"
                                        name="documentNumber"
                                        defaultValue={initialData?.documentNumber}
                                        placeholder="Ej. 20123456781"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyType">Tipo de Entidad *</Label>
                                    <Select value={companyType} onValueChange={setCompanyType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona el tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CLIENT">Cliente (Importador/Exportador)</SelectItem>
                                            <SelectItem value="AGENT">Agente de Carga</SelectItem>
                                            <SelectItem value="CUSTOMS">Agencia de Aduanas</SelectItem>
                                            <SelectItem value="TRANSPORTER">Transportista Terrestre</SelectItem>
                                            <SelectItem value="LINE">Línea Naviera/Aérea</SelectItem>
                                            <SelectItem value="WAREHOUSE">Almacén (Depósito)</SelectItem>
                                            <SelectItem value="OTHER">Otro Proveedor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tradeRole">Rol Comercial</Label>
                                    <Select name="tradeRole" defaultValue={initialData?.tradeRole || "NONE"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona el rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">Ninguno / No Aplica</SelectItem>
                                            <SelectItem value="IMPORTER">Importador</SelectItem>
                                            <SelectItem value="EXPORTER">Exportador</SelectItem>
                                            <SelectItem value="BOTH">Importador y Exportador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border-t pt-6 mt-6 !mt-6 space-y-6">
                                <h3 className="text-lg font-medium">Ubicación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">Dirección Legal</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            defaultValue={initialData?.address}
                                            placeholder="Ej. Av. Principal 123"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ciudad / Provincia</Label>
                                        <Input id="city" name="city" defaultValue={initialData?.city} placeholder="Ej. Lima" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="countryCode">País (Código ISO)</Label>
                                        <Input
                                            id="countryCode"
                                            name="countryCode"
                                            defaultValue={initialData?.countryCode || "PE"}
                                            placeholder="Ej. PE"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="crm" forceMount className="data-[state=inactive]:hidden min-h-[450px]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil Comercial</CardTitle>
                            <CardDescription>
                                Calificación del prospecto y registro de interacciones de venta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/20 p-4 rounded-lg border">
                                <div className="space-y-2">
                                    <Label htmlFor="importVolume">Volumen de Importaciones</Label>
                                    <Select name="importVolume" defaultValue={initialData?.importVolume || "NEW"}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEW">Nuevo / Sin Data</SelectItem>
                                            <SelectItem value="LOW">Bajo (3-15 al año)</SelectItem>
                                            <SelectItem value="MED">Medio (16-30 al año)</SelectItem>
                                            <SelectItem value="HIGH">Alto (&gt;30 al año)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="valueDriver">Disparador de Compra (Driver)</Label>
                                    <Select name="valueDriver" defaultValue={initialData?.valueDriver || "UNKNOWN"}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PRICE">Precio 💰</SelectItem>
                                            <SelectItem value="EXPERIENCE">Servicio/Experiencia ⭐</SelectItem>
                                            <SelectItem value="SPEED">Velocidad/Tiempos ⚡</SelectItem>
                                            <SelectItem value="UNKNOWN">Por Descubrir ❓</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="strategyTags">Etiquetas de Estrategia</Label>
                                    <Input
                                        id="strategyTags"
                                        name="strategyTags"
                                        defaultValue={initialData?.strategyTags}
                                        placeholder="Ej. Pelea mucho los libres"
                                        className="bg-background"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="aduanas" forceMount className="data-[state=inactive]:hidden min-h-[450px]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Métricas y Aduanas</CardTitle>
                            <CardDescription>
                                Volumen operativo de despachos u otros indicadores técnicos de comercio exterior.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="annualDams">DAMs Aproximadas (Último Año)</Label>
                                    <Input
                                        id="annualDams"
                                        name="annualDams"
                                        type="number"
                                        min="0"
                                        defaultValue={initialData?.annualDams || ""}
                                        placeholder="Ej. 120"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Anotación manual de cuántos despachos maneja este cliente anualmente aprox.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts" className="min-h-[450px]">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Contactos Asociados</CardTitle>
                                <CardDescription>
                                    Directorio de personas clave dentro de esta empresa.
                                </CardDescription>
                            </div>
                            <Button asChild type="button" variant="outline">
                                <Link href={`/contacts/new?companyId=${initialData?.id}`}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Agregar Contacto
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {(!initialData?.contacts || initialData.contacts.length === 0) ? (
                                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    No hay contactos asociados a esta empresa todavía.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {initialData.contacts.map((contact) => (
                                        <div key={contact.id} className="border rounded-lg p-4 space-y-3 bg-card hover:border-blue-300 transition-colors">
                                            <div className="font-semibold text-lg flex items-center justify-between">
                                                <span>{contact.firstName} {contact.lastName}</span>
                                                <Button variant="ghost" size="icon" asChild type="button">
                                                    <Link href={`/contacts/${contact.id}`}>
                                                        <User className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                            {contact.position && <div className="text-sm text-muted-foreground">{contact.position}</div>}

                                            <div className="space-y-1 text-sm">
                                                {contact.emails && contact.emails.length > 0 && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Mail className="h-4 w-4" />
                                                        <span className="truncate">{contact.emails[0]}</span>
                                                    </div>
                                                )}
                                                {contact.phones && contact.phones.length > 0 && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Phone className="h-4 w-4" />
                                                        <span>{contact.phones[0]}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="min-h-[450px]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Actividad</CardTitle>
                            <CardDescription>
                                Registro cronológico de todas las interacciones, llamadas, correos y reuniones con este cliente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(!initialData?.interactions || initialData.interactions.length === 0) ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                    <MessageSquareText className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                                    <h3 className="text-lg font-medium">Sin interacciones registradas</h3>
                                    <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                        No hay un historial de llamadas, correos o reuniones asociadas a esta empresa todavía. Registra la primera interacción desde el Pipeline o Prospección.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative border-l-2 border-primary/20 ml-3 space-y-6">
                                        {initialData.interactions.map((interaction, idx: number) => {
                                            const renderIcon = (type: string, className: string) => {
                                                switch (type) {
                                                    case 'CALL_MADE': return <PhoneCall className={className} />;
                                                    case 'EMAIL_SENT': return <Mail className={className} />;
                                                    case 'EMAIL_OPENED': return <Mail className={className} />;
                                                    case 'MEETING': return <User className={className} />;
                                                    default: return <MessageSquareText className={className} />;
                                                }
                                            };

                                            const getLabel = (type: string) => {
                                                switch (type) {
                                                    case 'CALL_MADE': return 'Llamada';
                                                    case 'EMAIL_SENT': return 'Correo Enviado';
                                                    case 'EMAIL_OPENED': return 'Correo Abierto';
                                                    case 'MEETING': return 'Reunión / Visita';
                                                    default: return type;
                                                }
                                            };

                                            return (
                                                <div key={interaction.id} className="relative pl-6 group">
                                                    {/* Timeline Node */}
                                                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                                        ${idx === 0 ? 'bg-primary border-primary text-white scale-110 shadow-sm' : 'bg-background border-muted-foreground/40 text-muted-foreground group-hover:border-primary/50'}`}>
                                                        {renderIcon(interaction.type, "h-2.5 w-2.5")}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                                                        <div className="space-y-2 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-semibold text-sm">{getLabel(interaction.type)}</span>
                                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                                    {new Date(interaction.interactedAt).toLocaleDateString('es-PE', {
                                                                        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                                {interaction.scoreImpact > 0 && (
                                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                        +{interaction.scoreImpact} termómetro
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {interaction.notes ? (
                                                                <p className="text-sm bg-muted/40 p-3 rounded-md text-foreground leading-relaxed whitespace-pre-wrap">
                                                                    {interaction.notes}
                                                                </p>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground italic">Sin notas detalladas.</p>
                                                            )}

                                                            <div className="flex flex-wrap gap-2 text-xs mt-3 border-t pt-3">
                                                                {interaction.contact && (
                                                                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                                                                        <User className="h-3 w-3" />
                                                                        <span>Con {interaction.contact.firstName} {interaction.contact.lastName}</span>
                                                                    </div>
                                                                )}

                                                                {interaction.nextFollowUpDate && (
                                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${interaction.isFollowUpCompleted
                                                                        ? 'text-muted-foreground bg-muted/30 line-through'
                                                                        : 'text-amber-700 bg-amber-50 font-medium'
                                                                        }`}>
                                                                        <Calendar className="h-3 w-3" />
                                                                        <span>
                                                                            Seguimiento: {new Date(interaction.nextFollowUpDate).toLocaleDateString('es-PE')}
                                                                            {interaction.isFollowUpCompleted && ' (Completado)'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Controles del Formulario unificados - siempre visibles al final */}
            <div className="flex items-center justify-end border-t pt-6 mt-6 pb-12 gap-4">
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => router.back()}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading} size="lg">
                    {loading ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Crear Empresa")}
                </Button>
            </div>
        </form>
    );
}
