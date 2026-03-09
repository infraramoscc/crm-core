"use client";

import { useRouter } from "next/navigation";
import { type Service } from "@/lib/mock-data";
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

interface ServiceFormProps {
    initialData?: Service;
}

export function ServiceForm({ initialData }: ServiceFormProps) {
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/services");
    };

    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Servicio</CardTitle>
                    <CardDescription>
                        Configuración general del tarifario interno para cotizaciones.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="code">Código Interno *</Label>
                            <Input
                                id="code"
                                defaultValue={initialData?.code}
                                placeholder="Ej. SRV-010"
                                className="font-mono uppercase"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría *</Label>
                            <Select defaultValue={initialData?.category || "LOGISTICS"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el rumbro" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOGISTICS">Logística (Fletes, BL)</SelectItem>
                                    <SelectItem value="CUSTOMS">Aduanas (Agenciamiento)</SelectItem>
                                    <SelectItem value="TRANSPORT">Transporte Terrestre</SelectItem>
                                    <SelectItem value="WAREHOUSE">Almacenaje (Depósito)</SelectItem>
                                    <SelectItem value="OTHER">Otros Conceptos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name">Descripción del Servicio *</Label>
                            <Input
                                id="name"
                                defaultValue={initialData?.name}
                                placeholder="Ej. Flete Marítimo FCL 40'"
                                required
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6 mt-6 !mt-6 space-y-6">
                        <h3 className="text-lg font-medium">Tarifa Referencial</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="defaultPrice">Precio Base (Opcional)</Label>
                                <Input
                                    id="defaultPrice"
                                    type="number"
                                    step="0.01"
                                    defaultValue={initialData?.defaultPrice}
                                    placeholder="Ej. 150.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currencyCode">Moneda (Opcional)</Label>
                                <Select defaultValue={initialData?.currencyCode || "USD"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Moneda" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                                        <SelectItem value="PEN">Soles (PEN)</SelectItem>
                                        <SelectItem value="EUR">Euros (EUR)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end border-t pt-6 gap-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.push("/services")}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {isEditing ? "Guardar Cambios" : "Crear Servicio"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
