/**
 * Vista de prueba del carnet con datos inventados.
 *
 * Sirve para trabajar en el diseño del carnet sin tener que registrarse ni
 * tener la base de datos conectada. Solo existe en desarrollo: en producción
 * devuelve 404.
 */

import { notFound } from "next/navigation"

import DemoCliente from "./demo-cliente"

export default function CarnetDemoPage() {
  if (process.env.NODE_ENV === "production") notFound()
  return <DemoCliente />
}
