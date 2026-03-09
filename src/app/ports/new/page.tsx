import { PortForm } from "@/components/ports/PortForm";

export default function NewPortPage() {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Puerto / Recinto</h1>
                <p className="text-muted-foreground">
                    Agrega un nuevo punto de embarque, desembarque o aduana a tu catálogo.
                </p>
            </div>

            <PortForm />
        </div>
    );
}
