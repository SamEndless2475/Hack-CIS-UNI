"use client"

/**
 * Único punto de contacto entre el registro y la base de datos.
 *
 * Regla del equipo (docs/tasks/contratos-api.md): ningún componente llama a la
 * base directamente. Todo pasa por funciones de `lib/`, así cambiar de backend
 * es tocar un solo archivo.
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type {
  Expertise,
  Hacker,
  HackerProfileInput,
  Institution,
  PublicStats,
} from "@/lib/supabase/types"

export interface ResultadoCorreo {
  esInstitucional: boolean
  institucion: { id: string; nombre: string; siglas: string | null } | null
}

/** Normaliza el correo tal como lo hace la base: minúsculas y sin espacios. */
export function normalizarCorreo(email: string) {
  return email.trim().toLowerCase()
}

export function dominioDe(email: string) {
  return normalizarCorreo(email).split("@")[1] ?? ""
}

/**
 * Pregunta a la base si el correo pertenece a una universidad habilitada.
 *
 * La validación real vive en la base de datos (trigger
 * `hackers_enforce_institutional_email`). Esta llamada solo sirve para avisarle
 * al usuario antes de mandarle el código, no es la que protege nada.
 */
export async function verificarCorreoInstitucional(email: string): Promise<ResultadoCorreo> {
  const supabase = getSupabaseBrowserClient()
  const correo = normalizarCorreo(email)

  const { data: esInstitucional, error } = await supabase.rpc("is_institutional_email", {
    p_email: correo,
  })

  if (error) throw new Error(`No se pudo validar el correo: ${error.message}`)
  if (!esInstitucional) return { esInstitucional: false, institucion: null }

  const { data: filas, error: errorInstitucion } = await supabase.rpc(
    "institution_for_email",
    { p_email: correo }
  )

  if (errorInstitucion) throw new Error(`No se pudo identificar la universidad: ${errorInstitucion.message}`)

  const fila = filas?.[0]
  return {
    esInstitucional: true,
    institucion: fila
      ? { id: fila.institution_id, nombre: fila.institution_name, siglas: fila.short_name }
      : null,
  }
}

/** Envía el código de 6 dígitos al correo. */
export async function enviarCodigo(email: string) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizarCorreo(email),
    options: {
      shouldCreateUser: true,
      // Si la plantilla de correo manda un enlace en vez del código, el enlace
      // tiene que aterrizar en nuestro callback para canjear la sesión.
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    // Supabase devuelve 429 cuando se pide otro código demasiado pronto.
    if (error.status === 429) {
      throw new Error("Pediste un código hace muy poco. Espera un minuto y vuelve a intentar.")
    }
    throw new Error(error.message)
  }
}

/**
 * Verifica el código y deja la sesión iniciada.
 * Devuelve la fila del hacker, creándola si es su primer ingreso.
 */
export async function verificarCodigo(email: string, codigo: string): Promise<Hacker> {
  const supabase = getSupabaseBrowserClient()
  const correo = normalizarCorreo(email)

  const { data, error } = await supabase.auth.verifyOtp({
    email: correo,
    token: codigo.trim(),
    type: "email",
  })

  if (error) {
    if (error.status === 403 || /expired|invalid/i.test(error.message)) {
      throw new Error("El código no es válido o ya venció. Pide uno nuevo.")
    }
    throw new Error(error.message)
  }

  const usuario = data.user
  if (!usuario) throw new Error("No se pudo iniciar sesión. Intenta de nuevo.")

  return asegurarHacker(usuario.id, correo)
}

/**
 * Crea la fila del hacker si no existe. Idempotente: si el hacker ya estaba,
 * devuelve su fila sin tocar nada.
 */
export async function asegurarHacker(authUserId: string, email: string): Promise<Hacker> {
  const supabase = getSupabaseBrowserClient()
  const correo = normalizarCorreo(email)

  const { data: existente, error: errorLectura } = await supabase
    .from("hackers")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle()

  if (errorLectura) throw new Error(errorLectura.message)
  if (existente) return existente

  const { institucion } = await verificarCorreoInstitucional(correo)

  const { data: creado, error: errorInsert } = await supabase
    .from("hackers")
    .insert({
      auth_user_id: authUserId,
      email: correo,
      institution_id: institucion?.id ?? null,
    })
    .select("*")
    .single()

  if (errorInsert) {
    // 23514 = el trigger rechazó el dominio del correo.
    if (errorInsert.code === "23514") {
      throw new Error("Ese correo no pertenece a una universidad habilitada.")
    }
    throw new Error(errorInsert.message)
  }

  return creado
}

/** Fila del hacker que tiene la sesión abierta, o null si no hay sesión. */
export async function obtenerHackerActual(): Promise<Hacker | null> {
  const supabase = getSupabaseBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("hackers")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Igual que obtenerHackerActual, pero si hay sesión y todavía no existe la fila
 * del hacker, la crea.
 *
 * Hace falta porque hay dos formas de iniciar sesión: con el código (que ya crea
 * la fila) y con el enlace del correo (que solo crea la sesión). Sin esto, quien
 * entra por el enlace llega al panel sin fila y lo rebotaría a /register en bucle.
 */
export async function obtenerOCrearHackerActual(): Promise<Hacker | null> {
  const supabase = getSupabaseBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return null

  const existente = await obtenerHackerActual()
  if (existente) return existente

  return asegurarHacker(user.id, user.email)
}

/** Guarda el perfil desde el panel y marca el registro como completo. */
export async function guardarPerfil(
  hackerId: string,
  perfil: Partial<HackerProfileInput>,
  { marcarCompleto = false }: { marcarCompleto?: boolean } = {}
): Promise<Hacker> {
  const supabase = getSupabaseBrowserClient()

  const cambios: Partial<Hacker> = { ...perfil }
  if (marcarCompleto) cambios.profile_completed_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("hackers")
    .update(cambios)
    .eq("id", hackerId)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function cerrarSesion() {
  await getSupabaseBrowserClient().auth.signOut()
}

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export async function listarUniversidades(busqueda = ""): Promise<Institution[]> {
  const supabase = getSupabaseBrowserClient()

  let consulta = supabase
    .from("institutions")
    .select("*")
    .eq("is_eligible", true)
    .order("name")
    .limit(50)

  if (busqueda.trim()) consulta = consulta.ilike("name", `%${busqueda.trim()}%`)

  const { data, error } = await consulta
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listarEspecialidades(): Promise<Expertise[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("expertises")
    .select("*")
    .order("name")

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Métricas públicas del home. No requiere sesión. */
export async function obtenerEstadisticas(): Promise<PublicStats | null> {
  const { data, error } = await getSupabaseBrowserClient().rpc("get_public_stats")
  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}

// ---------------------------------------------------------------------------
// Patrocinadores
// ---------------------------------------------------------------------------

export interface DatosPatrocinador {
  company_name: string
  contact_name: string
  contact_lastname?: string
  email: string
  phone?: string
  plan?: string
  linkedin?: string
  instagram?: string
  facebook?: string
}

/** Guarda una postulación de patrocinio. No requiere sesión. */
export async function registrarPatrocinador(datos: DatosPatrocinador): Promise<void> {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.from("sponsors").insert({
    ...datos,
    email: normalizarCorreo(datos.email),
  })

  if (error) {
    // 23505 = ya existe una postulación con ese correo y ese plan.
    if (error.code === "23505") {
      throw new Error("Ya recibimos una postulación con ese correo para ese plan.")
    }
    throw new Error(error.message)
  }
}

// ---------------------------------------------------------------------------
// Foto del carnet
// ---------------------------------------------------------------------------

const BUCKET_FOTOS = "badge-photos"

/** Sube la foto del carnet y devuelve su URL pública. */
export async function subirFotoCarnet(hackerId: string, archivo: File): Promise<string> {
  const supabase = getSupabaseBrowserClient()

  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg"
  const ruta = `${hackerId}/carnet.${extension}`

  const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(ruta, archivo, {
    cacheControl: "3600",
    upsert: true,
    contentType: archivo.type || "image/jpeg",
  })

  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`)

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta)

  // El parámetro evita que el navegador siga mostrando la foto anterior en caché.
  return `${publicUrl}?v=${Date.now()}`
}
