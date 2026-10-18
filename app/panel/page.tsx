"use client"

/**
 * Panel del hacker: completa su perfil y ve su carnet.
 *
 * El middleware ya garantiza que hay sesión antes de llegar aquí, pero igual se
 * vuelve a comprobar: el middleware puede estar apagado si faltan las variables
 * de entorno.
 */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, LogOut } from "lucide-react"

import BadgeView from "@/components/badge/badge-view"
import PerfilForm from "@/components/registro/perfil-form"
import {
  cerrarSesion,
  guardarPerfil,
  listarUniversidades,
  obtenerOCrearHackerActual,
  subirFotoCarnet,
} from "@/lib/api-registro"
import type { Hacker, Institution } from "@/lib/supabase/types"
import { useToast } from "@/hooks/use-toast"

type Pestana = "perfil" | "carnet"

export default function PanelPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [hacker, setHacker] = useState<Hacker | null>(null)
  const [universidades, setUniversidades] = useState<Institution[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pestana, setPestana] = useState<Pestana>("perfil")

  useEffect(() => {
    let vigente = true

    Promise.all([obtenerOCrearHackerActual(), listarUniversidades()])
      .then(([h, u]) => {
        if (!vigente) return
        if (!h) {
          router.replace("/register")
          return
        }
        setHacker(h)
        setUniversidades(u)
        // Si ya completó el perfil, lo primero que quiere ver es su carnet.
        if (h.profile_completed_at) setPestana("carnet")
      })
      .catch((e) => {
        if (vigente) setError(e instanceof Error ? e.message : "No se pudo cargar tu perfil.")
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [router])

  const cambiarFoto = useCallback(
    async (archivo: File) => {
      if (!hacker) return
      const url = await subirFotoCarnet(hacker.id, archivo)
      const actualizado = await guardarPerfil(hacker.id, { photo_url: url })
      setHacker(actualizado)
      toast({ title: "Foto actualizada", description: "Tu carnet ya la está usando." })
    },
    [hacker, toast]
  )

  const salir = useCallback(async () => {
    await cerrarSesion()
    router.push("/")
    router.refresh()
  }, [router])

  if (cargando) {
    return (
      <Marco>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      </Marco>
    )
  }

  if (error) {
    return (
      <Marco>
        <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-200">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 font-mono text-xs uppercase tracking-widest text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            Reintentar
          </button>
        </div>
      </Marco>
    )
  }

  if (!hacker) return null

  const nombreCompleto = [hacker.name, hacker.lastname].filter(Boolean).join(" ")
  const universidad = universidades.find((u) => u.id === hacker.institution_id)

  return (
    <Marco onSalir={salir}>
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {nombreCompleto || "Tu panel"}
        </h1>
        <p className="mt-2 font-mono text-sm text-white/40">{hacker.email}</p>
      </div>

      <div className="mb-10 flex gap-2 border-b border-white/10">
        <Tab activo={pestana === "perfil"} onClick={() => setPestana("perfil")}>
          Mis datos
        </Tab>
        <Tab
          activo={pestana === "carnet"}
          onClick={() => setPestana("carnet")}
          deshabilitado={!hacker.profile_completed_at}
        >
          Mi carnet
        </Tab>
      </div>

      {pestana === "perfil" ? (
        <PerfilForm
          hacker={hacker}
          onGuardado={(actualizado) => {
            setHacker(actualizado)
            setPestana("carnet")
          }}
        />
      ) : (
        <BadgeView
          nombre={nombreCompleto || "Hacker"}
          rol={hacker.badge_role || "Participante"}
          universidad={universidad?.short_name || universidad?.name || ""}
          numero={hacker.badge_number}
          qrValor={`https://hackcis.uni.pe/checkin/${hacker.qr_token}`}
          fotoUrl={hacker.photo_url}
          onCambiarFoto={cambiarFoto}
        />
      )}
    </Marco>
  )
}

function Marco({
  children,
  onSalir,
}: {
  children: React.ReactNode
  onSalir?: () => void
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/Logo-cis.webp"
            alt="Hack CIS"
            width={140}
            height={48}
            className="h-9 w-auto"
          />
        </Link>

        {onSalir && (
          <button
            onClick={onSalir}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        )}
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
    </div>
  )
}

function Tab({
  activo,
  deshabilitado,
  onClick,
  children,
}: {
  activo: boolean
  deshabilitado?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      title={deshabilitado ? "Completa tus datos primero" : undefined}
      className={[
        "-mb-px border-b-2 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors",
        activo
          ? "border-white text-white"
          : "border-transparent text-white/40 hover:text-white/70",
        deshabilitado ? "cursor-not-allowed opacity-40 hover:text-white/40" : "",
      ].join(" ")}
    >
      {children}
    </button>
  )
}
