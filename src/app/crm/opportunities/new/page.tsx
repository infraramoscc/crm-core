import { getOpportunityFormOptions } from "@/app/actions/crm/crm-actions";
import { OpportunityForm } from "@/components/crm/OpportunityForm";

export default async function NewOpportunityPage() {
    const optionsResult = await getOpportunityFormOptions();
    const options = optionsResult.success && optionsResult.data
        ? optionsResult.data
        : { companies: [], contacts: [] };

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Oportunidad</h1>
                <p className="text-muted-foreground">
                    Registra una operacion concreta que valga la pena empujar en el pipeline comercial.
                </p>
            </div>

            <OpportunityForm companies={options.companies} contacts={options.contacts} />
        </div>
    );
}
