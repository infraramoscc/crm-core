import { PortForm } from "@/components/ports/PortForm";
import { mockPorts } from "@/lib/mock-data";
import { notFound } from "next/navigation";

interface EditPortPageProps {
    params: {
        id: string;
    };
}

export default async function EditPortPage({ params }: EditPortPageProps) {
    const { id } = await params;
    const port = mockPorts.find((p) => p.id === id);

    if (!port) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Puerto</h1>
                <p className="text-muted-foreground">
                    Modificando el recinto: <span className="font-semibold text-foreground">{port.name} ({port.code})</span>
                </p>
            </div>

            <PortForm initialData={port} />
        </div>
    );
}
