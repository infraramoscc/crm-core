"use client";

import { Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { useScopedSearch } from "./SearchProvider";
import { TaskNotificationsBell } from "./TaskNotificationsBell";

export function Topbar() {
    const { query, setQuery } = useScopedSearch();

    return (
        <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 lg:px-6">
            <div className="flex w-full max-w-sm items-center space-x-2">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Filtrar modulo actual..."
                        className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <TaskNotificationsBell />
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
