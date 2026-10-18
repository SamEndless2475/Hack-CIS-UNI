import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Aterrizaje de los correos de verificación.
 *
 * Supabase puede mandar dos cosas según cómo esté la plantilla de correo:
 *   - un código de 6 dígitos  → lo escribe el usuario en /register, no pasa por aquí
 *   - un enlace               → cae aquí, y hay que canjearlo por una sesión
 *
 * Soportar las dos hace que el registro funcione sin depender de cómo quedó
 * configurada la plantilla en el dashboard.
 *
 * Formatos de enlace que se aceptan:
 *   /auth/callback?code=...                  (flujo PKCE, el que usa @supabase/ssr)
 *   /auth/callback?token_hash=...&type=email (enlace clásico de verificación)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const siguiente = searchParams.get("next") || "/panel"

  // Supabase avisa de los errores por query string (p. ej. enlace vencido).
  const errorDescripcion = searchParams.get("error_description")
  if (errorDescripcion) {
    return redirigirConError(origin, errorDescripcion)
  }

  if (!code && !tokenHash) {
    return redirigirConError(origin, "El enlace de verificación está incompleto.")
  }

  const supabase = getSupabaseServerClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return redirigirConError(origin, error.message)
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      // Los enlaces de acceso llegan como "magiclink" o "email" según la plantilla.
      type: (type as "magiclink" | "email" | "signup") || "email",
    })
    if (error) return redirigirConError(origin, error.message)
  }

  return NextResponse.redirect(`${origin}${siguiente}`)
}

function redirigirConError(origin: string, mensaje: string) {
  const destino = new URL("/register", origin)
  destino.searchParams.set("error", mensaje)
  return NextResponse.redirect(destino)
}
