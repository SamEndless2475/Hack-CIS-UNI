/**
 * Dibuja el carnet del hacker en un <canvas>.
 *
 * Una sola fuente de verdad para las dos cosas que necesitamos:
 *   1. la textura que se le pega a la tarjeta 3D colgada del cordón, y
 *   2. el PNG que el hacker descarga para compartir.
 *
 * No importa React ni three: es canvas 2D puro, así se puede probar aparte.
 */

import QRCode from "qrcode"

export interface DatosCarnet {
  nombre: string
  rol: string
  universidad: string
  numero: number
  /** Lo que codifica el QR: normalmente la URL de check-in con el qr_token. */
  qrValor: string
  /** Foto ya cargada. Si no hay, se dibuja un marcador de posición. */
  foto?: HTMLImageElement | ImageBitmap | null
  /** Texto chico del pie. */
  dominio?: string
  /** Etiqueta de arriba. */
  etiqueta?: string
}

/** Proporción de la tarjeta (ancho / alto). Vertical, como un carnet real. */
export const RELACION_CARNET = 1024 / 1434

export const ANCHO_BASE = 1024
export const ALTO_BASE = 1434

const TINTA = "#f4f4f5"
const TINTA_SUAVE = "#8a8a93"
const FONDO = "#0a0a0b"

/**
 * Dibuja un rectángulo redondeado. No usamos ctx.roundRect porque no existe en
 * Safari antiguo ni en el canvas de Node, y el carnet tiene que verse igual en
 * todos lados.
 */
function rectRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number
) {
  const r = Math.min(radio, ancho / 2, alto / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + ancho - r, y)
  ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + r)
  ctx.lineTo(x + ancho, y + alto - r)
  ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - r, y + alto)
  ctx.lineTo(x + r, y + alto)
  ctx.quadraticCurveTo(x, y + alto, x, y + alto - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/** Líneas topográficas del fondo, como las de la referencia. */
function dibujarRelieve(ctx: CanvasRenderingContext2D, ancho: number, alto: number, escala: number) {
  ctx.save()
  ctx.strokeStyle = "rgba(255,255,255,0.13)"
  ctx.lineWidth = 1.6 * escala

  const filas = 34
  const paso = alto / filas

  for (let i = 0; i < filas; i++) {
    const y = i * paso
    // Cuanto más abajo, más amplitud: da sensación de montaña.
    const amplitud = (12 + i * 2.6) * escala
    const frecuencia = 0.004 / escala

    ctx.beginPath()
    for (let x = 0; x <= ancho; x += 6 * escala) {
      const onda =
        Math.sin(x * frecuencia + i * 0.5) * amplitud +
        Math.sin(x * frecuencia * 2.3 + i * 0.9) * amplitud * 0.35
      const py = y + onda
      if (x === 0) ctx.moveTo(x, py)
      else ctx.lineTo(x, py)
    }
    ctx.stroke()
  }

  ctx.restore()
}

/**
 * Pasa la foto a blanco y negro con trama ordenada (Bayer 4x4).
 * Es lo que le da el aspecto impreso del carnet de la referencia.
 */
function tramarFoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number
) {
  const imagen = ctx.getImageData(x, y, ancho, alto)
  const { data } = imagen

  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ]

  for (let py = 0; py < alto; py++) {
    for (let px = 0; px < ancho; px++) {
      const i = (py * ancho + px) * 4
      const gris = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const umbral = ((bayer[py % 4][px % 4] + 0.5) / 16) * 255
      // Un poco de contraste antes de tramar, si no queda lavado.
      const ajustado = Math.min(255, Math.max(0, (gris - 128) * 1.25 + 128))
      const valor = ajustado > umbral ? 255 : 0
      data[i] = valor
      data[i + 1] = valor
      data[i + 2] = valor
    }
  }

  ctx.putImageData(imagen, x, y)
}

function dibujarFoto(
  ctx: CanvasRenderingContext2D,
  foto: DatosCarnet["foto"],
  x: number,
  y: number,
  ancho: number,
  alto: number,
  escala: number
) {
  ctx.save()
  rectRedondeado(ctx, x, y, ancho, alto, 8 * escala)
  ctx.clip()

  if (foto) {
    // Recorte tipo object-fit: cover, para que no se deforme la cara.
    const anchoFoto = "width" in foto ? foto.width : 1
    const altoFoto = "height" in foto ? foto.height : 1
    const relacionDestino = ancho / alto
    const relacionFuente = anchoFoto / altoFoto

    let sx = 0
    let sy = 0
    let sAncho = anchoFoto
    let sAlto = altoFoto

    if (relacionFuente > relacionDestino) {
      sAncho = altoFoto * relacionDestino
      sx = (anchoFoto - sAncho) / 2
    } else {
      sAlto = anchoFoto / relacionDestino
      sy = (altoFoto - sAlto) / 2
    }

    ctx.drawImage(foto as CanvasImageSource, sx, sy, sAncho, sAlto, x, y, ancho, alto)
    tramarFoto(ctx, Math.round(x), Math.round(y), Math.round(ancho), Math.round(alto))
  } else {
    ctx.fillStyle = "#1a1a1d"
    ctx.fillRect(x, y, ancho, alto)
    ctx.fillStyle = TINTA_SUAVE
    ctx.font = `${22 * escala}px ui-monospace, "Courier New", monospace`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("SIN FOTO", x + ancho / 2, y + alto / 2)
  }

  ctx.restore()

  ctx.strokeStyle = "rgba(255,255,255,0.14)"
  ctx.lineWidth = 1.5 * escala
  rectRedondeado(ctx, x, y, ancho, alto, 8 * escala)
  ctx.stroke()
}

/** Ajusta el tamaño de fuente para que el nombre entre en una línea. */
function fuenteQueEntra(
  ctx: CanvasRenderingContext2D,
  texto: string,
  anchoMaximo: number,
  tamanoInicial: number,
  familia: string
) {
  let tamano = tamanoInicial
  do {
    ctx.font = `900 ${tamano}px ${familia}`
    if (ctx.measureText(texto).width <= anchoMaximo) break
    tamano -= 2
  } while (tamano > 12)
  return tamano
}

/**
 * Dibuja el carnet completo. Devuelve el mismo canvas que recibió.
 * `escala` 1 = 1024x1434. Usa 2 para la descarga en alta.
 */
export async function dibujarCarnet(
  canvas: HTMLCanvasElement,
  datos: DatosCarnet,
  escala = 1
): Promise<HTMLCanvasElement> {
  const ancho = ANCHO_BASE * escala
  const alto = ALTO_BASE * escala

  canvas.width = ancho
  canvas.height = alto

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas")

  const mono = 'ui-monospace, "Courier New", monospace'
  const sans = '"Geist Sans", Inter, system-ui, -apple-system, sans-serif'

  // --- fondo ---------------------------------------------------------------
  ctx.fillStyle = FONDO
  ctx.fillRect(0, 0, ancho, alto)
  dibujarRelieve(ctx, ancho, alto, escala)

  const degradado = ctx.createLinearGradient(0, 0, 0, alto)
  degradado.addColorStop(0, "rgba(10,10,11,0.75)")
  degradado.addColorStop(0.45, "rgba(10,10,11,0.25)")
  degradado.addColorStop(1, "rgba(10,10,11,0.9)")
  ctx.fillStyle = degradado
  ctx.fillRect(0, 0, ancho, alto)

  // --- maquetación ---------------------------------------------------------
  // Las posiciones se calculan de abajo hacia arriba desde el pie, porque el
  // QR y el texto tienen tamaño fijo y la foto es la que se adapta. Al revés
  // (de arriba hacia abajo) el QR terminaba encima del nombre.
  const margen = 64 * escala
  const anchoFoto = ancho - margen * 2

  const yPie = alto - 58 * escala // línea base del dominio
  const ladoQr = 132 * escala
  const yQr = yPie - 44 * escala - ladoQr
  const xQr = (ancho - ladoQr) / 2
  const yUniversidad = yQr - 36 * escala
  const yRol = yUniversidad - 40 * escala
  const yNombre = yRol - 46 * escala

  const yFoto = 120 * escala
  const altoFoto = Math.max(yNombre - 78 * escala - yFoto, 200 * escala)

  // --- etiqueta superior ---------------------------------------------------
  const etiqueta = datos.etiqueta ?? "HACK[CIS] UNI 2026"
  const numero = `#${String(datos.numero).padStart(3, "0")}`

  ctx.fillStyle = TINTA_SUAVE
  ctx.font = `600 ${24 * escala}px ${mono}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillText(etiqueta, margen, margen + 18 * escala)

  ctx.textAlign = "right"
  ctx.fillStyle = TINTA
  ctx.fillText(numero, ancho - margen, margen + 18 * escala)

  // --- foto ----------------------------------------------------------------
  dibujarFoto(ctx, datos.foto, margen, yFoto, anchoFoto, altoFoto, escala)

  // --- nombre --------------------------------------------------------------
  const nombre = datos.nombre.trim().toUpperCase() || "HACKER"
  const tamanoNombre = fuenteQueEntra(ctx, nombre, anchoFoto, 84 * escala, sans)
  ctx.fillStyle = TINTA
  ctx.font = `900 ${tamanoNombre}px ${sans}`
  ctx.textAlign = "center"
  ctx.fillText(nombre, ancho / 2, yNombre)

  // --- rol -----------------------------------------------------------------
  const rol = (datos.rol || "PARTICIPANTE").trim().toUpperCase()
  const tamanoRol = fuenteQueEntra(ctx, rol, anchoFoto, 26 * escala, sans)
  ctx.fillStyle = TINTA_SUAVE
  ctx.font = `700 ${tamanoRol}px ${sans}`
  ctx.fillText(rol, ancho / 2, yRol)

  // --- universidad ---------------------------------------------------------
  if (datos.universidad) {
    ctx.fillStyle = "rgba(244,244,245,0.45)"
    ctx.font = `600 ${22 * escala}px ${mono}`
    ctx.fillText(datos.universidad.toUpperCase(), ancho / 2, yUniversidad)
  }

  // --- QR ------------------------------------------------------------------

  try {
    const lienzoQr = document.createElement("canvas")
    await QRCode.toCanvas(lienzoQr, datos.qrValor, {
      width: ladoQr,
      margin: 1,
      color: { dark: "#f4f4f5ff", light: "#00000000" },
      errorCorrectionLevel: "M",
    })
    ctx.drawImage(lienzoQr, xQr, yQr, ladoQr, ladoQr)
  } catch {
    // Si el QR falla, el carnet igual tiene que salir: mejor sin QR que nada.
    ctx.strokeStyle = "rgba(244,244,245,0.3)"
    ctx.lineWidth = 2 * escala
    ctx.strokeRect(xQr, yQr, ladoQr, ladoQr)
  }

  // --- pie -----------------------------------------------------------------
  ctx.fillStyle = TINTA_SUAVE
  ctx.font = `600 ${20 * escala}px ${mono}`
  ctx.textAlign = "center"
  ctx.fillText(datos.dominio ?? "HACKCIS.UNI.PE", ancho / 2, yPie)

  // --- borde ---------------------------------------------------------------
  ctx.strokeStyle = "rgba(255,255,255,0.1)"
  ctx.lineWidth = 2 * escala
  rectRedondeado(ctx, 1, 1, ancho - 2, alto - 2, 28 * escala)
  ctx.stroke()

  return canvas
}

/** Carga una imagen respetando CORS, para poder leerla desde el canvas. */
export function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    // Sin esto, el canvas queda "tainted" y toDataURL lanza una excepción.
    imagen.crossOrigin = "anonymous"
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`))
    imagen.src = src
  })
}

/** Genera el PNG del carnet listo para descargar. */
export async function generarPngCarnet(datos: DatosCarnet, escala = 2): Promise<Blob> {
  const canvas = document.createElement("canvas")
  await dibujarCarnet(canvas, datos, escala)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar el PNG"))),
      "image/png"
    )
  })
}
