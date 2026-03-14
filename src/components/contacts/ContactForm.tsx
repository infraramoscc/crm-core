"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createContact, updateContact } from "@/app/actions/crm/contact-actions";
import type { CompanyOption, ContactDetail } from "@/lib/crm-list-types";
import type {
    ContactBuyingRole,
    ContactCommercialStatus,
    DecisionStyle,
    PreferredContactChannel,
    PreferredContactWindow,
    RelationshipStrength,
    ResearchSourceChannel,
    ValueDriver,
} from "@prisma/client";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContactFormProps {
    initialData?: ContactDetail;
    companies?: CompanyOption[];
}

function toDateInput(value: Date | string | null | undefined) {
    if (!value) return "";
    return new Date(value).toISOString().split("T")[0];
}

export function ContactForm({ initialData, companies = [] }: ContactFormProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [commercialStatus, setCommercialStatus] = useState<ContactCommercialStatus>(initialData?.commercialStatus ?? "UNVALIDATED");
    const [buyingRole, setBuyingRole] = useState<ContactBuyingRole>(initialData?.buyingRole ?? "UNKNOWN");
    const [sourceChannel, setSourceChannel] = useState<ResearchSourceChannel | "">(initialData?.sourceChannel ?? "");
    const [relationshipStrength, setRelationshipStrength] = useState<RelationshipStrength>(initialData?.profile?.relationshipStrength ?? "COLD");
    const [preferredContactChannel, setPreferredContactChannel] = useState<PreferredContactChannel | "">(initialData?.profile?.preferredContactChannel ?? "");
    const [preferredContactWindow, setPreferredContactWindow] = useState<PreferredContactWindow | "">(initialData?.profile?.preferredContactWindow ?? "");
    const [decisionStyle, setDecisionStyle] = useState<DecisionStyle | "">(initialData?.profile?.decisionStyle ?? "");
    const [primaryDriver, setPrimaryDriver] = useState<ValueDriver>(initialData?.profile?.primaryDriver ?? "UNKNOWN");
    const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);
    const urlCompanyId = searchParams.get("companyId");
    const isEditing = Boolean(initialData);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const emailInput = ((formData.get("email") as string) || "").trim();
        const phoneInput = ((formData.get("phone") as string) || "").trim();
        const linkedinInput = ((formData.get("linkedin") as string) || "").trim();
        const positionInput = ((formData.get("position") as string) || "").trim();

        const parsedEmails = emailInput.split(",").map((item) => item.trim()).filter(Boolean);
        const parsedPhones = phoneInput.split(",").map((item) => item.trim()).filter(Boolean);

        if (parsedEmails.length === 0 && parsedPhones.length === 0 && !linkedinInput) {
            alert("Debes registrar al menos un canal accionable: correo, telefono o LinkedIn.");
            setLoading(false);
            return;
        }

        const payload = {
            companyId: formData.get("companyId") as string,
            firstName: formData.get("firstName") as string,
            lastName: (formData.get("lastName") as string) || undefined,
            position: positionInput || undefined,
            linkedin: linkedinInput || undefined,
            birthday: (formData.get("birthday") as string) || undefined,
            anniversary: (formData.get("anniversary") as string) || undefined,
            interests: (formData.get("interests") as string) || undefined,
            notes: (formData.get("notes") as string) || undefined,
            emails: parsedEmails,
            phones: parsedPhones,
            isActive,
            inactiveReason: !isActive ? (formData.get("inactiveReason") as string) || undefined : undefined,
            commercialStatus,
            buyingRole,
            sourceChannel: sourceChannel || undefined,
            relationshipStrength,
            preferredContactChannel: preferredContactChannel || undefined,
            preferredContactWindow: preferredContactWindow || undefined,
            decisionStyle: decisionStyle || undefined,
            primaryDriver,
            typicalObjection: (formData.get("typicalObjection") as string) || undefined,
            giftPreferences: (formData.get("giftPreferences") as string) || undefined,
            doNotGift: (formData.get("doNotGift") as string) || undefined,
            visitNotes: (formData.get("visitNotes") as string) || undefined,
            lastMeaningfulInteractionAt: (formData.get("lastMeaningfulInteractionAt") as string) || undefined,
            nextPersonalTouchAt: (formData.get("nextPersonalTouchAt") as string) || undefined,
        };

        const result = isEditing && initialData?.id
            ? await updateContact(initialData.id, payload)
            : await createContact(payload);

        setLoading(false);

        if (!result.success) {
            alert(isEditing ? "Error editando contacto" : "Error creando contacto");
            return;
        }

        router.back();
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Perfil del Contacto</CardTitle>
                    <CardDescription>
                        La ficha del contacto debe servir tanto para caceria como para mantener la relacion a lo largo del tiempo, incluso si cambia de empresa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-6 grid w-full grid-cols-3">
                            <TabsTrigger value="general">Datos Generales</TabsTrigger>
                            <TabsTrigger value="relationship">Relacion</TabsTrigger>
                            <TabsTrigger value="postsale">Post-venta</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-6 min-h-[450px]">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Estado comercial</Label>
                                    <Select value={commercialStatus} onValueChange={(value) => setCommercialStatus(value as ContactCommercialStatus)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                                    <Input id="firstName" name="firstName" defaultValue={initialData?.firstName} placeholder="Ej. Carlos" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Apellidos</Label>
                                    <Input id="lastName" name="lastName" defaultValue={initialData?.lastName ?? ""} placeholder="Ej. Ramirez" />
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
                                    <Input id="position" name="position" defaultValue={initialData?.position ?? ""} placeholder="Ej. Gerente de Importaciones" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Fuente del dato</Label>
                                    <Select value={sourceChannel} onValueChange={(value) => setSourceChannel(value as ResearchSourceChannel)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Como encontraste este contacto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GOOGLE">Google</SelectItem>
                                            <SelectItem value="WEBSITE">Website</SelectItem>
                                            <SelectItem value="WEB">Web</SelectItem>
                                            <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                                            <SelectItem value="FACEBOOK">Facebook</SelectItem>
                                            <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                                            <SelectItem value="CENTRAL_CALL">Llamada a central</SelectItem>
                                            <SelectItem value="VISIT">Visita</SelectItem>
                                            <SelectItem value="INTERNAL_REFERRAL">Referencia interna</SelectItem>
                                            <SelectItem value="DIRECTORY">Directorio</SelectItem>
                                            <SelectItem value="OTHER">Otra</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="linkedin">Perfil de LinkedIn</Label>
                                    <Input id="linkedin" name="linkedin" defaultValue={initialData?.linkedin ?? initialData?.profile?.linkedin ?? ""} placeholder="https://linkedin.com/in/..." />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Correos Electronicos (Separados por coma)</Label>
                                    <Input id="email" name="email" type="text" defaultValue={initialData?.emails?.join(", ")} placeholder="maria@x.com, expo@x.com" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefonos / Celulares (Separado por coma)</Label>
                                    <Input id="phone" name="phone" defaultValue={initialData?.phones?.join(", ")} placeholder="+51 987 654 321, 01 444 3333" />
                                </div>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                                En investigacion puedes cargar todos los contactos disponibles. La validacion comercial y el enriquecimiento del perfil se profundizan luego en caceria.
                            </div>

                            <div className="mt-6 space-y-4 border-t pt-6">
                                <h3 className="text-lg font-medium">Estado del Contacto</h3>
                                <div className="flex items-center space-x-2">
                                    <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                                    <Label htmlFor="isActive" className={isActive ? "font-semibold" : "text-muted-foreground"}>
                                        {isActive ? "Contacto Activo" : "Contacto Inactivo / Descartado"}
                                    </Label>
                                </div>

                                {!isActive && (
                                    <div className="mt-4 max-w-xl space-y-2">
                                        <Label htmlFor="inactiveReason">Motivo de Inactividad *</Label>
                                        <Input
                                            id="inactiveReason"
                                            name="inactiveReason"
                                            defaultValue={initialData?.inactiveReason ?? ""}
                                            placeholder="Ej. Rebotan correos, ya no labora aqui o no corresponde al proceso."
                                            required={!isActive}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Si esta persona sale, la cuenta puede volver a investigacion para encontrar reemplazo.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="relationship" className="space-y-6 min-h-[450px]">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="birthday">Fecha de cumpleanos</Label>
                                    <Input id="birthday" name="birthday" type="date" defaultValue={toDateInput(initialData?.profile?.birthday ?? initialData?.birthday)} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="anniversary">Aniversario</Label>
                                    <Input id="anniversary" name="anniversary" type="date" defaultValue={toDateInput(initialData?.profile?.anniversary ?? initialData?.anniversary)} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Fuerza de relacion</Label>
                                    <Select value={relationshipStrength} onValueChange={(value) => setRelationshipStrength(value as RelationshipStrength)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="COLD">Fria</SelectItem>
                                            <SelectItem value="WARM">Cercana</SelectItem>
                                            <SelectItem value="TRUSTED">Confia en nosotros</SelectItem>
                                            <SelectItem value="ADVOCATE">Promotor interno</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Canal preferido</Label>
                                    <Select value={preferredContactChannel} onValueChange={(value) => setPreferredContactChannel(value as PreferredContactChannel)}>
                                        <SelectTrigger><SelectValue placeholder="Como suele responder mejor" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EMAIL">Email</SelectItem>
                                            <SelectItem value="PHONE">Telefono</SelectItem>
                                            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                            <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                                            <SelectItem value="IN_PERSON">En persona</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Horario recomendado</Label>
                                    <Select value={preferredContactWindow} onValueChange={(value) => setPreferredContactWindow(value as PreferredContactWindow)}>
                                        <SelectTrigger><SelectValue placeholder="Cuando conviene abordarlo" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EARLY_MORNING">Muy temprano</SelectItem>
                                            <SelectItem value="MORNING">Manana</SelectItem>
                                            <SelectItem value="AFTERNOON">Tarde</SelectItem>
                                            <SelectItem value="EVENING">Noche</SelectItem>
                                            <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Estilo de decision</Label>
                                    <Select value={decisionStyle} onValueChange={(value) => setDecisionStyle(value as DecisionStyle)}>
                                        <SelectTrigger><SelectValue placeholder="Como procesa una propuesta" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ANALYTICAL">Analitico</SelectItem>
                                            <SelectItem value="DIRECT">Directo</SelectItem>
                                            <SelectItem value="RELATIONAL">Relacional</SelectItem>
                                            <SelectItem value="CAUTIOUS">Cauteloso</SelectItem>
                                            <SelectItem value="POLITICAL">Politico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Driver principal</Label>
                                    <Select value={primaryDriver} onValueChange={(value) => setPrimaryDriver(value as ValueDriver)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PRICE">Precio</SelectItem>
                                            <SelectItem value="EXPERIENCE">Servicio/Experiencia</SelectItem>
                                            <SelectItem value="SPEED">Velocidad/Tiempos</SelectItem>
                                            <SelectItem value="UNKNOWN">Por descubrir</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastMeaningfulInteractionAt">Ultima interaccion util</Label>
                                    <Input id="lastMeaningfulInteractionAt" name="lastMeaningfulInteractionAt" type="date" defaultValue={toDateInput(initialData?.profile?.lastMeaningfulInteractionAt)} />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="interests">Intereses y gustos personales</Label>
                                    <Textarea
                                        id="interests"
                                        name="interests"
                                        defaultValue={initialData?.profile?.interests ?? initialData?.interests ?? ""}
                                        placeholder="Deportes, hobbies, bebidas preferidas, temas que ayudan a romper el hielo."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="typicalObjection">Objecion tipica</Label>
                                    <Textarea
                                        id="typicalObjection"
                                        name="typicalObjection"
                                        defaultValue={initialData?.profile?.typicalObjection ?? ""}
                                        placeholder="Ej. Compara mucho precio, pide pruebas antes de mover volumen o necesita validar internamente."
                                        className="min-h-[90px]"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notas internas de relacion</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        defaultValue={initialData?.profile?.notes ?? initialData?.notes ?? ""}
                                        placeholder="Como conviene hablarle, que tono usar, que valora y que conviene evitar."
                                        className="min-h-[120px]"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="postsale" className="space-y-6 min-h-[450px]">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="nextPersonalTouchAt">Proximo toque relacional</Label>
                                    <Input id="nextPersonalTouchAt" name="nextPersonalTouchAt" type="date" defaultValue={toDateInput(initialData?.profile?.nextPersonalTouchAt)} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="giftPreferences">Regalos o detalles que si suman</Label>
                                    <Textarea
                                        id="giftPreferences"
                                        name="giftPreferences"
                                        defaultValue={initialData?.profile?.giftPreferences ?? ""}
                                        placeholder="Ej. Cafe, vino tinto, libros, detalles sobrios."
                                        className="min-h-[90px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="doNotGift">Que evitar</Label>
                                    <Textarea
                                        id="doNotGift"
                                        name="doNotGift"
                                        defaultValue={initialData?.profile?.doNotGift ?? ""}
                                        placeholder="Ej. No alcohol, no regalos llamativos, evitar visitas sin aviso."
                                        className="min-h-[90px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="visitNotes">Notas para visitas y mantenimiento</Label>
                                    <Textarea
                                        id="visitNotes"
                                        name="visitNotes"
                                        defaultValue={initialData?.profile?.visitNotes ?? ""}
                                        placeholder="Ej. Recibe mejor con agenda clara, prefiere reuniones breves y valora puntualidad."
                                        className="min-h-[120px]"
                                    />
                                </div>
                            </div>

                            {initialData?.profile?.contacts && initialData.profile.contacts.length > 1 && (
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trayectoria en el CRM</h3>
                                    <div className="mt-3 space-y-2 text-sm">
                                        {initialData.profile.contacts.map((profileContact) => (
                                            <div key={profileContact.id} className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                                                <div>
                                                    <p className="font-medium">{profileContact.company?.businessName || "Empresa sin nombre"}</p>
                                                    <p className="text-xs text-muted-foreground">{profileContact.position || "Sin cargo registrado"}</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{profileContact.isActive ? "Activo" : "Historico"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="mt-8 flex items-center justify-end gap-4 border-t pt-6">
                        <Button variant="outline" type="button" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Contacto"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
