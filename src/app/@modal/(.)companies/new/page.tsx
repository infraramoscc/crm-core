import { InterceptedModal } from "@/components/ui/intercepted-modal";
import { CompanyForm } from "@/components/companies/CompanyForm";

export default function NewCompanyModal() {
    return (
        <InterceptedModal title="Nueva Empresa">
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Nueva Empresa</h2>
                    <p className="text-muted-foreground">
                        Registra un cliente, agente, o proveedor en la base de datos.
                    </p>
                </div>
                <CompanyForm />
            </div>
        </InterceptedModal>
    );
}
