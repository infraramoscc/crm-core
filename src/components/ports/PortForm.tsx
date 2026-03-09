"use client";

import { useRouter } from "next/navigation";
import { type Port } from "@/lib/mock-data";
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

interface PortFormProps {
    initialData?: Port;
}

export function PortForm({ initialData }: PortFormProps) {
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/ports");
    };

    const isEditing = !!initialData;

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Datos del Puerto</CardTitle>
                    <CardDescription>
                        Identificación de ubicaciones, puertos, aeropuertos y recintos aduaneros.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="code">Código (UN/LOCODE) *</Label>
                            <Input
                                id="code"
                                defaultValue={initialData?.code}
                                placeholder="Ej. PEPRU, PELIM, USMIA"
                                className="font-mono uppercase"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo Medio *</Label>
                            <Select defaultValue={initialData?.type || "SEA"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona marítimo, aéreo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SEA">Marítimo (Puerto)</SelectItem>
                                    <SelectItem value="AIR">Aéreo (Aeropuerto)</SelectItem>
                                    <SelectItem value="LAND">Terrestre (Frontera/Almacén)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name">Nombre Oficial *</Label>
                            <Input
                                id="name"
                                defaultValue={initialData?.name}
                                placeholder="Ej. Callao Muelle Sur"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="countryCode">Código de País ISO 3166-1 *</Label>
                            <Input
                                id="countryCode"
                                defaultValue={initialData?.countryCode || "PE"}
                                placeholder="Ej. PE, US, CN"
                                className="font-mono uppercase"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end border-t pt-6 gap-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.push("/ports")}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {isEditing ? "Guardar Cambios" : "Crear Puerto"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
