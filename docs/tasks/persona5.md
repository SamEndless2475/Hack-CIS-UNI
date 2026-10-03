# Persona 5 — Banner para LinkedIn

Rama: `persona5/banner-linkedin`
Tipo: feature nueva, mayormente cliente (sin backend obligatorio).

## 1. Objetivo

Que cada participante, al terminar su registro, pueda generar un banner personalizado y publicarlo en LinkedIn. Cada publicación es publicidad gratuita del evento y del sponsor. Esto es lo que genera dinamismo en redes.

## 2. Qué existe hoy (punto de partida real)

- `lib/neobanana-service.ts` — `FlyerGeneratorService.generatePersonalizedFlyer(foto, nombre)`:
  - Intenta Gemini (`gemini-2.5-flash-image`) con 3 reintentos.
  - Si falla o hay cuota, cae a `generateCanvasFlyer()` (canvas puro, sin IA).
  - Devuelve una **blob URL** (no un archivo guardado).
- `components/flyer-generator-modal.tsx` — UI completa: subir foto, generar, descargar, compartir (`navigator.share`).
- Se monta en `app/register/page.tsx` (línea ~595) como **paso opcional** dentro del wizard.
- `components/success-modal.tsx` — se muestra al registrarse con éxito (`setShowSuccessModal(true)` en `register/page.tsx` línea ~330).
- El `FlyerGeneratorService` tiene `console.log` y lógica de reintento que se ejecuta en el navegador: revisar antes de reusar.

## 3. Qué falta

1. **Banner, no flyer**: formato horizontal para LinkedIn (1200×627 para post con imagen, 1584×396 para portada de perfil). El flyer actual es 4:5 para Instagram.
2. **Generación automática** al terminar el registro, no solo como paso opcional.
3. **Texto dinámico**: nombre, universidad, y si tiene equipo, nombre del equipo.
4. **Compartir real en LinkedIn**: LinkedIn no permite adjuntar imagen por URL en su share intent. El flujo honesto es:
   - Descargar la imagen.
   - Copiar un texto sugerido al portapapeles.
   - Abrir `https://www.linkedin.com/feed/` (o el compositor).
   - Instrucción en pantalla: "Adjunta la imagen y pega el texto".
5. **Variantes por rol**: hacker individual, hacker de equipo, mentor (si se agrega), sponsor.
6. **Sin depender de IA para lo básico**: el canvas es el camino por defecto. La IA es una mejora opcional.

## 4. Diseño propuesto

### Archivos nuevos
- `lib/banner/templates.ts` — definición de plantillas (dimensiones, posiciones de texto/foto, colores). Una plantilla = un objeto de configuración, no código duplicado.
- `lib/banner/render.ts` — función pura `renderBanner(template, datos) → Blob` usando canvas. Sin React, testeable.
- `lib/banner/caption.ts` — genera el texto sugerido para LinkedIn (ej. "Voy a Hack[CIS] 2026 en {universidad} 🚀 #HackCIS #IEEE").
- `components/banner/banner-generator.tsx` — UI: preview, selector de variante, botón descargar, botón copiar caption, botón abrir LinkedIn.

### Archivos a modificar (cuidado: zona compartida)
- `components/success-modal.tsx` — **P7 es dueño**. Agregar solo una línea: `<BannerGenerator ... />`. Coordinar antes.
- `app/register/page.tsx` — no tocar salvo que sea imprescindible; pasar los datos por props desde `SuccessModal`.

### Decisión sobre `FlyerGeneratorService`
No borrarlo en esta rama. Dejarlo como está y que el banner use `lib/banner/render.ts`. Cuando el banner esté estable, P1/P2 deciden si se elimina `flyer-generator-modal.tsx` y `neobanana-service.ts`.

## 5. Datos de entrada

| Dato | Origen | Obligatorio |
|---|---|---|
| Nombre | `answers.name` + `answers.lastname` | Sí |
| Universidad | `selectedUniversity.name` | Sí |
| Equipo | `answers.teamName` (si creó) o `selectedTeam.name` | No |
| Foto | Input del usuario | No (sin foto, banner solo con texto y logo) |

Sin foto el banner debe seguir funcionando. Es un caso real: muchos no quieren subir foto.

## 6. Flujo de usuario

1. Termina el registro → aparece `SuccessModal`.
2. Botón **"Crear mi banner"** → abre `BannerGenerator`.
3. Elige variante (individual / equipo) y opcionalmente sube foto.
4. Ve preview en tiempo real.
5. Botones: **Descargar PNG**, **Copiar texto para LinkedIn**, **Ir a LinkedIn**.
6. Mensaje claro: "LinkedIn no permite adjuntar imagen desde un enlace: descarga la imagen y adjúntala en tu publicación."

## 7. Mock vs real

No hay endpoint que usar. Todo ocurre en el navegador. Si se quiere que el banner quede guardado (para el dashboard o la galería), eso es una fase 2 y depende de `contratos-api.md`.

## 8. Criterios de aceptación

- [ ] Genera un PNG de 1200×627 con nombre y universidad legibles.
- [ ] Funciona **sin** API key de Gemini.
- [ ] Funciona sin foto y con foto.
- [ ] Nombres largos (ej. 40 caracteres) no rompen el layout: se truncan o se reducen fuente.
- [ ] Caracteres con tilde y ñ se ven bien (fuente cargada antes de dibujar en canvas).
- [ ] Botón copiar usa `navigator.clipboard` con fallback si no está disponible.
- [ ] Probado en móvil: en iOS Safari la descarga de blob funciona.
- [ ] No duplica código de `FlyerGeneratorService`.

## 9. Riesgos

- **Fuentes en canvas**: si la fuente no está cargada, el texto sale con fuente por defecto. Esperar `document.fonts.ready` antes de dibujar.
- **Foto en CORS**: si la foto viene de URL externa puede ser tainted. Solo se usan archivos subidos por el usuario (blob), no URLs.
- **Gemini consume cuota** y la key de cliente es visible (`NEXT_PUBLIC_`). Por eso el canvas es el camino principal.

## 10. Checklist de QA

- [ ] Registro individual → banner con nombre y universidad.
- [ ] Registro en equipo → banner muestra nombre del equipo.
- [ ] Sin internet: el canvas sigue funcionando (no depende de red).
- [ ] Descarga y caption se copian correctamente en Chrome, Firefox, Safari.
