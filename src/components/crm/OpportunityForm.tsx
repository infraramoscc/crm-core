"use client";

import { useRouter } from "next/navigation";
import { type Opportunity, mockCompanies, mockContacts } from "@/lib/mock-data";
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

interface OpportunityFormProps {
    initialData?: Opportunity;
}

export function OpportunityForm({ initialData }: OpportunityFormProps) {
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/crm"); // Regresar al Kanban
    };

    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Oportunidad</CardTitle>
                    <CardDescription>
                        Información sobre el negocio a cotizar y su valor estimado.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="title">Título del Negocio *</Label>
                            <Input
                                id="title"
                                defaultValue={initialData?.title}
                                placeholder="Ej. Impo 10 FCL desde Shenzhen a Callao"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyId">Prospecto / Cliente *</Label>
                            <Select defaultValue={initialData?.companyId || ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona la empresa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockCompanies.map((company) => (
                                        <SelectItem key={company.id} value={company.id}>
                                            {company.businessName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactId">Contacto Clave</Label>
                            <Select defaultValue={initialData?.contactId || ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Quien toma la decisión" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockContacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            {contact.firstName} {contact.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expectedValue">Valor Estimado del Flete</Label>
                            <div className="flex gap-2">
                                <Select defaultValue={initialData?.expectedCurrency || "USD"}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="MND" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="PEN">PEN</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="expectedValue"
                                    type="number"
                                    step="0.01"
                                    defaultValue={initialData?.expectedValue}
                                    placeholder="Ej. 15000"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="closeDate">Fecha Estimada de Cierre</Label>
                            <Input
                                id="closeDate"
                                type="date"
                                defaultValue={initialData?.closeDate?.split('T')[0]} // formato YYYY-MM-DD
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="stage">Etapa del Embudo *</Label>
                            <Select defaultValue={initialData?.stage || "PROSPECTING"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Estado actual..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PROSPECTING">Prospección</SelectItem>
                                    <SelectItem value="QUOTING">Cotizando</SelectItem>
                                    <SelectItem value="NEGOTIATING">En Negociación</SelectItem>
                                    <SelectItem value="WON">Ganada (Despacho Confirmado)</SelectItem>
                                    <SelectItem value="LOST">Perdida</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end border-t pt-6 gap-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.push("/crm")}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {isEditing ? "Guardar Oportunidad" : "Crear Oportunidad"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
