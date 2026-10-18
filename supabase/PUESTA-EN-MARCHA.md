# Puesta en marcha — qué falta para que el registro funcione

El código está escrito y el build pasa, pero **nada de esto se ha probado contra la
base de datos real** porque no hay credenciales de Supabase en el proyecto. Estos
son los pasos, en orden.

## 1. Aplicar las migraciones

Dashboard → SQL Editor, y ejecutar en este orden:

1. `migrations/20261017000001_init.sql` — tablas, RLS y funciones
2. `migrations/20261017000002_seed_universities.sql` — 107 instituciones, 113 dominios
3. `migrations/20261017000003_storage_badge_photos.sql` — bucket de fotos del carnet

Son idempotentes: se pueden volver a correr sin romper nada.

Comprobación rápida después de aplicarlas:

```sql
select count(*) from institutions;                      -- 107
select count(*) from university_domains;                -- 113
select count(*) from institutions where is_eligible;     -- 104 (institutos fuera)
select is_institutional_email('kevin.pinto.a@uni.pe');    -- true
select is_institutional_email('kevin@gmail.com');         -- false
select is_institutional_email('alguien@tecsup.edu.pe');   -- false (instituto)
```

## 2. Variables de entorno

Crear `.env.local` en la raíz con:

```
NEXT_PUBLIC_SUPABASE_URL=https://uevcvgkvrttbnqiorrlt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<la clave anon>
```

Está en Dashboard → Project Settings → API → `anon` / `public`.
Es pública por diseño (viaja en el navegador); lo que protege los datos es RLS.

**No** poner aquí la clave `service_role`: salta todas las políticas.

## 2.bis Migración de sponsors (pendiente)

Falta correr `migrations/20261017000004_sponsors_campos.sql`. Agrega las columnas
que el formulario de `/sponsors` ya estaba recogiendo (apellido del contacto y
tres redes). **Hasta que se aplique, el formulario de patrocinadores fallará.**

## 3. Configurar el correo

Supabase Free trae un servidor de correo de cortesía con un límite de muy pocos
envíos por hora, pensado solo para pruebas. **Con cientos de registros no alcanza.**

1. **SMTP propio**: Authentication → Emails → SMTP Settings.
   Resend tiene capa gratis y es lo que usa hacktheandes (se ve en su URL).
2. **Plantilla del correo**: Authentication → Emails → *Magic Link*.

   **El registro funciona de las dos formas**, así que esto ya no bloquea:
   - Si la plantilla manda el **código** (`{{ .Token }}`), el usuario lo escribe
     en `/register`.
   - Si manda un **enlace**, al hacer clic cae en `/auth/callback`, que canjea la
     sesión y lo lleva a `/panel`.

   Aun así, el código es mejor en móvil (no hace falta saltar al correo y volver,
   que es donde más gente se pierde). Para forzarlo, la plantilla debe incluir
   `{{ .Token }}`:

   ```html
   <h2>Tu código para Hack[CIS] UNI 2026</h2>
   <p>Escribe este código en la página:</p>
   <p style="font-size:32px;letter-spacing:8px"><b>{{ .Token }}</b></p>
   <p>Vence en 1 hora. Si no lo pediste, ignora este correo.</p>
   ```

3. **URLs permitidas**: Authentication → URL Configuration. Para que el enlace
   del correo funcione, hay que agregar en *Redirect URLs*:

   ```
   http://localhost:3000/auth/callback
   https://<dominio-de-produccion>/auth/callback
   ```

   Si falta, el enlace rebota y el usuario ve un error. (El camino del código de
   6 dígitos funciona igual sin esto.)

4. **Rate limits**: Authentication → Rate Limits. Subir el de envío de correos
   según lo que permita el plan y lo que aguante el SMTP.

## 4. Dar de alta al staff

```sql
insert into staff (email, full_name) values
  ('kevin.pinto.a@uni.pe', 'Kevin Pinto'),
  ('petter.chuquipiondo.r@uni.pe', 'Joseph Robles'),
  ('samuel.quispe.v@uni.pe', 'Samuel QV')
on conflict (email) do nothing;
```

Quien esté en esta tabla puede ver todos los hackers y hacer check-in.

## 5. Probar el flujo completo

```bash
pnpm dev
```

1. `/register` → escribir un correo que **no** sea universitario → debe rechazarlo
   antes de mandar nada.
2. `/register` → correo universitario real → llega el código → verificar.
3. Redirige a `/panel` → completar datos → guardar.
4. Pestaña "Mi carnet" → subir foto → el carnet 3D se actualiza → Descargar.

## Lo que todavía no está conectado

- No hay página de check-in (`/checkin/<qr_token>`) ni escáner de staff. El QR del
  carnet ya apunta a `https://hackcis.uni.pe/checkin/<qr_token>`, así que falta
  construir esa ruta y la de `/staff/scanner`.
- La fecha del evento está en pausa: el countdown del home apunta al 2 de
  noviembre de 2026 por un mes 0-indexado en `components/countdown-timer.tsx`.
  Hay que corregirlo cuando se decida la fecha.
- El dominio `hackcis.uni.pe` está escrito a mano en el QR y en el pie del carnet.
  Si el dominio real es otro, hay que cambiarlo en `app/panel/page.tsx` y en
  `lib/badge-canvas.ts`.
- `/carnet/demo` solo existe en desarrollo (en producción devuelve 404).
