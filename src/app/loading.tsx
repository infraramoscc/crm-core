import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground w-full h-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h3 className="text-xl font-medium tracking-tight">Cargando información...</h3>
            <p className="text-sm">Conectando con la base de datos de CargoERP</p>
        </div>
    );
}
