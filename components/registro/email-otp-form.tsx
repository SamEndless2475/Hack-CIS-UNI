"use client"

/**
 * Registro en dos pasos: correo institucional → código de 6 dígitos.
 *
 * No pedimos DNI ni contraseña. La identidad es el correo universitario, y
 * verificarlo con un código prueba a la vez que existe y que es de esa persona.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowRight, Loader2, Mail } from "lucide-react"

import {
  enviarCodigo,
  normalizarCorreo,
  verificarCodigo,
  verificarCorreoInstitucional,
} from "@/lib/api-registro"
import { useToast } from "@/hooks/use-toast"

type Paso = "correo" | "codigo"

const SEGUNDOS_REENVIO = 60

/**
 * El código vive 1 hora, pero el estado del formulario se pierde al recargar.
 * Sin esto, quien cierra la pestaña tiene que pedir otro código, y como el
 * límite de envíos de Supabase es bajo, se queda bloqueado un rato. Guardamos
 * el correo pendiente para poder retomar el paso del código.
 */
const CLAVE_PENDIENTE = "hackcis:registro-pendiente"

function leerPendiente(): { correo: string; universidad: string | null } | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_PENDIENTE)
    if (!crudo) return null
    const dato = JSON.parse(crudo)
    return typeof dato?.correo === "string" ? dato : null
  } catch {
    // Modo incógnito o almacenamiento bloqueado: seguimos sin retomar nada.
    return null
  }
}

function guardarPendiente(correo: string, universidad: string | null) {
  try {
    sessionStorage.setItem(CLAVE_PENDIENTE, JSON.stringify({ correo, universidad }))
  } catch {
    /* sin almacenamiento, el formulario igual funciona */
  }
}

function olvidarPendiente() {
  try {
    sessionStorage.removeItem(CLAVE_PENDIENTE)
  } catch {
    /* nada que limpiar */
  }
}

export default function EmailOtpForm({
  siguiente = "/panel",
  errorInicial = null,
}: {
  siguiente?: string
  /** Error que viene del enlace del correo (lo pasa /auth/callback). */
  errorInicial?: string | null
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [paso, setPaso] = useState<Paso>("correo")
  const [correo, setCorreo] = useState("")
  const [universidad, setUniversidad] = useState<string | null>(null)
  const [codigo, setCodigo] = useState("")
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(errorInicial)
  const [esperaReenvio, setEsperaReenvio] = useState(0)

  const inputCodigo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (esperaReenvio <= 0) return
    const id = setInterval(() => setEsperaReenvio((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [esperaReenvio])

  useEffect(() => {
    if (paso === "codigo") inputCodigo.current?.focus()
  }, [paso])

  // Si ya se pidió un código antes de recargar, retomamos ese paso en vez de
  // obligar a pedir otro.
  useEffect(() => {
    const pendiente = leerPendiente()
    if (!pendiente) return
    setCorreo(pendiente.correo)
    setUniversidad(pendiente.universidad)
    setPaso("codigo")
  }, [])

  const pedirCodigo = useCallback(
    async (evento?: React.FormEvent) => {
      evento?.preventDefault()
      setError(null)

      const limpio = normalizarCorreo(correo)
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(limpio)) {
        setError("Escribe un correo válido.")
        return
      }

      setCargando(true)
      try {
        // 1. ¿Es de una universidad habilitada?
        const { esInstitucional, institucion } = await verificarCorreoInstitucional(limpio)

        if (!esInstitucional) {
          setError(
            "Ese correo no es de una universidad registrada. Usa el correo que te dio tu universidad " +
              "(por ejemplo @uni.pe), no un Gmail o Hotmail."
          )
          return
        }

        // 2. Mandar el código.
        await enviarCodigo(limpio)
        setUniversidad(institucion?.nombre ?? null)
        setPaso("codigo")
        setEsperaReenvio(SEGUNDOS_REENVIO)
        guardarPendiente(limpio, institucion?.nombre ?? null)

        toast({
          title: "Código enviado",
          description: `Revisa ${limpio}. Llega en menos de un minuto.`,
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo enviar el código.")
      } finally {
        setCargando(false)
      }
    },
    [correo, toast]
  )

  const confirmarCodigo = useCallback(
    async (evento?: React.FormEvent) => {
      evento?.preventDefault()
      setError(null)

      if (codigo.trim().length !== 6) {
        setError("El código tiene 6 dígitos.")
        return
      }

      setCargando(true)
      try {
        await verificarCodigo(correo, codigo)
        olvidarPendiente()
        toast({
          title: "¡Correo verificado!",
          description: "Ahora completa tu perfil para generar tu carnet.",
        })
        router.push(siguiente)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo verificar el código.")
      } finally {
        setCargando(false)
      }
    },
    [codigo, correo, router, siguiente, toast]
  )

  return (
    <div className="w-full max-w-md">
      {paso === "correo" ? (
        <form onSubmit={pedirCodigo} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="correo"
              className="block font-mono text-xs uppercase tracking-widest text-white/50"
            >
              Correo universitario
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                id="correo"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value)
                  setError(null)
                }}
                placeholder="tu.nombre@uni.pe"
                className="w-full rounded-xl border border-white/15 bg-white/5 py-4 pl-11 pr-4 text-white placeholder:text-white/25 focus:border-white/40 focus:outline-none"
              />
            </div>
            <p className="font-mono text-xs text-white/35">
              Solo se aceptan correos de universidades peruanas.
            </p>
          </div>

          {error && <Aviso>{error}</Aviso>}

          <button
            type="submit"
            disabled={cargando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-mono text-sm uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Enviar código
          </button>
        </form>
      ) : (
        <form onSubmit={confirmarCodigo} className="space-y-6">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-white/50">
              Código enviado a
            </p>
            <p className="break-all font-mono text-sm text-white">{normalizarCorreo(correo)}</p>
            {universidad && (
              <p className="font-mono text-xs text-white/40">{universidad}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="codigo"
              className="block font-mono text-xs uppercase tracking-widest text-white/50"
            >
              Código de 6 dígitos
            </label>
            <input
              id="codigo"
              ref={inputCodigo}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => {
                // Solo dígitos: pegar desde el correo suele traer espacios.
                setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
                setError(null)
              }}
              placeholder="000000"
              className="w-full rounded-xl border border-white/15 bg-white/5 py-4 text-center font-mono text-3xl tracking-[0.5em] text-white placeholder:text-white/20 focus:border-white/40 focus:outline-none"
            />
          </div>

          {error && <Aviso>{error}</Aviso>}

          <button
            type="submit"
            disabled={cargando || codigo.length !== 6}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-mono text-sm uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Verificar
          </button>

          <div className="flex items-center justify-between font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setPaso("correo")
                setCodigo("")
                setError(null)
                olvidarPendiente()
              }}
              className="text-white/40 underline-offset-4 hover:text-white hover:underline"
            >
              Cambiar correo
            </button>

            <button
              type="button"
              onClick={() => pedirCodigo()}
              disabled={esperaReenvio > 0 || cargando}
              className="text-white/40 underline-offset-4 hover:text-white hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            >
              {esperaReenvio > 0 ? `Reenviar en ${esperaReenvio}s` : "Reenviar código"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
      <p className="text-sm leading-relaxed text-red-200">{children}</p>
    </div>
  )
}
