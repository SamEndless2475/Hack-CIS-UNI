"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import GradientText from "@/components/gradient-text"
import { X, MessageCircle, Home } from "lucide-react"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  participantName: string
}

export default function SuccessModal({ isOpen, onClose, participantName }: SuccessModalProps) {
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

  const handleWhatsAppClick = () => {
    // Enlace al grupo de WhatsApp de la hackathon
    window.open("https://chat.whatsapp.com/KjuBCFP0GLq8D622MW59A3?mode=ems_copy_c", "_blank")
  }

  const handleGoHome = () => {
    window.location.href = "/"
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
            <div className="text-6xl animate-bounce">🎉</div>

            {/* Título */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">
                ¡Felicitaciones!
              </h2>
              <p className="text-xl text-gray-300">
                <GradientText gradient="from-cyan-400 to-purple-400">
                  {participantName}
                </GradientText>
              </p>
            </div>

            {/* Mensaje */}
            <div className="space-y-3">
              <p className="text-lg text-gray-300">
                Te has registrado exitosamente en
              </p>
              <div className="text-2xl font-bold">
                <GradientText gradient="from-yellow-400 to-orange-400">
                  Hack[CIS] 2026
                </GradientText>
              </div>
              <p className="text-gray-400">
                ¡Prepárate para 5 días increíbles de innovación y tecnología!
              </p>
            </div>

            {/* Botones */}
            <div className="space-y-4 pt-4">
              <Button
                onClick={handleWhatsAppClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Unirme al grupo de WhatsApp
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
