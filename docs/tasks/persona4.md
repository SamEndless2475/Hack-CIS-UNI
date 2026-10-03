# Persona 4 — Rama `persona4/galeria-proyectos`

## Objetivo
Vitrina pública de los proyectos entregados — sirve como contenido compartible y métrica de impacto para sponsors.

## Tareas
1. Página nueva `app/proyectos/page.tsx`: tarjetas con nombre del equipo, pitch corto, tecnologías usadas, link a repo/demo/video.
2. Vista de detalle de proyecto (opcional): `app/proyectos/[id]/page.tsx`.
3. (Opcional, coordinar con el equipo) botón de "like"/voto del público, separado claramente del puntaje real de jueces para no generar confusión.
4. Reutilizar el contenido de `components/sections/project-submissions-section.tsx` como referencia de los requisitos de entrega que debe cumplir cada proyecto mostrado.

## Dependencia externa (no bloquea el inicio)
Se necesita un endpoint del backend externo para listar proyectos entregados (hoy no existe). **Mientras no esté:** construir la UI con datos mock.

## Archivos de referencia
- `components/sections/project-submissions-section.tsx` (reglas de entrega actuales, estático)
