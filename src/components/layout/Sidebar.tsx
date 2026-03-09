"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users2,
  Anchor,
  Box,
  Truck,
  Briefcase,
  Settings,
  Search,
  PhoneCall,
  UploadCloud,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/contacts", label: "Contactos", icon: Users2 },
  { href: "/ports", label: "Puertos", icon: Anchor },
  { href: "/services", label: "Servicios", icon: Box },
  { href: "/crm/import", label: "Importar Base (Excel)", icon: UploadCloud },
  { href: "/crm/investigation", label: "Investigación", icon: Search },
  { href: "/crm/prospecting", label: "Cacería (Prospección)", icon: PhoneCall },
  { href: "/crm", label: "Pipeline (Negocios)", icon: Briefcase },
  { href: "/tracking", label: "Seguimiento", icon: Truck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-screen hidden md:flex flex-col">
      <div className="h-14 flex items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Anchor className="h-6 w-6 text-primary" />
          <span className="text-lg tracking-tight">CargoERP</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={index}
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
      </div>

      <div className="p-4 border-t mt-auto">
        <nav className="grid gap-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
            Configuración
          </Link>
        </nav>
      </div>
    </aside>
  );
}
