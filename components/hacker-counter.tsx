"use client"

import { useCallback, useEffect, useState } from "react"

import AnimatedCounter from "./animated-counter"
import GradientText from "./gradient-text"
import { obtenerEstadisticas } from "@/lib/api-registro"
import { isSupabaseConfigured } from "@/lib/supabase/client"

const CLAVE_CACHE = "hackcis_hacker_count"

/**
 * Contador de hackers registrados.
 *
 * Lee de Supabase (get_public_stats). Antes consultaba el backend de Render, que
 * quedó respondiendo 503 y dejaba el contador en cero.
 *
 * El último valor se guarda en localStorage solo para no mostrar un 0 mientras
 * carga; nunca es la fuente de verdad.
 */
export default function HackerCounter() {
  const [conteo, setConteo] = useState(0)

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_CACHE)
      if (guardado) setConteo(Number.parseInt(guardado, 10) || 0)
    } catch {
      // Modo incógnito o almacenamiento bloqueado: arrancamos en 0.
    }
  }, [])

  const consultar = useCallback(async () => {
    if (!isSupabaseConfigured()) return

    try {
      const stats = await obtenerEstadisticas()
      if (typeof stats?.hackers !== "number") return

      setConteo(stats.hackers)
      try {
        localStorage.setItem(CLAVE_CACHE, String(stats.hackers))
      } catch {
        /* sin almacenamiento, igual se muestra el valor */
      }
    } catch {
      // Un fallo de red no debe ensuciar la consola del flujo feliz ni romper
      // el home: se mantiene el último valor conocido y se reintenta solo.
    }
  }, [])

  useEffect(() => {
    consultar()
    const id = setInterval(consultar, 30000)
    return () => clearInterval(id)
  }, [consultar])

  return (
    <div className="text-center space-y-2">
      <div className="text-4xl font-bold">
        <GradientText gradient="from-green-400 to-cyan-400">
          <AnimatedCounter end={conteo} />
        </GradientText>
      </div>
      <div className="text-gray-400 text-sm uppercase tracking-wider">Hackers Registrados</div>
    </div>
  )
}
