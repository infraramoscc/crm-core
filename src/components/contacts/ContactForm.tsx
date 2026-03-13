"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContact, updateContact } from "@/app/actions/crm/contact-actions";
import { useState } from "react";
import type { CompanyOption, ContactDetail } from "@/lib/crm-list-types";
import type { ContactBuyingRole, ContactCommercialStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContactFormProps {
    initialData?: ContactDetail;
    companies?: CompanyOption[];
}

export function ContactForm({ initialData, companies = [] }: ContactFormProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [commercialStatus, setCommercialStatus] = useState<ContactCommercialStatus>(initialData?.commercialStatus ?? "UNVALIDATED");
    const [buyingRole, setBuyingRole] = useState<ContactBuyingRole>(initialData?.buyingRole ?? "UNKNOWN");

    // Estado de actividad del contacto
    const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);

    // Pre-seleccionar compañía si venimos de url ?companyId=...
    const urlCompanyId = searchParams.get("companyId");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const emailInput = formData.get("email") as string || "";
        const phoneInput = formData.get("phone") as string || "";

        const parsedEmails = emailInput.split(',').map(s => s.trim()).filter(Boolean);
        const parsedPhones = phoneInput.split(',').map(s => s.trim()).filter(Boolean);

        if (!isEditing) {
            const res = await createContact({
                companyId: formData.get("companyId") as string,
                firstName: formData.get("firstName") as string,
                lastName: formData.get("lastName") as string,
                position: formData.get("position") as string,
                linkedin: formData.get("linkedin") as string,
                birthday: (formData.get("birthday") as string) || undefined,
                anniversary: (formData.get("anniversary") as string) || undefined,
                interests: (formData.get("interests") as string) || undefined,
                notes: (formData.get("notes") as string) || undefined,
                emails: parsedEmails,
                phones: parsedPhones,
                isActive,
                inactiveReason: !isActive ? (formData.get("inactiveReason") as string) : undefined,
                commercialStatus,
                buyingRole,
            });

            if (res.success) {
                router.back(); // Vuelve a Investigación o donde estaba
            } else {
                alert("Error creando contacto");
                setLoading(false);
            }
        } else {
            if (initialData?.id) {
                const res = await updateContact(initialData.id, {
                    companyId: formData.get("companyId") as string,
                    firstName: formData.get("firstName") as string,
                    lastName: formData.get("lastName") as string,
                    position: formData.get("position") as string,
                    linkedin: formData.get("linkedin") as string,
                    birthday: (formData.get("birthday") as string) || undefined,
                    anniversary: (formData.get("anniversary") as string) || undefined,
                    interests: (formData.get("interests") as string) || undefined,
                    notes: (formData.get("notes") as string) || undefined,
                    emails: parsedEmails,
                    phones: parsedPhones,
                    isActive,
                    inactiveReason: !isActive ? (formData.get("inactiveReason") as string) : undefined,
                    commercialStatus,
                    buyingRole,
                });

                if (res.success) {
                    router.back();
                    router.refresh();
                } else {
                    alert("Error editando contacto");
                    setLoading(false);
                }
            }
        }
    };

    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Perfil del Contacto</CardTitle>
                    <CardDescription>
                        Información ejecutiva y de fidelización para seguimiento comercial.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="general">Datos Generales</TabsTrigger>
                            <TabsTrigger value="crm">CRM & Post-venta</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-6 min-h-[450px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Estado comercial</Label>
                                    <Select value={commercialStatus} onValueChange={(value) => setCommercialStatus(value as ContactCommercialStatus)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UNVALIDATED">Sin validar</SelectItem>
                                            <SelectItem value="VALIDATED_NO_RESPONSE">Validado sin respuesta</SelectItem>
                                            <SelectItem value="VALIDATED_RESPONDS">Validado y responde</SelectItem>
                                            <SelectItem value="INTERESTED">Interesado</SelectItem>
                                            <SelectItem value="NOT_DECISION_MAKER">No decide</SelectItem>
                                            <SelectItem value="DECISION_MAKER">Decisor</SelectItem>
                                            <SelectItem value="REPLACE">Reemplazar</SelectItem>
                                            <SelectItem value="DISCARDED">Descartado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Rol en la compra</Label>
                                    <Select value={buyingRole} onValueChange={(value) => setBuyingRole(value as ContactBuyingRole)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UNKNOWN">Sin definir</SelectItem>
                                            <SelectItem value="OPERATIONS">Operaciones</SelectItem>
                                            <SelectItem value="USER">Usuario</SelectItem>
                                            <SelectItem value="INFLUENCER">Influenciador</SelectItem>
                                            <SelectItem value="DECISION_MAKER">Decisor</SelectItem>
                                            <SelectItem value="BLOCKER">Bloqueador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Nombres *</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        defaultValue={initialData?.firstName}
                                        placeholder="Ej. Carlos"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Apellidos</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        defaultValue={initialData?.lastName ?? ""}
                                        placeholder="Ej. Ramírez"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="companyId">Empresa / Entidad *</Label>
                                    <Select name="companyId" defaultValue={initialData?.companyId || urlCompanyId || ""}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona la empresa a la que pertenece" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies.map((company) => (
                                                <SelectItem key={company.id} value={company.id}>
                                                    {company.businessName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position">Cargo</Label>
                                    <Input
                                        id="position"
                                        name="position"
                                        defaultValue={initialData?.position ?? ""}
                                        placeholder="Ej. Gerente de Importaciones"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">Perfil de LinkedIn</Label>
                                    <Input
                                        id="linkedin"
                                        name="linkedin"
                                        defaultValue={initialData?.linkedin ?? ""}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correos Electrónicos (Separados por Coma) *</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="text"
                                        defaultValue={initialData?.emails?.join(', ')}
                                        placeholder="maria@x.com, expo@x.com"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfonos / Celulares (Separado por Coma)</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={initialData?.phones?.join(', ')}
                                        placeholder="+51 987 654 321, 01 444 3333"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-6 mt-6 md:col-span-2 space-y-4">
                                <h3 className="text-lg font-medium">Estado del Contacto</h3>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="isActive"
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                    />
                                    <Label htmlFor="isActive" className={`${!isActive ? 'text-muted-foreground' : 'font-semibold'}`}>
                                        {isActive ? 'Contacto Activo' : 'Contacto Inactivo / Descartado'}
                                    </Label>
                                </div>

                                {!isActive && (
                                    <div className="space-y-2 mt-4 max-w-xl animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="inactiveReason">Motivo de Inactividad *</Label>
                                        <Input
                                            id="inactiveReason"
                                            name="inactiveReason"
                                            defaultValue={initialData?.inactiveReason ?? ""}
                                            placeholder="Ej. Rebotan correos, no labora aquí, ya no importa..."
                                            required={!isActive}
                                        />
                                        <p className="text-sm text-muted-foreground">Este prospecto/empresa volverá a la bandeja de investigación para encontrar un reemplazo.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="crm" className="space-y-6 min-h-[450px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="birthday">Fecha de Cumpleaños</Label>
                                    <Input
                                        id="birthday"
                                        name="birthday"
                                        type="date"
                                        defaultValue={initialData?.birthday ? new Date(initialData.birthday).toISOString().split("T")[0] : ""}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="anniversary">Aniversario (Ej. Empresa o Trabajo)</Label>
                                    <Input
                                        id="anniversary"
                                        name="anniversary"
                                        type="date"
                                        defaultValue={initialData?.anniversary ? new Date(initialData.anniversary).toISOString().split("T")[0] : ""}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="interests">Intereses y Gustos Personales</Label>
                                    <Textarea
                                        id="interests"
                                        name="interests"
                                        defaultValue={initialData?.interests ?? ""}
                                        placeholder="Deportes, Hobbies, Vinos preferidos..."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notas Internas para CRM</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        defaultValue={initialData?.notes ?? ""}
                                        placeholder="Preferencias de negociación, horarios de contacto, objeciones previas..."
                                        className="min-h-[120px]"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex items-center justify-end border-t mt-8 pt-6 gap-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.back()}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Crear Contacto")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
