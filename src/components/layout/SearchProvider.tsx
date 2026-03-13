"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

interface SearchContextValue {
    query: string;
    setQuery: (value: string) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [queriesByPath, setQueriesByPath] = useState<Record<string, string>>({});

    const value = useMemo<SearchContextValue>(() => ({
        query: queriesByPath[pathname] || "",
        setQuery: (value: string) => {
            setQueriesByPath((prev) => ({
                ...prev,
                [pathname]: value,
            }));
        },
    }), [pathname, queriesByPath]);

    return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useScopedSearch() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error("useScopedSearch must be used within SearchProvider");
    }
    return context;
}
