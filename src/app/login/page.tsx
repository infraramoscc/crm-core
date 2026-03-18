"use client";

import { Anchor, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

type AuthMode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const config = getSupabaseConfig();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!config) {
      setFeedback("Configura las variables publicas de Supabase antes de iniciar sesion.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setFeedback(error.message);
          return;
        }

        router.push(redirectTo);
        router.refresh();
        return;
      }

      const emailRedirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        setFeedback(error.message);
        return;
      }

      if (data.session) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      setFeedback("Cuenta creada. Revisa tu correo para confirmar el acceso antes de entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.2),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(15,23,42,0.04)_50%,transparent_100%)]" />
      <Card className="relative z-10 w-full max-w-md border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>CargoERP</CardTitle>
              <CardDescription>Autenticacion con Supabase para el CRM.</CardDescription>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <Button
              type="button"
              variant={mode === "sign-in" ? "default" : "ghost"}
              className="w-full"
              onClick={() => {
                setMode("sign-in");
                setFeedback(null);
              }}
            >
              Iniciar sesion
            </Button>
            <Button
              type="button"
              variant={mode === "sign-up" ? "default" : "ghost"}
              className="w-full"
              onClick={() => {
                setMode("sign-up");
                setFeedback(null);
              }}
            >
              Crear cuenta
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="operador@tuempresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>

            {feedback ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {feedback}
              </div>
            ) : null}

            {!config ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Falta configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el entorno.
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting || !config}>
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {mode === "sign-in" ? "Entrar al CRM" : "Crear acceso"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Si activas confirmacion por correo en Supabase, el usuario nuevo tendra que validar su email antes de entrar.
          </p>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Proyecto protegido por cookies SSR. Ajusta las credenciales publicas en entorno y elimina las claves de Clerk.
          </p>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            <Link href="https://supabase.com/dashboard" className="underline underline-offset-4">
              Abrir panel de Supabase
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
