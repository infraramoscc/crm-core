import Link from "next/link";
import { Plus, MoreHorizontal, Pencil, Trash, Earth } from "lucide-react";
import { mockPorts } from "@/lib/mock-data";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PortsPage() {
    const getPortTypeConfig = (type: string) => {
        switch (type) {
            case "SEA": return { label: "Marítimo", color: "bg-blue-100 text-blue-700 border-blue-200" };
            case "AIR": return { label: "Aéreo", color: "bg-sky-100 text-sky-700 border-sky-200" };
            case "LAND": return { label: "Terrestre", color: "bg-amber-100 text-amber-700 border-amber-200" };
            default: return { label: "Otro", color: "bg-gray-100 text-gray-700 border-gray-200" };
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Puertos y Recintos</h1>
                    <p className="text-muted-foreground">
                        Catálogo de terminales aéreos, marítimos y terrestres.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/ports/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Puerto
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código UN/LOCODE</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>País</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockPorts.map((port) => {
                            const typeConfig = getPortTypeConfig(port.type);

                            return (
                                <TableRow key={port.id}>
                                    <TableCell className="font-medium font-mono">{port.code}</TableCell>
                                    <TableCell>{port.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Earth className="h-4 w-4 text-muted-foreground" />
                                            {port.countryCode}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeConfig.color}`}>
                                            {typeConfig.label}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {port.isActive ? (
                                            <span className="text-emerald-500 font-medium text-sm">Activo</span>
                                        ) : (
                                            <span className="text-muted-foreground font-medium text-sm">Inactivo</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/ports/${port.id}`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
