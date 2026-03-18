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

## Autenticacion

La aplicacion usa Supabase Auth con cookies SSR.

- Todas las rutas del CRM quedan protegidas por el `proxy`.
- La pantalla de acceso esta en `/login`.
- El registro publico esta deshabilitado en la UI y debe quedar deshabilitado tambien en Supabase.

### Configuracion recomendada en Supabase

En `Authentication` -> `General configuration`:

- Desactivar `Allow new users to sign up`

En `Authentication` -> `URL Configuration`:

- `Site URL`: `http://localhost:3000` en desarrollo
- `Redirect URLs`: `http://localhost:3000/**`
- En produccion agrega tu dominio de Vercel, por ejemplo `https://tu-proyecto.vercel.app/**`

### Como crear usuarios

Como el registro publico esta bloqueado, los usuarios deben crearse de una de estas formas:

- Desde `Authentication` -> `Users` en el dashboard de Supabase
- Mediante invitacion o creacion administrativa desde backend usando la Admin API de Supabase

Nunca expongas la `service_role` en el navegador.

## Produccion

En Vercel define estas variables al menos para `Production`:

```bash
DATABASE_URL=...
DIRECT_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Despues haz un redeploy para que Next.js tome el nuevo entorno.

## Desarrollo

```bash
npm run dev
```

La aplicacion protege el CRM con cookies SSR de Supabase y expone la pantalla de acceso en `/login`.
