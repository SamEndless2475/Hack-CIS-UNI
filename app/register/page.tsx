"use client"

/**
 * Registro de Hack[CIS] UNI 2026.
 *
 * Reemplaza al wizard anterior, que mandaba todos los datos de golpe a un
 * backend externo. Ahora son dos momentos:
 *   1. aquí: verificar que el correo universitario es real (código de 6 dígitos)
 *   2. en /panel: completar el resto del perfil y generar el carnet
 *
 * El wizard viejo sigue en el historial de git si hace falta mirarlo.
 */

import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import EmailOtpForm from "@/components/registro/email-otp-form"
import GridBackground from "@/components/grid-background"
import { isSupabaseConfigured } from "@/lib/supabase/client"

function Contenido() {
  const parametros = useSearchParams()
  const siguiente = parametros.get("next") || "/panel"
  const errorDelEnlace = parametros.get("error")

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-400">
          Falta configuración
        </p>
        <p className="mt-3 text-sm leading-relaxed text-amber-100">
          El registro necesita <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en el archivo{" "}
          <code className="font-mono">.env.local</code>. Están en Supabase → Project Settings → API.
        </p>
      </div>
    )
  }

  return <EmailOtpForm siguiente={siguiente} errorInicial={errorDelEnlace} />
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <GridBackground />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/Logo-cis.webp"
            alt="Hack CIS"
            width={140}
            height={48}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-xl flex-col items-center justify-center px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Regístrate</h1>
          <p className="mt-4 text-balance text-white/50">
            Verifica tu correo universitario y completa tu perfil. Al terminar recibes tu carnet
            de participante.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          }
        >
          <Contenido />
        </Suspense>
      </main>
    </div>
  )
}
