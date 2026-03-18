# CRM Core

CRM comercial construido con Next.js, Prisma y PostgreSQL de Supabase.

## Variables de entorno

Duplica `.env.example` a `.env` y completa:

```bash
DATABASE_URL=...
DIRECT_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Si tu proyecto aun no usa publishable keys, puedes usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` como reemplazo temporal.

## Desarrollo

```bash
npm run dev
```

La aplicacion protege el CRM con cookies SSR de Supabase y expone la pantalla de acceso en `/login`.
