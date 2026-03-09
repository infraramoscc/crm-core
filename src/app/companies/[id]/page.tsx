import { CompanyForm } from "@/components/companies/CompanyForm";
import { getCompanyById } from "@/app/actions/crm/company-actions";
import { notFound } from "next/navigation";

interface EditCompanyPageProps {
    params: {
        id: string;
    };
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
    const { id } = await params;

    const result = await getCompanyById(id);
    const company = result.success ? result.data : null;

    if (!company) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Empresa</h1>
                <p className="text-muted-foreground">
                    Modificando los datos de: <span className="font-semibold text-foreground">{company.businessName}</span>
                </p>
            </div>

            <CompanyForm initialData={company} />
        </div>
    );
}
