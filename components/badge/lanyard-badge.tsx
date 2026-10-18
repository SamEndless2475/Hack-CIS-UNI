"use client"

/**
 * Carnet colgado de un cordón, con física real y arrastrable.
 *
 * Cómo está armado:
 *   - 4 cuerpos rígidos unidos por juntas de cuerda forman el cordón.
 *   - El último sostiene la tarjeta con una junta esférica, así gira natural.
 *   - El primero es `fixed`: es el gancho del que todo cuelga.
 *   - La cara de la tarjeta es una textura de canvas generada en lib/badge-canvas,
 *     la misma que se descarga como PNG. Una sola fuente de verdad.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, extend, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier"
import { MeshLineGeometry, MeshLineMaterial } from "meshline"
import * as THREE from "three"

import { dibujarCarnet, type DatosCarnet, RELACION_CARNET } from "@/lib/badge-canvas"

extend({ MeshLineGeometry, MeshLineMaterial })

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: any
    meshLineMaterial: any
  }
}

const ALTO_TARJETA = 2.1
const ANCHO_TARJETA = ALTO_TARJETA * RELACION_CARNET

// El cordón cuelga en vertical desde el gancho. Si los cuerpos se colocan
// desplazados en X (como en varios ejemplos de lanyard), la tarjeta arranca
// lanzada hacia un costado y tarda en centrarse.
const Y_GANCHO = 2.2
const LARGO_TRAMO = 0.45

/** Convierte los datos del carnet en una textura para la cara de la tarjeta. */
function useTexturaCarnet(datos: DatosCarnet) {
  const [textura, setTextura] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    let vigente = true
    const canvas = document.createElement("canvas")

    dibujarCarnet(canvas, datos, 1)
      .then(() => {
        if (!vigente) return
        const nueva = new THREE.CanvasTexture(canvas)
        nueva.colorSpace = THREE.SRGBColorSpace
        nueva.anisotropy = 8
        nueva.needsUpdate = true
        setTextura((anterior) => {
          anterior?.dispose()
          return nueva
        })
      })
      .catch((error) => {
        console.error("No se pudo dibujar el carnet:", error)
      })

    return () => {
      vigente = false
    }
    // Se vuelve a dibujar solo cuando cambia algo que se ve en el carnet.
  }, [datos.nombre, datos.rol, datos.universidad, datos.numero, datos.qrValor, datos.foto])

  useEffect(() => () => textura?.dispose(), [textura])

  return textura
}

interface PropsEscena {
  datos: DatosCarnet
  /** Qué tan fuerte lo mueve el viento cuando nadie lo toca. */
  brisa?: number
}

function Cordon({ datos, brisa = 1 }: PropsEscena) {
  const gancho = useRef<RapierRigidBody>(null)
  const nudo1 = useRef<RapierRigidBody>(null)
  const nudo2 = useRef<RapierRigidBody>(null)
  const nudo3 = useRef<RapierRigidBody>(null)
  const tarjeta = useRef<RapierRigidBody>(null)
  const cuerda = useRef<THREE.Mesh & { geometry: any }>(null)

  const { width, height } = useThree((estado) => estado.size)
  const [arrastrando, setArrastrando] = useState<THREE.Vector3 | null>(null)
  const [encima, setEncima] = useState(false)

  const textura = useTexturaCarnet(datos)

  // Vectores reutilizados en cada frame: crearlos dentro de useFrame genera
  // basura y hace tartamudear la animación en móvil.
  const vectores = useMemo(
    () => ({
      cursor: new THREE.Vector3(),
      destino: new THREE.Vector3(),
      actual: new THREE.Vector3(),
      direccion: new THREE.Vector3(),
    }),
    []
  )

  const puntos = useMemo(
    () => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    []
  )

  useRopeJoint(gancho, nudo1, [[0, 0, 0], [0, 0, 0], LARGO_TRAMO])
  useRopeJoint(nudo1, nudo2, [[0, 0, 0], [0, 0, 0], LARGO_TRAMO])
  useRopeJoint(nudo2, nudo3, [[0, 0, 0], [0, 0, 0], LARGO_TRAMO])
  useSphericalJoint(nudo3, tarjeta, [[0, 0, 0], [0, ALTO_TARJETA / 2, 0]])

  useEffect(() => {
    document.body.style.cursor = arrastrando ? "grabbing" : encima ? "grab" : "auto"
    return () => {
      document.body.style.cursor = "auto"
    }
  }, [arrastrando, encima])

  useFrame((estado, delta) => {
    if (arrastrando && tarjeta.current) {
      const { cursor, destino, direccion } = vectores

      // unproject() a z=0.5 deja el punto cerca del plano de la cámara. Si se usa
      // tal cual, la tarjeta se viene encima y tapa toda la pantalla. Hay que
      // lanzar un rayo desde la cámara y quedarse a la misma distancia a la que
      // está la escena.
      cursor.set(estado.pointer.x, estado.pointer.y, 0.5).unproject(estado.camera)
      direccion.copy(cursor).sub(estado.camera.position).normalize()
      cursor.add(direccion.multiplyScalar(estado.camera.position.length()))

      destino.copy(cursor).sub(arrastrando)

      // Se despiertan todos: si no, el cordón queda rígido mientras arrastras.
      ;[gancho, nudo1, nudo2, nudo3, tarjeta].forEach((cuerpo) => cuerpo.current?.wakeUp())
      tarjeta.current.setNextKinematicTranslation({
        x: destino.x,
        y: destino.y,
        z: destino.z,
      })
    }

    // Brisa suave para que nunca se quede completamente quieto.
    if (!arrastrando && nudo2.current && brisa > 0) {
      const t = estado.clock.elapsedTime
      nudo2.current.applyImpulse(
        {
          x: Math.sin(t * 0.7) * 0.0009 * brisa,
          y: 0,
          z: Math.cos(t * 0.45) * 0.0009 * brisa,
        },
        true
      )
    }

    // Redibuja el cordón siguiendo a los cuerpos.
    // setPoints vive en la geometría (MeshLineGeometry), no en el mesh: por eso
    // se entra por cuerda.current.geometry y no por cuerda.current.
    const geometria = cuerda.current?.geometry
    if (geometria?.setPoints && gancho.current && nudo1.current && nudo2.current && nudo3.current) {
      const cuerpos = [gancho, nudo1, nudo2, nudo3]
      cuerpos.forEach((cuerpo, i) => {
        const t = cuerpo.current!.translation()
        puntos[i].set(t.x, t.y, t.z)
      })
      geometria.setPoints(puntos)
    }

    // Endereza la tarjeta poco a poco, como si pesara abajo.
    if (!arrastrando && tarjeta.current) {
      const angular = tarjeta.current.angvel()
      tarjeta.current.setAngvel(
        {
          x: angular.x * (1 - delta * 1.2),
          y: angular.y * (1 - delta * 0.6),
          z: angular.z * (1 - delta * 1.2),
        },
        false
      )
    }
  })

  const alSoltar = (evento: ThreeEvent<PointerEvent>) => {
    ;(evento.target as Element)?.releasePointerCapture?.(evento.pointerId)
    setArrastrando(null)
  }

  const alAgarrar = (evento: ThreeEvent<PointerEvent>) => {
    evento.stopPropagation()
    ;(evento.target as Element)?.setPointerCapture?.(evento.pointerId)
    const posicion = tarjeta.current?.translation()
    if (!posicion) return
    setArrastrando(
      new THREE.Vector3()
        .copy(evento.point)
        .sub(new THREE.Vector3(posicion.x, posicion.y, posicion.z))
    )
  }

  return (
    <>
      <group>
        <RigidBody
          ref={gancho}
          type="fixed"
          position={[0, Y_GANCHO, 0]}
          angularDamping={3}
          linearDamping={3}
        />
        <RigidBody
          ref={nudo1}
          position={[0, Y_GANCHO - LARGO_TRAMO, 0]}
          angularDamping={3}
          linearDamping={3}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          ref={nudo2}
          position={[0, Y_GANCHO - LARGO_TRAMO * 2, 0]}
          angularDamping={3}
          linearDamping={3}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          ref={nudo3}
          position={[0, Y_GANCHO - LARGO_TRAMO * 3, 0]}
          angularDamping={3}
          linearDamping={3}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>

        <RigidBody
          ref={tarjeta}
          position={[0, Y_GANCHO - LARGO_TRAMO * 3 - ALTO_TARJETA / 2, 0]}
          angularDamping={3}
          linearDamping={3}
          type={arrastrando ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[ANCHO_TARJETA / 2, ALTO_TARJETA / 2, 0.015]} />
          <group
            onPointerOver={() => setEncima(true)}
            onPointerOut={() => setEncima(false)}
            onPointerUp={alSoltar}
            onPointerDown={alAgarrar}
          >
            {/* Cara del carnet */}
            <mesh>
              <boxGeometry args={[ANCHO_TARJETA, ALTO_TARJETA, 0.03]} />
              {/* Mate y oscura, como un carnet plastificado real. Con metalness
                  y clearcoat altos el reflejo del Environment lavaba la tarjeta
                  y el texto dejaba de leerse al balancearse. */}
              <meshPhysicalMaterial
                map={textura ?? undefined}
                color={textura ? "#ffffff" : "#17171a"}
                clearcoat={0.35}
                clearcoatRoughness={0.4}
                roughness={0.7}
                metalness={0.05}
                envMapIntensity={0.35}
              />
            </mesh>

            {/* Clip metálico de arriba */}
            <mesh position={[0, ALTO_TARJETA / 2 + 0.05, 0]}>
              <boxGeometry args={[0.18, 0.1, 0.05]} />
              <meshStandardMaterial color="#9ca3af" metalness={1} roughness={0.3} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      <mesh ref={cuerda}>
        <meshLineGeometry />
        <meshLineMaterial
          color="#d4d4d8"
          depthTest={false}
          resolution={[width, height]}
          lineWidth={0.12}
          transparent
        />
      </mesh>
    </>
  )
}

export interface LanyardBadgeProps {
  datos: DatosCarnet
  className?: string
  brisa?: number
}

export default function LanyardBadge({ datos, className, brisa = 1 }: LanyardBadgeProps) {
  return (
    <div className={className}>
      {/* La cámara baja un poco porque la tarjeta cuelga por debajo del centro:
          con la cámara en y=0 quedaba pegada al borde inferior del lienzo. */}
      <Canvas
        camera={{ position: [0, -0.35, 10], fov: 28 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={Math.PI * 0.3} />
        {/* Gravedad suave: con -40 la tarjeta rebotaba y tardaba en asentarse. */}
        <Physics gravity={[0, -22, 0]} timeStep={1 / 60}>
          <Cordon datos={datos} brisa={brisa} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  )
}
