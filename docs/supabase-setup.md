# Guía rápida para conectar Supabase (Nube + Sync entre socios)

La aplicación funciona de inmediato en **Modo Local** para pruebas en tu navegador sin configurar variables. Cuando quieras activar la sincronización en tiempo real entre tu celular, tu PC y el de tu hermana:

1. Crea un proyecto gratuito en [Supabase](https://supabase.com/).
2. Abre **SQL Editor** en Supabase y ejecuta en orden los scripts de `supabase/migrations/`:
   - [001_initial_schema.sql](../supabase/migrations/001_initial_schema.sql)
   - [002_seed_categories.sql](../supabase/migrations/002_seed_categories.sql)
3. En **Authentication → Users**, crea los usuarios de acceso (el tuyo y el de tu hermana) e inserta sus filas correspondientes en `public.profiles` usando sus `uuid` de usuario:
   ```sql
   insert into public.profiles (id, full_name, seller_slug, whatsapp_number, role)
   values
     ('<UUID_GONZALO>', 'Gonzalo', 'gonzalo', '54911...', 'owner'),
     ('<UUID_HERMANA>', 'Hermana', 'hermana', '54911...', 'partner');
   ```
4. Copia `.env.example` a `.env.local` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
5. En tu proveedor de hosting (ej. Vercel o Cloudflare Pages), carga esas mismas dos variables de entorno antes de desplegar.
