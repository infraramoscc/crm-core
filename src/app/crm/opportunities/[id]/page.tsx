import { getOpportunityById, getOpportunityFormOptions } from "@/app/actions/crm/crm-actions";
import { OpportunityForm } from "@/components/crm/OpportunityForm";
import { notFound } from "next/navigation";

interface EditOpportunityPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditOpportunityPage({ params }: EditOpportunityPageProps) {
    const { id } = await params;
    const [opportunityResult, optionsResult] = await Promise.all([
        getOpportunityById(id),
        getOpportunityFormOptions(),
    ]);

    if (!opportunityResult.success || !opportunityResult.data) {
        notFound();
    }

    const options = optionsResult.success && optionsResult.data
        ? optionsResult.data
        : { companies: [], contacts: [] };

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Oportunidad</h1>
                <p className="text-muted-foreground">
                    Ajusta el contexto comercial real de la oportunidad, no solo la etapa del tablero.
                </p>
            </div>

            <OpportunityForm
                initialData={opportunityResult.data}
                companies={options.companies}
                contacts={options.contacts}
            />
        </div>
    );
}
