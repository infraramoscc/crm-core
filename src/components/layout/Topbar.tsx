import { Bell, Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
    return (
        <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 lg:px-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar despachos, clientes, DUA..."
                        className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="group">
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Button>
                <div className="flex items-center gap-2 border-l pl-4 ml-2">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium leading-none">Operador A.</span>
                        <span className="text-xs text-muted-foreground mt-1">Agencia de Carga</span>
                    </div>
                    <UserButton />
                </div>
            </div>
        </header>
    );
}
