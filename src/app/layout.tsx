import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CargoERP",
  description: "CRM comercial con autenticacion sobre Supabase",
};

import { AppShell } from "@/components/layout/AppShell";
import { SearchProvider } from "@/components/layout/SearchProvider";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  let userEmail: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userEmail = user?.email ?? null;
  } catch {
    userEmail = null;
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <SearchProvider>
          <AppShell userEmail={userEmail} modal={modal}>
            {children}
          </AppShell>
        </SearchProvider>
      </body>
    </html>
  );
}
