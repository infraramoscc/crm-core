import { ServiceForm } from "@/components/services/ServiceForm";

export default function NewServicePage() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Servicio</h1>
                <p className="text-muted-foreground">
                    Crea un nuevo concepto para tu tarifario y úsalo luego en las cotizaciones a clientes.
                </p>
            </div>

            <ServiceForm />
        </div>
    );
}
