"use client"

/**
 * Vista completa del carnet: el 3D colgado arriba, y abajo la versión plana
 * lista para compartir, igual que la referencia de hacktheandes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Download, Loader2, RefreshCw, Share2 } from "lucide-react"

import {
  cargarImagen,
  dibujarCarnet,
  generarPngCarnet,
  type DatosCarnet,
} from "@/lib/badge-canvas"
import { useToast } from "@/hooks/use-toast"

// El motor de física pesa: no tiene por qué estar en el bundle inicial ni
// correr en el servidor (usa window y WebGL).
const LanyardBadge = dynamic(() => import("./lanyard-badge"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-white/40" />
    </div>
  ),
})

export interface BadgeViewProps {
  nombre: string
  rol: string
  universidad: string
  numero: number
  qrValor: string
  fotoUrl?: string | null
  /** Si se pasa, aparece el botón "cambiar foto". */
  onCambiarFoto?: (archivo: File) => Promise<void> | void
}

export default function BadgeView({
  nombre,
  rol,
  universidad,
  numero,
  qrValor,
  fotoUrl,
  onCambiarFoto,
}: BadgeViewProps) {
  const { toast } = useToast()
  const lienzoPlano = useRef<HTMLCanvasElement>(null)
  const inputArchivo = useRef<HTMLInputElement>(null)

  const [foto, setFoto] = useState<HTMLImageElement | null>(null)
  const [cargandoFoto, setCargandoFoto] = useState(false)
  const [descargando, setDescargando] = useState(false)

  // Carga la foto una vez y la reusa para el 3D y para el PNG.
  useEffect(() => {
    if (!fotoUrl) {
      setFoto(null)
      return
    }

    let vigente = true
    setCargandoFoto(true)

    cargarImagen(fotoUrl)
      .then((imagen) => {
        if (vigente) setFoto(imagen)
      })
      .catch(() => {
        if (vigente) {
          setFoto(null)
          toast({
            title: "No se pudo cargar tu foto",
            description: "El carnet se genera igual, pero sin foto.",
            variant: "destructive",
          })
        }
      })
      .finally(() => {
        if (vigente) setCargandoFoto(false)
      })

    return () => {
      vigente = false
    }
  }, [fotoUrl, toast])

  const datos: DatosCarnet = useMemo(
    () => ({ nombre, rol, universidad, numero, qrValor, foto }),
    [nombre, rol, universidad, numero, qrValor, foto]
  )

  // Dibuja la versión plana de abajo.
  useEffect(() => {
    if (!lienzoPlano.current) return
    dibujarCarnet(lienzoPlano.current, datos, 1).catch((error) => {
      console.error("No se pudo dibujar la vista plana:", error)
    })
  }, [datos])

  const descargar = useCallback(async () => {
    setDescargando(true)
    try {
      const blob = await generarPngCarnet(datos, 2)
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement("a")
      enlace.href = url
      enlace.download = `carnet-hackcis-${nombre.trim().toLowerCase().replace(/\s+/g, "-") || "hacker"}.png`
      document.body.appendChild(enlace)
      enlace.click()
      document.body.removeChild(enlace)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "No se pudo descargar el carnet",
        description: error instanceof Error ? error.message : "Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setDescargando(false)
    }
  }, [datos, nombre, toast])

  const compartir = useCallback(async () => {
    try {
      const blob = await generarPngCarnet(datos, 2)
      const archivo = new File([blob], "carnet-hackcis.png", { type: "image/png" })

      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({
          files: [archivo],
          title: "Mi carnet de Hack[CIS] UNI 2026",
          text: "¡Ya estoy dentro de Hack[CIS] UNI 2026! 🚀",
        })
      } else {
        // En escritorio casi nunca hay share con archivos: cae a descargar.
        await descargar()
      }
    } catch (error) {
      // El usuario cancelando el diálogo no es un error que haya que mostrar.
      if (error instanceof Error && error.name === "AbortError") return
      toast({
        title: "No se pudo compartir",
        description: "Descarga el carnet y súbelo a mano.",
        variant: "destructive",
      })
    }
  }, [datos, descargar, toast])

  const elegirFoto = useCallback(
    async (evento: React.ChangeEvent<HTMLInputElement>) => {
      const archivo = evento.target.files?.[0]
      // Permite volver a elegir el mismo archivo después de cancelar.
      evento.target.value = ""
      if (!archivo || !onCambiarFoto) return

      if (!archivo.type.startsWith("image/")) {
        toast({
          title: "Archivo no válido",
          description: "Sube una imagen (JPG, PNG o WebP).",
          variant: "destructive",
        })
        return
      }

      if (archivo.size > 5 * 1024 * 1024) {
        toast({
          title: "La foto pesa demasiado",
          description: "El límite es 5 MB.",
          variant: "destructive",
        })
        return
      }

      setCargandoFoto(true)
      try {
        await onCambiarFoto(archivo)
      } catch (error) {
        toast({
          title: "No se pudo subir la foto",
          description: error instanceof Error ? error.message : "Intenta de nuevo.",
          variant: "destructive",
        })
      } finally {
        setCargandoFoto(false)
      }
    },
    [onCambiarFoto, toast]
  )

  return (
    <div className="flex flex-col items-center">
      {/* Carnet colgado, arrastrable */}
      <div className="h-[70vh] min-h-[420px] w-full touch-none select-none">
        <LanyardBadge datos={datos} className="h-full w-full" />
      </div>

      <p className="-mt-2 text-center font-mono text-xs uppercase tracking-widest text-white/40">
        Arrástralo
      </p>

      {onCambiarFoto && (
        <>
          <input
            ref={inputArchivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={elegirFoto}
          />
          <button
            type="button"
            onClick={() => inputArchivo.current?.click()}
            disabled={cargandoFoto}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-mono text-sm uppercase tracking-widest text-white transition-colors hover:border-white/50 hover:bg-white/5 disabled:opacity-50"
          >
            {cargandoFoto ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Cambiar foto
          </button>
        </>
      )}

      <div className="mt-10 h-px w-full max-w-md bg-white/10" />

      {/* Versión plana para compartir */}
      <p className="mt-10 text-center font-mono text-sm text-white/60">
        Tu carnet para compartir está listo.
      </p>

      <canvas
        ref={lienzoPlano}
        className="mt-6 w-52 max-w-full rounded-xl border border-white/10 shadow-2xl sm:w-60"
        // El canvas se dibuja a 1024x1434; el CSS lo escala sin perder nitidez.
        style={{ aspectRatio: "1024 / 1434" }}
      />

      <div className="mb-16 mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={descargar}
          disabled={descargando}
          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-mono text-sm uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {descargando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar
        </button>

        <button
          type="button"
          onClick={compartir}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-3 font-mono text-sm uppercase tracking-widest text-white transition-colors hover:border-white/50 hover:bg-white/5"
        >
          <Share2 className="h-4 w-4" />
          Compartir
        </button>
      </div>
    </div>
  )
}
