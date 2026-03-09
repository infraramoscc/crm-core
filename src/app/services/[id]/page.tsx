import { ServiceForm } from "@/components/services/ServiceForm";
import { mockServices } from "@/lib/mock-data";
import { notFound } from "next/navigation";

interface EditServicePageProps {
    params: {
        id: string;
    };
}

export default async function EditServicePage({ params }: EditServicePageProps) {
    const { id } = await params;
    const service = mockServices.find((s) => s.id === id);

    if (!service) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Servicio</h1>
                <p className="text-muted-foreground">
                    Modificando el concepto: <span className="font-semibold text-foreground">{service.name} ({service.code})</span>
                </p>
            </div>

            <ServiceForm initialData={service} />
        </div>
    );
}
