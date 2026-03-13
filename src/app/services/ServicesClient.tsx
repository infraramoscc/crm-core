"use client";

import Link from "next/link";
import { Plus, MoreHorizontal, Pencil, Trash, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import type { Service } from "@/lib/mock-data";
import { matchesSearch } from "@/lib/search";
import { useScopedSearch } from "@/components/layout/SearchProvider";

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

export default function ServicesClient({ initialServices }: { initialServices: Service[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const { query: searchQuery } = useScopedSearch();
    const itemsPerPage = 10;

    const filteredServices = useMemo(
        () => initialServices.filter((service) => matchesSearch(searchQuery, service.code, service.name, service.category, service.currencyCode, service.defaultPrice)),
        [initialServices, searchQuery]
    );

    const effectivePage = searchQuery ? 1 : currentPage;
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const paginatedServices = filteredServices.slice(
        (effectivePage - 1) * itemsPerPage,
        effectivePage * itemsPerPage
    );

    const getCategoryTheme = (category: string) => {
        switch (category) {
            case "LOGISTICS": return "bg-indigo-100 text-indigo-700 border-indigo-200";
            case "CUSTOMS": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "TRANSPORT": return "bg-orange-100 text-orange-700 border-orange-200";
            case "WAREHOUSE": return "bg-purple-100 text-purple-700 border-purple-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case "LOGISTICS": return "Logística Internacional";
            case "CUSTOMS": return "Aduanas";
            case "TRANSPORT": return "Transporte Terrestre";
            case "WAREHOUSE": return "Almacenaje";
            default: return "Otros";
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Catálogo de Servicios</h1>
                    <p className="text-muted-foreground">
                        Gestión del tarifario base de fletes, agenciamiento y gastos locales.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/services/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Servicio
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Descripción del Servicio</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Precio Base</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedServices.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium font-mono text-muted-foreground">
                                    {service.code}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-primary/70" />
                                        {service.name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getCategoryTheme(service.category)}`}>
                                        {getCategoryLabel(service.category)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {service.defaultPrice !== undefined ? (
                                        <span>
                                            <span className="text-muted-foreground mr-1">{service.currencyCode}</span>
                                            {service.defaultPrice.toFixed(2)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm italic">Variable</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {service.isActive ? (
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
                                                <Link href={`/services/${service.id}`}>
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
                        ))}

                        {filteredServices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No hay servicios registrados aún.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {(effectivePage - 1) * itemsPerPage + 1} a {Math.min(effectivePage * itemsPerPage, filteredServices.length)} de {filteredServices.length} servicios
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <span className="text-sm font-medium">
                            Página {effectivePage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
