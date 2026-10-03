# Persona 7 — Check-in con QR y certificado

Rama: `persona7/checkin-qr`
Tipo: feature nueva con dos partes: una para el participante (QR) y otra para el staff (escáner). Es la única rama que toca el flujo de registro en el borde.

## 1. Objetivo

- **Día del evento:** el staff escanea un QR y marca asistencia en segundos, sin buscar nombres en una lista.
- **Al cierre:** cada participante puede descargar un certificado de participación para compartir.

## 2. Qué existe hoy

- `components/success-modal.tsx` — modal de éxito tras registrarse, recibe `participantName`. **Compartido con P5 (banner): P7 es dueño del archivo.**
- `app/register/page.tsx` — al registrarse, el backend devuelve datos del hacker. Hoy el frontend **no guarda el `id`** que devuelve el backend (solo se usa `response.ok`). Esto es un cambio necesario.
- No hay página de staff ni lector de QR.

## 3. Alcance

### Dentro
1. Capturar el `id` del hacker al registrarse y pasarlo a `SuccessModal`.
2. Generar QR con el `id` (o con un `qr_token` firmado si el backend lo entrega).
3. Mostrar el QR en el modal de éxito, con opción de descargarlo.
4. Página `/staff/scanner` protegida por una clave simple (ver sección 5).
5. Escáner de cámara que lee el QR y llama a `checkin`.
6. Pantalla de resultado: "Asistencia registrada: Nombre", o "Ya registrado a las HH:MM", o "No encontrado".
7. Generar certificado PNG/PDF al terminar el evento (página `/certificado` con búsqueda por email).

### Fuera
- Gafete impreso con QR (diseño físico, otra persona/equipo).
- Control de acceso a salas o talleres (fase 2).
- Login real de staff.

## 4. Seguridad del QR

**Riesgo importante:** si el QR contiene solo el `id` del hacker, cualquiera que lo fotografíe puede generar asistencias falsas o suplantar a alguien. Opciones:

- **a) QR con `id`** — simple, pero predecible si los ids son secuenciales. Los ids del backend son UUID, así que el riesgo es bajo, pero no nulo.
- **b) QR con `qr_token`** — token aleatorio generado por el backend, asociado al hacker. Mejor. Requiere endpoint nuevo.
- **c) QR firmado (JWT o HMAC)** — la firma la verifica el backend. Más robusto.

**Recomendación:** pedir (b) al backend. Mientras tanto, desarrollar con (a) y dejar marcado como deuda técnica.

## 5. Acceso del staff

Sin login real, la página del escáner es un riesgo: cualquiera puede marcar asistencias. Opciones, de menor a mayor esfuerzo:

1. **Clave compartida** en variable de entorno (`STAFF_SCANNER_KEY`), validada en un route handler. Suficiente para un evento de un día. Nunca usar `NEXT_PUBLIC_` para esta clave.
2. **Login por email de staff** con lista blanca en backend.

**Recomendación:** opción 1 para el evento. Anotar en el PR que no es seguridad de producción.

## 6. Diseño propuesto

### Archivos nuevos
- `lib/api-checkin.ts` — `getHackerById(id)`, `checkIn(hackerId, staffId)`. Único punto de red.
- `lib/mocks/checkin.ts` — simula asistencias en `localStorage` del escáner para pruebas.
- `components/checkin/hacker-qr.tsx` — genera y muestra el QR (librería `qrcode`).
- `components/checkin/qr-scanner.tsx` — lector de cámara (librería `html5-qrcode`).
- `components/checkin/checkin-result.tsx` — pantalla de resultado.
- `app/staff/scanner/page.tsx`
- `app/api/staff/checkin/route.ts` — valida la clave de staff en servidor y reenvía al backend. Así la clave nunca se expone al navegador.
- `app/certificado/page.tsx` — búsqueda por email y descarga.
- `lib/certificate.ts` — genera el certificado en canvas (puede reutilizar el patrón de P5, coordinar para no duplicar).

### Archivos a modificar
- `app/register/page.tsx` — **mínimo**: guardar `response.data.id` del backend y pasarlo a `SuccessModal`. Una sola zona del archivo, no reestructurar el wizard.
- `components/success-modal.tsx` — agregar el componente `HackerQR`. **P7 es dueño de este archivo;** P5 se monta aquí después.
- `components/sections/navigation.tsx` — link solo si el staff lo necesita; probablemente no, para que no sea visible al público. Decidir.

### Dependencia nueva
Agregar `qrcode` y `html5-qrcode` a `package.json`. **Avisar al equipo antes**: cambian dependencias y el `pnpm-lock.yaml`, que genera conflictos fáciles.

## 7. Flujo de usuario

**Participante:**
1. Se registra → `SuccessModal` muestra su QR.
2. Puede descargarlo o hacer captura de pantalla.

**Staff el día del evento:**
1. Abre `/staff/scanner` en su celular, ingresa la clave una vez.
2. Apunta la cámara al QR del participante.
3. Ve resultado en menos de 2 segundos.
4. Si ya se registró antes, ve la hora de la primera asistencia y no duplica.

**Participante al cierre:**
1. Entra a `/certificado`, ingresa su email.
2. Si tuvo check-in, descarga el certificado. Si no, mensaje explicativo.

## 8. Reglas

- **Idempotencia:** escanear dos veces el mismo QR no cuenta dos veces. Responder 200 con la fecha original.
- **Certificado solo con check-in:** no se emite si no asistió. Esto es decisión de negocio: confirmarla.
- **Escáner sin cámara:** ofrecer campo para escribir el email o nombre y buscar manualmente. Una falla de cámara no puede paralizar la entrada.

## 9. Criterios de aceptación

- [ ] El `id` del hacker llega a `SuccessModal` tras el registro real.
- [ ] El QR se genera y se puede descargar.
- [ ] El escáner lee el QR en Chrome móvil y Safari iOS.
- [ ] La clave de staff se valida en servidor; no aparece en el bundle del navegador (verificar con `pnpm build` y buscar la clave).
- [ ] Escanear dos veces no duplica la asistencia.
- [ ] Sin cámara, la búsqueda manual funciona.
- [ ] Certificado descarga con nombre legible.

## 10. Riesgos

- **Permisos de cámara en iOS:** requiere HTTPS. En `localhost` funciona, pero en un dominio sin certificado no.
- **Conectividad en el evento:** si el backend está lento o caído, el check-in no funciona. Valorar un modo "cola offline" en fase 2. Por ahora, documentar el plan B (lista impresa).
- **Render (plan gratuito) se duerme:** hacer una petición de calentamiento antes de que empiece el check-in.
- **Duplicado de lógica con P5** para generar imágenes: coordinar una sola utilidad de canvas.

## 11. Checklist de QA

- [ ] Registro → QR visible en menos de 3 segundos.
- [ ] Dos escaneos seguidos del mismo QR: segundo muestra "ya registrado".
- [ ] QR inválido o de otro evento: mensaje claro, no error técnico.
- [ ] Clave de staff incorrecta: rechazada.
- [ ] Certificado sin check-in: mensaje, no descarga.
