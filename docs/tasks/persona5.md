# Persona 5 — Rama `persona5/banner-linkedin`

## Objetivo
Convertir el generador de flyer ya existente en un banner compartible que genere dinamismo en redes.

## Tareas
1. Extender `lib/neobanana-service.ts` (o crear un servicio hermano) para generar un banner con texto dinámico: nombre, universidad, "Voy a Hack[CIS] 2026 🚀".
2. Disparar la generación automáticamente al terminar el registro exitoso (hoy solo es un paso opcional dentro del wizard, en `components/flyer-generator-modal.tsx`).
3. Botón "Compartir en LinkedIn": descargar la imagen + copiar un caption sugerido + abrir el compositor de LinkedIn (`https://www.linkedin.com/sharing/share-offsite/?url=...` o el flujo manual, ya que LinkedIn no permite adjuntar imagen vía URL directamente — dejarlo claro en la UI).
4. Variante de template para equipos ("Nuestro equipo X está en Hack[CIS] 2026") reusando el mismo motor.

## Archivos de referencia
- `lib/neobanana-service.ts` (motor Gemini + fallback Canvas, ya funcional)
- `components/flyer-generator-modal.tsx`
- `app/register/page.tsx` (`SuccessModal`, punto donde se dispararía el flujo automático)

## Nota
Requiere `NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY` configurada en `.env.local` para la parte con IA real; el fallback Canvas funciona sin ella.
