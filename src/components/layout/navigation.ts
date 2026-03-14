import {
  Anchor,
  Box,
  Briefcase,
  Building2,
  CalendarClock,
  LayoutDashboard,
  PhoneCall,
  Search,
  Settings,
  Truck,
  UploadCloud,
  Users2,
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  section?: "main" | "secondary";
}

export const navItems: NavigationItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/contacts", label: "Contactos", icon: Users2 },
  { href: "/ports", label: "Puertos", icon: Anchor },
  { href: "/services", label: "Servicios", icon: Box },
  { href: "/crm/import", label: "Importar Base (Excel)", icon: UploadCloud },
  { href: "/crm/investigation", label: "Investigacion", icon: Search },
  { href: "/crm/prospecting", label: "Caceria (Prospeccion)", icon: PhoneCall },
  { href: "/crm/tasks", label: "Mis Tareas", icon: CalendarClock },
  { href: "/crm", label: "Pipeline (Negocios)", icon: Briefcase },
  { href: "/tracking", label: "Seguimiento", icon: Truck },
  { href: "/settings", label: "Configuracion", icon: Settings, section: "secondary" },
];
