import { OpportunityForm } from "@/components/crm/OpportunityForm";
import { mockOpportunities } from "@/lib/mock-data";
import { notFound } from "next/navigation";

interface EditOpportunityPageProps {
    params: {
        id: string;
    };
}

export default async function EditOpportunityPage({ params }: EditOpportunityPageProps) {
    const { id } = await params;
    const opp = mockOpportunities.find((o) => o.id === id);

    if (!opp) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Oportunidad</h1>
                <p className="text-muted-foreground">
                    Actualizando las condiciones de la oportunidad en curso.
                </p>
            </div>

            <OpportunityForm initialData={opp} />
        </div>
    );
}
