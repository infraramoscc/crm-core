import { CompanyForm } from "@/components/companies/CompanyForm";

export default function NewCompanyPage() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Empresa</h1>
                <p className="text-muted-foreground">
                    Crea un nuevo registro para clientes, importadores, agentes, entre otros actores logísticos.
                </p>
            </div>

            <CompanyForm />
        </div>
    );
}
