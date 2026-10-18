import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Refresca la sesión de Supabase en cada navegación y protege /panel.
 *
 * Si no hay variables de Supabase configuradas, el middleware no hace nada:
 * así el sitio sigue levantando en local aunque falte el .env.local.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // getUser() revalida el token contra Supabase. No usar getSession() aquí:
  // lee la cookie sin verificarla, así que se puede falsificar.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPanel = request.nextUrl.pathname.startsWith("/panel")

  if (isPanel && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/register"
    redirectUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Todo menos archivos estáticos e imágenes. Sin esto, el middleware
     * correría también para cada .png y gastaría llamadas de auth.
     */
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
