"use client"

/**
 * Panel donde el hacker completa los datos que faltan después de verificar su
 * correo. Todo lo que se escribe aquí es lo que termina en el carnet.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Loader2, Save } from "lucide-react"

import { guardarPerfil, listarEspecialidades, listarUniversidades } from "@/lib/api-registro"
import type {
  Expertise,
  Hacker,
  HackerLevel,
  HackerProfileInput,
  Institution,
} from "@/lib/supabase/types"
import { useToast } from "@/hooks/use-toast"

const NIVELES: HackerLevel[] = ["Principiante", "Intermedio", "Avanzado", "Experto"]

/** Campos sin los cuales el carnet queda incompleto. */
const OBLIGATORIOS: (keyof HackerProfileInput)[] = [
  "name",
  "lastname",
  "phone",
  "level",
  "institution_id",
  "expertise_id",
  "badge_role",
]

export interface PerfilFormProps {
  hacker: Hacker
  onGuardado?: (hacker: Hacker) => void
}

export default function PerfilForm({ hacker, onGuardado }: PerfilFormProps) {
  const { toast } = useToast()

  const [valores, setValores] = useState<Partial<HackerProfileInput>>({
    name: hacker.name ?? "",
    lastname: hacker.lastname ?? "",
    phone: hacker.phone ?? "",
    linkedin_url: hacker.linkedin_url ?? "",
    github_url: hacker.github_url ?? "",
    discord_username: hacker.discord_username ?? "",
    level: hacker.level,
    institution_id: hacker.institution_id,
    expertise_id: hacker.expertise_id,
    career: hacker.career ?? "",
    study_year: hacker.study_year,
    badge_role: hacker.badge_role ?? "",
  })

  const [universidades, setUniversidades] = useState<Institution[]>([])
  const [especialidades, setEspecialidades] = useState<Expertise[]>([])
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([listarUniversidades(), listarEspecialidades()])
      .then(([u, e]) => {
        setUniversidades(u)
        setEspecialidades(e)
      })
      .catch((error) => {
        toast({
          title: "No se pudieron cargar los catálogos",
          description: error instanceof Error ? error.message : "Recarga la página.",
          variant: "destructive",
        })
      })
  }, [toast])

  const faltantes = useMemo(
    () => OBLIGATORIOS.filter((campo) => !valores[campo]),
    [valores]
  )

  const actualizar = useCallback(
    <K extends keyof HackerProfileInput>(campo: K, valor: HackerProfileInput[K]) => {
      setValores((previo) => ({ ...previo, [campo]: valor }))
      setErrores((previo) => {
        if (!previo[campo as string]) return previo
        const copia = { ...previo }
        delete copia[campo as string]
        return copia
      })
    },
    []
  )

  const validar = useCallback(() => {
    const nuevos: Record<string, string> = {}

    if (!valores.name?.trim()) nuevos.name = "Pon tu nombre."
    if (!valores.lastname?.trim()) nuevos.lastname = "Pon tus apellidos."

    const telefono = valores.phone?.replace(/[\s-]/g, "") ?? ""
    if (!telefono) nuevos.phone = "Pon tu teléfono."
    else if (!/^\+?\d{9,15}$/.test(telefono)) nuevos.phone = "Teléfono inválido (9 a 15 dígitos)."

    if (!valores.level) nuevos.level = "Elige tu nivel."
    if (!valores.institution_id) nuevos.institution_id = "Elige tu universidad."
    if (!valores.expertise_id) nuevos.expertise_id = "Elige tu especialidad."
    if (!valores.badge_role?.trim()) nuevos.badge_role = "Pon lo que irá en tu carnet."

    if (valores.linkedin_url?.trim() && !/^https?:\/\/(www\.)?linkedin\.com\//i.test(valores.linkedin_url)) {
      nuevos.linkedin_url = "Debe empezar con https://linkedin.com/in/"
    }

    if (valores.github_url?.trim() && !/^https?:\/\/(www\.)?github\.com\//i.test(valores.github_url)) {
      nuevos.github_url = "Debe empezar con https://github.com/"
    }

    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }, [valores])

  const enviar = useCallback(
    async (evento: React.FormEvent) => {
      evento.preventDefault()
      if (!validar()) return

      setGuardando(true)
      try {
        // Los campos opcionales vacíos van como null, no como "".
        const limpio: Partial<HackerProfileInput> = {
          ...valores,
          linkedin_url: valores.linkedin_url?.trim() || null,
          github_url: valores.github_url?.trim() || null,
          discord_username: valores.discord_username?.trim() || null,
          career: valores.career?.trim() || null,
          name: valores.name?.trim() || null,
          lastname: valores.lastname?.trim() || null,
          badge_role: valores.badge_role?.trim() || null,
        }

        const actualizado = await guardarPerfil(hacker.id, limpio, { marcarCompleto: true })

        toast({
          title: "Perfil guardado",
          description: "Tu carnet ya está listo.",
        })
        onGuardado?.(actualizado)
      } catch (error) {
        toast({
          title: "No se pudo guardar",
          description: error instanceof Error ? error.message : "Intenta de nuevo.",
          variant: "destructive",
        })
      } finally {
        setGuardando(false)
      }
    },
    [hacker.id, onGuardado, toast, validar, valores]
  )

  return (
    <form onSubmit={enviar} className="space-y-8">
      <Seccion titulo="Tus datos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" error={errores.name} requerido>
            <input
              type="text"
              value={valores.name ?? ""}
              onChange={(e) => actualizar("name", e.target.value)}
              className={claseInput(errores.name)}
              placeholder="Kevin"
            />
          </Campo>

          <Campo etiqueta="Apellidos" error={errores.lastname} requerido>
            <input
              type="text"
              value={valores.lastname ?? ""}
              onChange={(e) => actualizar("lastname", e.target.value)}
              className={claseInput(errores.lastname)}
              placeholder="Pinto"
            />
          </Campo>

          <Campo etiqueta="Teléfono" error={errores.phone} requerido>
            <input
              type="tel"
              inputMode="tel"
              value={valores.phone ?? ""}
              onChange={(e) => actualizar("phone", e.target.value)}
              className={claseInput(errores.phone)}
              placeholder="999888777"
            />
          </Campo>

          <Campo etiqueta="Correo" ayuda="Ya verificado, no se puede cambiar">
            <input
              type="email"
              value={hacker.email}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/40"
            />
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Tu universidad">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Universidad" error={errores.institution_id} requerido>
            <select
              value={valores.institution_id ?? ""}
              onChange={(e) => actualizar("institution_id", e.target.value || null)}
              className={claseInput(errores.institution_id)}
            >
              <option value="">Elige tu universidad</option>
              {universidades.map((u) => (
                <option key={u.id} value={u.id} className="bg-black">
                  {u.name}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Carrera">
            <input
              type="text"
              value={valores.career ?? ""}
              onChange={(e) => actualizar("career", e.target.value)}
              className={claseInput()}
              placeholder="Ingeniería de Sistemas"
            />
          </Campo>

          <Campo etiqueta="Año de estudios">
            <select
              value={valores.study_year ?? ""}
              onChange={(e) =>
                actualizar("study_year", e.target.value ? Number(e.target.value) : null)
              }
              className={claseInput()}
            >
              <option value="">Sin especificar</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((anio) => (
                <option key={anio} value={anio} className="bg-black">
                  {anio}º
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Tu perfil técnico">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nivel" error={errores.level} requerido>
            <select
              value={valores.level ?? ""}
              onChange={(e) => actualizar("level", (e.target.value || null) as HackerLevel | null)}
              className={claseInput(errores.level)}
            >
              <option value="">Elige tu nivel</option>
              {NIVELES.map((nivel) => (
                <option key={nivel} value={nivel} className="bg-black">
                  {nivel}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Especialidad" error={errores.expertise_id} requerido>
            <select
              value={valores.expertise_id ?? ""}
              onChange={(e) => actualizar("expertise_id", e.target.value || null)}
              className={claseInput(errores.expertise_id)}
            >
              <option value="">Elige tu especialidad</option>
              {especialidades.map((e) => (
                <option key={e.id} value={e.id} className="bg-black">
                  {e.name}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="LinkedIn" error={errores.linkedin_url}>
            <input
              type="url"
              value={valores.linkedin_url ?? ""}
              onChange={(e) => actualizar("linkedin_url", e.target.value)}
              className={claseInput(errores.linkedin_url)}
              placeholder="https://linkedin.com/in/tu-perfil"
            />
          </Campo>

          <Campo etiqueta="GitHub" error={errores.github_url}>
            <input
              type="url"
              value={valores.github_url ?? ""}
              onChange={(e) => actualizar("github_url", e.target.value)}
              className={claseInput(errores.github_url)}
              placeholder="https://github.com/tu-usuario"
            />
          </Campo>

          <Campo etiqueta="Usuario de Discord" ayuda="Para el servidor del evento">
            <input
              type="text"
              value={valores.discord_username ?? ""}
              onChange={(e) => actualizar("discord_username", e.target.value)}
              className={claseInput()}
              placeholder="tu_usuario"
            />
          </Campo>
        </div>
      </Seccion>

      <Seccion
        titulo="Tu carnet"
        descripcion="Esto es lo que va a leer la gente en el carnet que compartas."
      >
        <Campo etiqueta="Rol en el carnet" error={errores.badge_role} requerido>
          <input
            type="text"
            value={valores.badge_role ?? ""}
            onChange={(e) => actualizar("badge_role", e.target.value)}
            className={claseInput(errores.badge_role)}
            placeholder="FULL STACK DEVELOPER"
            maxLength={34}
          />
        </Campo>
      </Seccion>

      <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-white/40">
          {faltantes.length === 0 ? (
            <span className="inline-flex items-center gap-2 text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Todo completo
            </span>
          ) : (
            `Faltan ${faltantes.length} campo${faltantes.length === 1 ? "" : "s"} obligatorio${faltantes.length === 1 ? "" : "s"}`
          )}
        </p>

        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3 font-mono text-sm uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
      </div>
    </form>
  )
}

function claseInput(error?: string) {
  return [
    "w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder:text-white/25",
    "focus:outline-none",
    error ? "border-red-500/50 focus:border-red-500" : "border-white/15 focus:border-white/40",
  ].join(" ")
}

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-mono text-xs uppercase tracking-widest text-white/50">{titulo}</h2>
        {descripcion && <p className="mt-1 text-sm text-white/35">{descripcion}</p>}
      </div>
      {children}
    </section>
  )
}

function Campo({
  etiqueta,
  error,
  ayuda,
  requerido,
  children,
}: {
  etiqueta: string
  error?: string
  ayuda?: string
  requerido?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm text-white/70">
        {etiqueta}
        {requerido && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-red-400">{error}</span>
      ) : ayuda ? (
        <span className="block text-xs text-white/30">{ayuda}</span>
      ) : null}
    </label>
  )
}
