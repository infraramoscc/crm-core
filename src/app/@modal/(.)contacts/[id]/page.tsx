import { InterceptedModal } from "@/components/ui/intercepted-modal";
import { ContactForm } from "@/components/contacts/ContactForm";
import { getContactById } from "@/app/actions/crm/contact-actions";
import { getAllCompanies } from "@/app/actions/crm/company-actions";
import type { CompanyOption } from "@/lib/crm-list-types";
import { notFound } from "next/navigation";

interface EditContactModalProps {
    params: { id: string };
}

export default async function EditContactModal({ params }: EditContactModalProps) {
    const { id } = await params;

    // Obtener contacto
    const contactResult = await getContactById(id);
    const contact = contactResult.success ? contactResult.data : null;

    // Obtener lista de empresas
    const companiesResult = await getAllCompanies();
    const companies: CompanyOption[] = (companiesResult.data || []).map((company) => ({
        id: company.id,
        businessName: company.businessName,
    }));

    if (!contact) {
        notFound();
    }

    return (
        <InterceptedModal title="Editar Contacto">
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Editar Contacto</h2>
                    <p className="text-muted-foreground">
                        Actualizando la información de: <span className="font-semibold text-foreground">{contact.firstName} {contact.lastName}</span>
                    </p>
                </div>
                <ContactForm initialData={contact} companies={companies} />
            </div>
        </InterceptedModal>
    );
}
