import { InterceptedModal } from "@/components/ui/intercepted-modal";
import { ContactForm } from "@/components/contacts/ContactForm";
import { getAllCompanies } from "@/app/actions/crm/company-actions";

export default async function NewContactModal() {
    const result = await getAllCompanies();
    const companies = (result.data || []).map((c: any) => ({
        id: c.id,
        businessName: c.businessName,
    }));

    return (
        <InterceptedModal title="Nuevo Contacto">
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Nuevo Contacto</h2>
                    <p className="text-muted-foreground">
                        Agrega nuevos ejecutivos o personal asociado a una empresa existente.
                    </p>
                </div>
                <ContactForm companies={companies} />
            </div>
        </InterceptedModal>
    );
}
