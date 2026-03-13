import { ContactForm } from "@/components/contacts/ContactForm";
import { getAllCompanies } from "@/app/actions/crm/company-actions";
import { Suspense } from "react";
import type { CompanyOption } from "@/lib/crm-list-types";

export default async function NewContactPage() {
    const result = await getAllCompanies();
    const companies: CompanyOption[] = (result.data || []).map((company) => ({
        id: company.id,
        businessName: company.businessName,
    }));

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Contacto</h1>
                <p className="text-muted-foreground">
                    Agrega nuevos ejecutivos, sectoristas o personal asociado a una empresa existente.
                </p>
            </div>
            <Suspense fallback={<div className="p-4 text-center">Cargando formulario...</div>}>
                <ContactForm companies={companies} />
            </Suspense>
        </div>
    );
}
