import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "./types"

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * Lee y escribe la sesión en cookies, así que el usuario sigue autenticado
 * entre navegaciones del servidor.
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno del servidor."
    )
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Los Server Components no pueden escribir cookies. El middleware se
          // encarga de refrescar la sesión, así que aquí se puede ignorar.
        }
      },
    },
  })
}
