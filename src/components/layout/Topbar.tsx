"use client";

import Link from "next/link";
import { Anchor, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TaskNotificationsBell } from "./TaskNotificationsBell";
import { useScopedSearch } from "./SearchProvider";
import { SupabaseUserMenu } from "./SupabaseUserMenu";
import { navItems } from "./navigation";

type TopbarProps = {
  userEmail?: string | null;
};

function formatUserLabel(userEmail?: string | null) {
  if (!userEmail) {
    return "Sesion activa";
  }

  const base = userEmail.split("@")[0] ?? userEmail;

  return base
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Topbar({ userEmail }: TopbarProps) {
  const pathname = usePathname();
  const { query, setQuery } = useScopedSearch();
  const mainItems = navItems.filter((item) => item.section !== "secondary");
  const secondaryItems = navItems.filter((item) => item.section === "secondary");

  return (
    <header className="border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-xs p-0">
              <SheetHeader className="border-b px-5 py-4 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <Anchor className="h-5 w-5 text-primary" />
                  CargoERP
                </SheetTitle>
                <SheetDescription>
                  Navegacion principal del CRM.
                </SheetDescription>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <nav className="grid gap-1 px-3 py-4">
                  {mainItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-auto border-t px-3 py-4">
                  {secondaryItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar modulo actual..."
            className="w-full bg-background pl-8 sm:max-w-sm md:max-w-md"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <TaskNotificationsBell />
          <div className="flex items-center gap-2 border-l pl-2 md:pl-4">
            <div className="hidden text-right sm:flex sm:flex-col">
              <span className="text-sm font-medium leading-none">{formatUserLabel(userEmail)}</span>
              <span className="mt-1 text-xs text-muted-foreground">{userEmail ?? "Supabase Auth"}</span>
            </div>
            <SupabaseUserMenu userEmail={userEmail} />
          </div>
        </div>
      </div>
    </header>
  );
}
