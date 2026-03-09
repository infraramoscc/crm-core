"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Mail, Phone, User } from "lucide-react";
import { createCompany, updateCompany } from "@/app/actions/crm/company-actions";
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
    initialData?: any;
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

        const companyData = {
            businessName: formData.get('businessName') as string,
            tradeName: (formData.get('tradeName') as string) || undefined,
            documentType: documentType,
            documentNumber: formData.get('documentNumber') as string,
            companyType: companyType as any,
            annualDams: formData.get('annualDams') ? parseInt(formData.get('annualDams') as string, 10) : undefined,
            legalRepresentative: (formData.get('legalRepresentative') as string) || undefined,
            // CRM Data
            importVolume: formData.get('importVolume') || undefined,
            valueDriver: formData.get('valueDriver') || undefined,
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
            router.back();
            router.refresh(); // Para refrescar la tabla que quedó atrás
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
                </TabsList>

                <TabsContent value="general">
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
                            </div>

                            <div className="border-t pt-6 mt-6 !mt-6 space-y-6">
                                <h3 className="text-lg font-medium">Ubicación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">Dirección Legal</Label>
                                        <Input
                                            id="address"
                                            defaultValue={initialData?.address}
                                            placeholder="Ej. Av. Principal 123"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ciudad / Provincia</Label>
                                        <Input id="city" defaultValue={initialData?.city} placeholder="Ej. Lima" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="countryCode">País (Código ISO)</Label>
                                        <Input
                                            id="countryCode"
                                            defaultValue={initialData?.countryCode || "PE"}
                                            placeholder="Ej. PE"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="crm">
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

                <TabsContent value="aduanas">
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

                <TabsContent value="contacts">
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
                                    {initialData.contacts.map((contact: any) => (
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
