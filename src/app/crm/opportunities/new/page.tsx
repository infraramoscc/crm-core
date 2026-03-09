import { OpportunityForm } from "@/components/crm/OpportunityForm";

export default function NewOpportunityPage() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nueva Oportunidad</h1>
                <p className="text-muted-foreground">
                    Ingresa al embudo un posible negocio, importación o exportación que estés negociando hoy.
                </p>
            </div>

            <OpportunityForm />
        </div>
    );
}
