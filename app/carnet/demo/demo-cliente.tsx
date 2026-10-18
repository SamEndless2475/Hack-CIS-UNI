"use client"

import { useState } from "react"

import BadgeView from "@/components/badge/badge-view"

export default function DemoCliente() {
  const [nombre, setNombre] = useState("Kevin Pinto")
  const [rol, setRol] = useState("Full Stack Developer")
  const [universidad, setUniversidad] = useState("UNI")
  const [numero, setNumero] = useState(7)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-amber-500/10 px-6 py-3 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-400">
          Vista de prueba — solo en desarrollo
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo etiqueta="Rol">
            <input value={rol} onChange={(e) => setRol(e.target.value)} className={CLASE_INPUT} />
          </Campo>
          <Campo etiqueta="Universidad">
            <input
              value={universidad}
              onChange={(e) => setUniversidad(e.target.value)}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo etiqueta="Número">
            <input
              type="number"
              value={numero}
              onChange={(e) => setNumero(Number(e.target.value) || 1)}
              className={CLASE_INPUT}
            />
          </Campo>
        </div>

        <BadgeView
          nombre={nombre}
          rol={rol}
          universidad={universidad}
          numero={numero}
          qrValor="https://hackcis.uni.pe/checkin/demo-token"
          fotoUrl={fotoUrl}
          onCambiarFoto={async (archivo) => {
            // En la demo no se sube nada: solo se previsualiza en local.
            setFotoUrl((anterior) => {
              if (anterior?.startsWith("blob:")) URL.revokeObjectURL(anterior)
              return URL.createObjectURL(archivo)
            })
          }}
        />
      </div>
    </div>
  )
}

const CLASE_INPUT =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white focus:border-white/40 focus:outline-none"

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block font-mono text-xs uppercase tracking-widest text-white/50">
        {etiqueta}
      </span>
      {children}
    </label>
  )
}
