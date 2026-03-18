"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

type AppShellProps = {
  children: React.ReactNode;
  modal: React.ReactNode;
  userEmail?: string | null;
};

export function AppShell({ children, modal, userEmail }: AppShellProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/login")) {
    return (
      <>
        {children}
        {modal}
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40 text-foreground">
      <Sidebar />
      <div className="flex w-full flex-col lg:pl-0">
        <Topbar userEmail={userEmail} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {modal}
    </div>
  );
}
