import { InterceptedModal } from "@/components/ui/intercepted-modal";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { getCompanyById } from "@/app/actions/crm/company-actions";
import { notFound } from "next/navigation";

interface EditCompanyModalProps {
    params: { id: string };
}

export default async function EditCompanyModal({ params }: EditCompanyModalProps) {
    const { id } = await params;
    const result = await getCompanyById(id);
    const company = result.success ? result.data : null;

    if (!company) {
        notFound();
    }

    return (
        <InterceptedModal title="Editar Empresa">
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Editar Empresa</h2>
                    <p className="text-muted-foreground">
                        Modificando los datos de: <span className="font-semibold text-foreground">{company.businessName}</span>
                    </p>
                </div>
                <CompanyForm initialData={company} />
            </div>
        </InterceptedModal>
    );
}
