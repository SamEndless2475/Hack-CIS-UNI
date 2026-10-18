"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft } from "lucide-react"
import TypewriterText from "@/components/typewriter-text"
import FloatingParticles from "@/components/floating-particles"
import GradientText from "@/components/gradient-text"
import { toast } from "@/hooks/use-toast"
import SponsorSuccessModal from "@/components/sponsor-success-modal"
import { registrarPatrocinador } from "@/lib/api-registro"

interface Question {
  id: string
  text: string
  placeholder: string
  type: "text" | "email" | "select" | "tel" | "url"
  options?: string[]
  highlightWords?: string[]
  required?: boolean
}

const questions: Question[] = [
  {
    id: "name",
    text: "¡Bienvenido! ¿Cuál es el nombre de tu empresa?",
    placeholder: "Nombre de la empresa",
    type: "text",
    highlightWords: ["empresa"],
    required: true,
  },
  {
    id: "email",
    text: "¿Cuál es el email de contacto de la empresa?",
    placeholder: "contacto@empresa.com",
    type: "email",
    highlightWords: ["email"],
    required: true,
  },
  {
    id: "contact_name",
    text: "¿Cuál es el nombre del representante de la empresa?",
    placeholder: "Nombre del contacto",
    type: "text",
    highlightWords: ["representante"],
    required: true,
  },
  {
    id: "contact_lastname",
    text: "¿Cuál es el apellido del representante?",
    placeholder: "Apellido del contacto",
    type: "text",
    highlightWords: ["apellido"],
    required: true,
  },
  {
    id: "contact_phone",
    text: "¿Cuál es el número de teléfono del representante?",
    placeholder: "+51 999 999 999",
    type: "tel",
    highlightWords: ["teléfono"],
    required: true,
  },
  {
    id: "linkedin",
    text: "Comparte el perfil de LinkedIn de la empresa",
    placeholder: "https://linkedin.com/company/tu-empresa",
    type: "url",
    highlightWords: ["LinkedIn"],
    required: false,
  },
  {
    id: "instagram",
    text: "¿Tienen perfil de Instagram? (Opcional)",
    placeholder: "https://instagram.com/tu-empresa",
    type: "url",
    highlightWords: ["Instagram"],
    required: false,
  },
  {
    id: "facebook",
    text: "¿Tienen página de Facebook? (Opcional)",
    placeholder: "https://facebook.com/tu-empresa",
    type: "url",
    highlightWords: ["Facebook"],
    required: false,
  },
  {
    id: "plan",
    text: "¿Qué plan de patrocinio les interesa?",
    placeholder: "Selecciona un plan",
    type: "select",
    options: ["Silver - Aliado Inicial (S/ 300)", "Golden - Aliado Formador (S/ 450)", "Diamond - Hiring Ally (S/ 600)"],
    highlightWords: ["plan", "patrocinio"],
    required: true,
  },
]

export default function SponsorsPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showInput, setShowInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const currentQuestion = questions[currentStep]

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setShowInput(false)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setShowInput(true)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Mapear planes de texto descriptivo a valores simples
      const planMapping: Record<string, string> = {
        'Silver - Aliado Inicial (S/ 300)': 'silver',
        'Golden - Aliado Formador (S/ 450)': 'gold', 
        'Diamond - Hiring Ally (S/ 600)': 'diamond'
      }
      
      const mappedPlan = planMapping[answers.plan] || 'gold'
      
      // Guarda directo en Supabase. Antes iba al backend de Render, que quedó
      // respondiendo 503 y hacía que ninguna postulación llegara a ningún lado.
      await registrarPatrocinador({
        company_name: answers.name || '',
        email: answers.email || '',
        contact_name: answers.contact_name || '',
        contact_lastname: answers.contact_lastname || undefined,
        phone: answers.contact_phone || undefined,
        linkedin: answers.linkedin || undefined,
        instagram: answers.instagram || undefined,
        facebook: answers.facebook || undefined,
        plan: mappedPlan,
      })

      setShowSuccessModal(true)
    } catch (error) {
      toast({
        title: "No se pudo enviar el registro",
        description:
          error instanceof Error
            ? error.message
            : "Revisa tu conexión a internet e intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const canProceed = currentQuestion?.required
    ? answers[currentQuestion.id]?.trim().length > 0
    : true

  // Manejar tecla Enter
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && showInput && canProceed) {
        event.preventDefault()
        handleNext()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [showInput, canProceed, currentStep])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <FloatingParticles />

      {/* Header */}
      <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-bold">
          <GradientText>Hack[CIS]</GradientText>
        </div>
        <a href="/" className="text-gray-400 hover:text-white transition-colors">
          Volver al inicio
        </a>
      </nav>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start p-8">
        <div className="max-w-4xl w-full space-y-12">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mb-4">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index <= currentStep ? "bg-yellow-400 scale-110" : "bg-gray-600"
                  }`}
              />
            ))}
          </div>

          {/* Question */}
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-relaxed min-h-[160px] flex items-center justify-center">
              <TypewriterText
                text={currentQuestion.text}
                speed={30}
                highlightWords={currentQuestion.highlightWords}
                onComplete={() => setShowInput(true)}
                key={currentStep} // Reset animation on step change
              />
            </h1>

            {/* Input field */}
            {showInput && currentQuestion && (
              <div className="space-y-6 animate-fade-in">
                {currentQuestion.type === "select" ? (
                  <select
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full max-w-lg mx-auto bg-gray-900/50 border border-gray-700 rounded-lg px-6 py-4 text-white text-lg focus:border-yellow-400 focus:outline-none transition-colors [&>option]:bg-gray-900 [&>option]:text-white [&>option:checked]:bg-yellow-600"
                  >
                    <option value="" className="bg-gray-900 text-gray-400">{currentQuestion.placeholder}</option>
                    {currentQuestion.options?.map((option) => (
                      <option key={option} value={option} className="bg-gray-900 text-white hover:bg-gray-800">
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={currentQuestion.type}
                    placeholder={currentQuestion.placeholder}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full max-w-lg mx-auto bg-gray-900/50 border-gray-700 focus:border-yellow-400 text-white placeholder-gray-400 text-lg py-4 px-6"
                    autoFocus
                  />
                )}

                <p className="text-sm text-gray-400">
                  {currentQuestion.required ? "*Campo obligatorio" : "*Campo opcional"}
                </p>

                <div className="flex justify-center space-x-4">
                  {currentStep > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white px-8 py-3 bg-transparent"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Atrás
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={!canProceed || isSubmitting}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-black font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : currentStep === questions.length - 1 ? (
                      "Completar Registro"
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sponsorship Plans Info */}
          {currentQuestion.id === "plan" && showInput && (
            <div className="mt-12 max-w-6xl mx-auto space-y-8">
              <h3 className="text-2xl font-bold text-center mb-8">
                <GradientText gradient="from-yellow-400 to-orange-400">Planes de Patrocinio</GradientText>
              </h3>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Silver Plan */}
                <div className="bg-gray-900/50 border border-gray-400 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <h4 className="text-2xl font-bold text-gray-400 mb-2">Silver</h4>
                    <p className="text-lg text-yellow-400 font-semibold">"Aliado Inicial"</p>
                    <p className="text-3xl font-bold text-white mt-2">S/ 300</p>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Logo en el sitio web oficial de la hackathon, en las bases y en el material digital del evento</li>
                    <li>• Mención en todas las redes sociales de IEEE CIS UNI y comunidades aliadas</li>
                    <li>• 10 minutos de exposición en el auditorio</li>
                    <li>• Acceso al catálogo digital con los proyectos participantes (descripción + contacto de los equipos)</li>
                    <li>• Presencia en la parte trasera del cartel de premiación (logo pequeño)</li>
                  </ul>
                </div>

                {/* Golden Plan */}
                <div className="bg-gray-900/50 border border-yellow-400 rounded-lg p-6 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">Recomendado</span>
                  </div>
                  <div className="text-center mb-4">
                    <h4 className="text-2xl font-bold text-yellow-400 mb-2">Golden</h4>
                    <p className="text-lg text-yellow-400 font-semibold">"Aliado Formador"</p>
                    <p className="text-3xl font-bold text-white mt-2">S/ 450</p>
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p className="text-yellow-400 font-semibold mb-2">Incluye todo lo de Silver +</p>
                    <ul className="space-y-2">
                      <li>• Logo destacado en todas las publicaciones oficiales y en los banners físicos dentro del evento</li>
                      <li>• Logo en los certificados digitales para finalistas y ganadores</li>
                      <li>• 20 minutos de exposición en el evento final</li>
                      <li>• Participación como jurado invitado</li>
                      <li>• Oportunidad de realizar un workshop/taller exclusivo para participantes en los días previos al evento</li>
                      <li>• Presencia en el cartel de premiación (logo mediano en la gifcard)</li>
                    </ul>
                  </div>
                </div>

                {/* Diamond Plan */}
                <div className="bg-gray-900/50 border border-purple-400 rounded-lg p-6 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-400 text-black px-4 py-1 rounded-full text-sm font-bold">Recomendado</span>
                  </div>
                  <div className="text-center mb-4">
                    <h4 className="text-2xl font-bold text-purple-400 mb-2">Diamond</h4>
                    <p className="text-lg text-purple-400 font-semibold">"Hiring Ally"</p>
                    <p className="text-3xl font-bold text-white mt-2">S/ 600</p>
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p className="text-purple-400 font-semibold mb-2">Incluye todo lo de Golden +</p>
                    <ul className="space-y-2">
                      <li>• Opción de proponer un reto técnico (ejemplo: API, dataset o caso de uso)</li>
                      <li>• Espacio de stand de reclutamiento/exposición en la sede durante todo el evento</li>
                      <li>• 30 minutos de exposición en el auditorio</li>
                      <li>• Acceso a la base de datos de CVs de los participantes (solo finalistas)</li>
                      <li>• Inclusión del logo en el video oficial del evento y en la fotografía grupal de clausura</li>
                      <li>• Reconocimiento especial en la ceremonia final como "Hiring Ally"</li>
                      <li>• Presencia en el cartel de premiación de ganadores (con logo destacado en la "gifcard" gigante)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de éxito */}
      <SponsorSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        companyName={answers.name || ""}
        contactName={answers.contact_name || ""}
        plan={(() => {
          const planMapping: Record<string, string> = {
            'Silver - Aliado Inicial (S/ 300)': 'silver',
            'Golden - Aliado Formador (S/ 450)': 'gold', 
            'Diamond - Hiring Ally (S/ 600)': 'diamond'
          }
          return planMapping[answers.plan] || 'gold'
        })()}
      />
    </div>
  )
}