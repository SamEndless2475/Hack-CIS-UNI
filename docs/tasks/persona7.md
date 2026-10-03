# Persona 7 — Rama `persona7/checkin-qr`

## Objetivo
Dar utilidad el día del evento: check-in rápido y un cierre compartible (certificado).

## Tareas
1. Generar un QR único por hacker usando el `id` que devuelve el backend al registrarse (ej. librería `qrcode`).
2. Mostrar el QR en `SuccessModal` (o uno nuevo) tras el registro.
3. Página interna `app/staff/scanner/page.tsx` protegida (clave simple o login básico) para que el staff escane el QR y marque asistencia (ej. con `html5-qrcode`).
4. Al finalizar el evento, generar un certificado de participación (imagen/PDF) reusando el motor de `lib/neobanana-service.ts` (mismo patrón que el banner de la Persona 5 — coordinar para no duplicar lógica).

## Dependencia externa
Marcar asistencia requiere que el backend externo tenga (o se le agregue) un endpoint para registrar/consultar check-in por `id` de hacker. **Mientras no esté:** simular el marcado localmente para probar el flujo de escaneo.

## Archivos de referencia
- `components/success-modal.tsx`
- `lib/neobanana-service.ts` (patrón de generación de imagen a reusar)
