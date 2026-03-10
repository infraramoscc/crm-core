"use client";

import Link from "next/link";
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useState } from "react";

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

export default function CompaniesClient({ initialCompanies }: { initialCompanies: any[] }) {
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(initialCompanies.length / itemsPerPage);
    const paginatedCompanies = initialCompanies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
                    <p className="text-muted-foreground">
                        Gestiona tus clientes, agentes, transportistas y otras entidades.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/companies/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Empresa
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Razón Social</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Ciudad/País</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialCompanies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No hay empresas registradas aún. Importa desde un Excel o crea una manualmente.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedCompanies.map((company: any) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">
                                        {company.businessName}
                                        {company.tradeName && (
                                            <span className="block text-xs text-muted-foreground">
                                                {company.tradeName}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {company.documentType}: {company.documentNumber}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                                            {company.companyType}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {company.city || "-"}, {company.countryCode || "-"}
                                    </TableCell>
                                    <TableCell>
                                        {company.isActive ? (
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
                                                    <Link href={`/companies/${company.id}`}>
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, initialCompanies.length)} de {initialCompanies.length} empresas
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
                            Página {currentPage} de {totalPages}
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
