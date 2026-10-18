// Verifica contra la base real que las migraciones quedaron bien aplicadas.
// Usa la clave anon, o sea exactamente los mismos permisos que tendrá el navegador.

import fs from "node:fs"

const RUTA_ENV = process.argv[2]
const env = Object.fromEntries(
  fs
    .readFileSync(RUTA_ENV, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!URL || !KEY) {
  console.error("Faltan variables de Supabase")
  process.exit(1)
}

const cabeceras = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
}

let fallos = 0

async function rest(ruta, opciones = {}) {
  const res = await fetch(`${URL}/rest/v1/${ruta}`, { ...opciones, headers: cabeceras })
  const texto = await res.text()
  let cuerpo
  try {
    cuerpo = JSON.parse(texto)
  } catch {
    cuerpo = texto
  }
  return { estado: res.status, cuerpo, headers: res.headers }
}

async function rpc(nombre, args = {}) {
  return rest(`rpc/${nombre}`, { method: "POST", body: JSON.stringify(args) })
}

function comprobar(etiqueta, condicion, detalle) {
  const marca = condicion ? "OK  " : "FALLA"
  if (!condicion) fallos++
  console.log(`${marca} ${etiqueta}${detalle !== undefined ? ` → ${detalle}` : ""}`)
}

async function contar(tabla, filtro = "") {
  const res = await rest(`${tabla}?select=*${filtro}`, {
    method: "HEAD",
    headers: { ...cabeceras, Prefer: "count=exact" },
  })
  const rango = res.headers.get("content-range")
  return rango ? Number(rango.split("/")[1]) : null
}

console.log("=== CATÁLOGOS (lectura pública) ===")

const instituciones = await rest("institutions?select=id&limit=1000")
comprobar(
  "institutions legibles sin sesión",
  Array.isArray(instituciones.cuerpo),
  Array.isArray(instituciones.cuerpo) ? `${instituciones.cuerpo.length} filas` : JSON.stringify(instituciones.cuerpo)
)

const elegibles = await rest("institutions?select=id&is_eligible=eq.true&limit=1000")
comprobar(
  "universidades habilitadas = 104",
  Array.isArray(elegibles.cuerpo) && elegibles.cuerpo.length === 104,
  Array.isArray(elegibles.cuerpo) ? elegibles.cuerpo.length : JSON.stringify(elegibles.cuerpo)
)

const dominios = await rest("university_domains?select=domain&limit=1000")
comprobar(
  "dominios = 113",
  Array.isArray(dominios.cuerpo) && dominios.cuerpo.length === 113,
  Array.isArray(dominios.cuerpo) ? dominios.cuerpo.length : JSON.stringify(dominios.cuerpo)
)

const especialidades = await rest("expertises?select=name")
comprobar(
  "especialidades = 10",
  Array.isArray(especialidades.cuerpo) && especialidades.cuerpo.length === 10,
  Array.isArray(especialidades.cuerpo) ? especialidades.cuerpo.length : JSON.stringify(especialidades.cuerpo)
)

console.log("\n=== FILTRO DE CORREO (lo que decide quién entra) ===")

const casos = [
  ["kevin.pinto.a@uni.pe", true, "UNI"],
  ["ALGUIEN@UNI.EDU.PE", true, "mayúsculas + dominio alterno"],
  ["  espacios@pucp.edu.pe  ", true, "con espacios alrededor"],
  ["alumno@ucvvirtual.edu.pe", true, "dominio de alumnos UCV"],
  ["test@unmsm.edu.pe", true, "San Marcos"],
  ["kevin@gmail.com", false, "gmail"],
  ["kevin@hotmail.com", false, "hotmail"],
  ["kevin@outlook.com", false, "outlook"],
  ["alguien@tecsup.edu.pe", false, "instituto (excluido a propósito)"],
  ["alguien@senati.pe", false, "instituto"],
  ["alguien@universidad-falsa.edu.pe", false, "dominio inventado"],
  ["sinarroba", false, "texto sin @"],
  ["", false, "vacío"],
]

for (const [correo, esperado, nota] of casos) {
  const r = await rpc("is_institutional_email", { p_email: correo })
  const obtenido = r.cuerpo
  comprobar(
    `${esperado ? "acepta" : "rechaza"} ${JSON.stringify(correo)} (${nota})`,
    obtenido === esperado,
    obtenido === esperado ? "" : `devolvió ${JSON.stringify(obtenido)} (estado ${r.estado})`
  )
}

console.log("\n=== RESOLUCIÓN DE UNIVERSIDAD DESDE EL CORREO ===")

const resuelve = await rpc("institution_for_email", { p_email: "kevin.pinto.a@uni.pe" })
const fila = Array.isArray(resuelve.cuerpo) ? resuelve.cuerpo[0] : null
comprobar(
  "uni.pe resuelve a la UNI",
  fila?.institution_name?.includes("Ingeniería"),
  fila ? `${fila.institution_name} (${fila.short_name})` : JSON.stringify(resuelve.cuerpo)
)

const resuelveNada = await rpc("institution_for_email", { p_email: "kevin@gmail.com" })
comprobar(
  "gmail no resuelve a ninguna",
  Array.isArray(resuelveNada.cuerpo) && resuelveNada.cuerpo.length === 0,
  JSON.stringify(resuelveNada.cuerpo)
)

console.log("\n=== MÉTRICAS PÚBLICAS (contador del home) ===")

const stats = await rpc("get_public_stats")
const s = Array.isArray(stats.cuerpo) ? stats.cuerpo[0] : null
comprobar(
  "get_public_stats responde a anónimo",
  s && typeof s.hackers === "number",
  s ? `hackers=${s.hackers} teams=${s.teams} universidades=${s.universities} proyectos=${s.projects_submitted}` : JSON.stringify(stats.cuerpo)
)

const equipos = await rpc("get_public_teams")
comprobar(
  "get_public_teams responde a anónimo",
  Array.isArray(equipos.cuerpo),
  Array.isArray(equipos.cuerpo) ? `${equipos.cuerpo.length} equipos` : JSON.stringify(equipos.cuerpo)
)

console.log("\n=== SEGURIDAD: RLS debe bloquear lo privado ===")

const hackers = await rest("hackers?select=email")
comprobar(
  "anónimo NO puede leer hackers",
  Array.isArray(hackers.cuerpo) && hackers.cuerpo.length === 0,
  Array.isArray(hackers.cuerpo) ? `devolvió ${hackers.cuerpo.length} filas` : JSON.stringify(hackers.cuerpo)
)

const insertarHacker = await rest("hackers", {
  method: "POST",
  body: JSON.stringify({ email: "intruso@uni.pe" }),
})
comprobar(
  "anónimo NO puede insertar hackers",
  insertarHacker.estado >= 400,
  `estado ${insertarHacker.estado}`
)

const staff = await rest("staff?select=email")
comprobar(
  "anónimo NO puede leer staff",
  Array.isArray(staff.cuerpo) && staff.cuerpo.length === 0,
  Array.isArray(staff.cuerpo) ? `devolvió ${staff.cuerpo.length} filas` : JSON.stringify(staff.cuerpo)
)

const sponsorsLeer = await rest("sponsors?select=email")
comprobar(
  "anónimo NO puede leer sponsors",
  Array.isArray(sponsorsLeer.cuerpo) && sponsorsLeer.cuerpo.length === 0,
  Array.isArray(sponsorsLeer.cuerpo) ? `devolvió ${sponsorsLeer.cuerpo.length} filas` : JSON.stringify(sponsorsLeer.cuerpo)
)

console.log("\n=== STORAGE ===")

// Listar buckets requiere sesión, así que con la clave anon siempre devuelve [].
// Para saber si el bucket existe se pide un objeto que no existe dentro de él:
//   - bucket existe  → "Object not found" / NoSuchKey
//   - bucket no existe → "Bucket not found" / NoSuchBucket
async function bucketExiste(nombre) {
  const res = await fetch(`${URL}/storage/v1/object/public/${nombre}/__sonda__.png`, {
    headers: cabeceras,
  })
  const cuerpo = await res.json().catch(() => ({}))
  return cuerpo.code === "NoSuchKey"
}

comprobar("bucket badge-photos existe", await bucketExiste("badge-photos"))
comprobar(
  "la sonda distingue un bucket inexistente",
  (await bucketExiste("bucket-que-no-existe")) === false
)

console.log(`\n${"=".repeat(50)}`)
console.log(fallos === 0 ? "TODO OK" : `${fallos} COMPROBACIONES FALLARON`)
process.exit(fallos === 0 ? 0 : 1)
