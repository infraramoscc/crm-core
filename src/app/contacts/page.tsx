import Link from "next/link";
import { Plus, MoreHorizontal, Pencil, Trash, Building2 } from "lucide-react";
import { getAllContacts } from "@/app/actions/crm/contact-actions";

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

export default async function ContactsPage() {
    const result = await getAllContacts();
    const contacts = result.data || [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contactos</h1>
                    <p className="text-muted-foreground">
                        Directorio de personas clave en tus empresas (clientes, agencias, proveedores).
                    </p>
                </div>
                <Button asChild>
                    <Link href="/contacts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Contacto
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre Completo</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    No hay contactos registrados aún. Crea uno desde la página de una empresa.
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts.map((contact: any) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">
                                        {contact.firstName} {contact.lastName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <Link
                                                href={`/companies/${contact.companyId}`}
                                                className="hover:underline text-primary"
                                            >
                                                {contact.company?.businessName || "Desconocida"}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell>{contact.position || "-"}</TableCell>
                                    <TableCell>{contact.emails && contact.emails.length > 0 ? contact.emails[0] : "-"}</TableCell>
                                    <TableCell>{contact.phones && contact.phones.length > 0 ? contact.phones[0] : "-"}</TableCell>
                                    <TableCell>
                                        {contact.isActive ? (
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
                                                    <Link href={`/contacts/${contact.id}`}>
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
        </div>
    );
}
