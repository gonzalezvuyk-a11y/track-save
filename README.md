# Track Save (Vite + React + Supabase Auth)

Este proyecto es una SPA con Vite + React (no Next.js), ahora con sistema completo de cuentas:

- Registro (`/register`)
- Inicio de sesión (`/login`)
- Recuperación de contraseña (`/forgot`)
- Reset de contraseña (`/reset`)
- Sesión persistente sin parpadeo
- Rutas protegidas (`/dashboard`, `/profile`)
- Perfil básico con rol (`user`/`admin`)

## 1) Instalar dependencias

```bash
npm install
```

## 2) Variables de entorno

Copia `.env.example` a `.env` y completa:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_GITHUB_ENABLED=false
VITE_SUPABASE_GOOGLE_ENABLED=false
```

## 3) Configurar base de datos (Supabase Postgres)

1. Abre Supabase SQL Editor.
2. Ejecuta el contenido de `supabase/schema.sql`.

Esto crea:

- Tabla `profiles` con onboarding (`full_name`, `currency`, `monthly_income`), `role`, timestamps.
- Tabla `finance_transactions` (base para mover finanzas a DB con RLS).
- Trigger `handle_new_user` para crear perfil al registrarse.
- Políticas RLS para que cada usuario solo acceda a sus datos (admin puede ver todo).

## 4) Configurar Auth en Supabase

En Authentication > URL Configuration:

- Site URL (local): `http://localhost:5173`
- Redirect URLs:
  - `http://localhost:5173/auth/callback`
  - `http://localhost:5173/login`
  - `http://localhost:5173/reset`
  - `http://localhost:5173/dashboard`
  - `https://TU_DOMINIO_PROD/auth/callback`
  - `https://TU_DOMINIO_PROD/login`
  - `https://TU_DOMINIO_PROD/reset`
  - `https://TU_DOMINIO_PROD/dashboard`

Opcional GitHub OAuth:

1. Crea app OAuth en GitHub.
2. Callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Carga Client ID/Secret en Supabase.
4. Define `VITE_SUPABASE_GITHUB_ENABLED=true`.

Opcional Google OAuth:

1. En Google Cloud Console crea credenciales OAuth 2.0.
2. Agrega redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Carga Client ID/Secret en Supabase (Authentication > Providers > Google).
4. Define `VITE_SUPABASE_GOOGLE_ENABLED=true`.

## 5) Ejecutar local

```bash
npm run dev
```

## 6) Deploy en Vercel

1. Importa el repo en Vercel.
2. En Project Settings > Environment Variables agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_GITHUB_ENABLED`
  - `VITE_SUPABASE_GOOGLE_ENABLED`
3. Redeploy.
4. Añade el dominio final en Supabase Auth (Site URL + Redirect URLs).

## Checklist de Vercel

- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada
- [ ] `VITE_SUPABASE_GITHUB_ENABLED` (`true` o `false`)
- [ ] `VITE_SUPABASE_GOOGLE_ENABLED` (`true` o `false`)
- [ ] Dominio de Vercel agregado en Supabase Auth
- [ ] Redirect URLs `/reset` y `/dashboard` agregadas en Supabase
- [ ] `vercel.json` con rewrite SPA a `/index.html` (evita 404 al volver de OAuth)
- [ ] `supabase/schema.sql` ejecutado en producción

## Comandos útiles

```bash
# desarrollo
npm run dev

# build de producción
npm run build
```
