import { ContactForm } from "@/components/contacts/ContactForm";
import { getContactById } from "@/app/actions/crm/contact-actions";
import { getAllCompanies } from "@/app/actions/crm/company-actions";
import type { CompanyOption } from "@/lib/crm-list-types";
import { notFound } from "next/navigation";

interface EditContactPageProps {
    params: {
        id: string;
    };
}

export default async function EditContactPage({ params }: EditContactPageProps) {
    const { id } = await params;

    // Obtener contacto
    const contactResult = await getContactById(id);
    const contact = contactResult.success ? contactResult.data : null;

    // Obtener lista de empresas para el select
    const companiesResult = await getAllCompanies();
    const companies: CompanyOption[] = (companiesResult.data || []).map((company) => ({
        id: company.id,
        businessName: company.businessName,
    }));

    if (!contact) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Contacto</h1>
                <p className="text-muted-foreground">
                    Actualizando la información de: <span className="font-semibold text-foreground">{contact.firstName} {contact.lastName}</span>
                </p>
            </div>

            <ContactForm initialData={contact} companies={companies} />
        </div>
    );
}
