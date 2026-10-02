"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import GradientText from "@/components/gradient-text"
import { X, MessageCircle, Home } from "lucide-react"

interface SponsorSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  companyName: string
  contactName: string
  plan: string
}

export default function SponsorSuccessModal({
  isOpen,
  onClose,
  companyName,
  contactName,
  plan
}: SponsorSuccessModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      // Ocultar confeti después de 5 segundos
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleContactClick = () => {
    // Enlace para contactar al equipo organizador por WhatsApp
    const message = `Hola! Soy ${contactName} de ${companyName}. Acabamos de registrarnos como patrocinadores del plan ${getPlanDisplayName(plan)} para Hack[CIS] 2026. Nos gustaría coordinar los detalles del patrocinio.`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/51955329623?text=${encodedMessage}`, "_blank")
  }

  const handleGoHome = () => {
    window.location.href = "/"
  }

  const getPlanDisplayName = (planValue: string) => {
    const planNames: Record<string, string> = {
      'silver': 'Silver - Aliado Inicial',
      'gold': 'Golden - Aliado Formador',
      'diamond': 'Diamond - Hiring Ally'
    }
    return planNames[planValue] || planValue
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full mx-auto overflow-hidden">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Contenido del modal */}
          <div className="p-8 text-center space-y-6">
            {/* Emoji de celebración */}
            <div className="text-6xl animate-bounce">🤝</div>

            {/* Título */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">
                ¡Bienvenidos como patrocinadores!
              </h2>
              <p className="text-xl text-gray-300">
                <GradientText gradient="from-cyan-400 to-purple-400">
                  {companyName}
                </GradientText>
              </p>
            </div>

            {/* Mensaje */}
            <div className="space-y-3">
              <p className="text-lg text-gray-300">
                Gracias {contactName}, tu solicitud de patrocinio ha sido registrada exitosamente
              </p>
              <div className="text-xl font-bold">
                <GradientText gradient="from-yellow-400 to-orange-400">
                  Plan: {getPlanDisplayName(plan)}
                </GradientText>
              </div>
              <p className="text-gray-400">
                Nuestro equipo se pondrá en contacto contigo pronto para coordinar los detalles del patrocinio.
              </p>
            </div>

            {/* Botones */}
            <div className="space-y-4 pt-4">
              <Button
                onClick={handleContactClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Contactar al equipo organizador
              </Button>

              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                Volver al inicio
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confeti */}
      {showConfetti && (
        <>
          <style jsx>{`
            @keyframes confetti-rise {
              0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translateY(-100vh) rotate(720deg);
                opacity: 0;
              }
            }
            .confetti-particle {
              animation: confetti-rise linear;
            }
          `}</style>

          {/* Confeti desde esquina inferior izquierda */}
          <div className="fixed bottom-0 left-0 w-64 h-screen z-[60] pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`left-${i}`}
                className="absolute confetti-particle text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '0px',
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              >
                {["🎉", "🎊", "✨", "🎈", "🥳"][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>

          {/* Confeti desde esquina inferior derecha */}
          <div className="fixed bottom-0 right-0 w-64 h-screen z-[60] pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`right-${i}`}
                className="absolute confetti-particle text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '0px',
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              >
                {["🎉", "🎊", "✨", "🎈", "🥳"][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}