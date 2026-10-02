"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, ArrowLeft } from "lucide-react"
import TypewriterText from "@/components/typewriter-text"
import FloatingParticles from "@/components/floating-particles"
import GradientText from "@/components/gradient-text"
import SearchableSelect from "@/components/searchable-select"
import SuccessModal from "@/components/success-modal"
import FlyerGeneratorModal from "@/components/flyer-generator-modal"
import { searchUniversities, searchExpertise, createUniversity, getExistingTeams, University, Expertise, Team } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface Question {
  id: string
  text: string
  placeholder: string
  type: "text" | "email" | "select" | "tel" | "url" | "textarea" | "searchable-select"
  options?: string[]
  highlightWords?: string[]
  required?: boolean
  conditional?: {
    dependsOn: string
    value: string
  }
}

// Los equipos se cargarán dinámicamente desde la API

const questions: Question[] = [
  {
    id: "name",
    text: "Hola! ¿Cuál es tu nombre?",
    placeholder: "Tu nombre completo",
    type: "text",
    highlightWords: ["nombre"],
    required: true,
  },
  {
    id: "lastname",
    text: "¿Cuál es tu apellido?",
    placeholder: "Tu apellido completo",
    type: "text",
    highlightWords: ["apellido"],
    required: true,
  },
  {
    id: "email",
    text: "Perfecto! Ahora necesitamos tu email para contactarte",
    placeholder: "tu@email.com",
    type: "email",
    highlightWords: ["email"],
    required: true,
  },
  {
    id: "phone",
    text: "¿Cuál es tu número de celular?",
    placeholder: "+51 999 999 999",
    type: "tel",
    highlightWords: ["celular"],
    required: true,
  },
  {
    id: "university",
    text: "¿De qué universidad o instituto estudias?",
    placeholder: "Busca tu universidad o instituto",
    type: "searchable-select",
    highlightWords: ["universidad", "instituto"],
    required: true,
  },
  {
    id: "linkedin",
    text: "Comparte tu perfil de LinkedIn",
    placeholder: "https://linkedin.com/in/tu-perfil",
    type: "url",
    highlightWords: ["LinkedIn"],
    required: true,
  },
  {
    id: "github",
    text: "¿Tienes perfil de GitHub? (Opcional)",
    placeholder: "https://github.com/tu-usuario",
    type: "url",
    highlightWords: ["GitHub"],
    required: false,
  },
  {
    id: "social",
    text: "¿Alguna otra red social que quieras compartir? (Opcional)",
    placeholder: "Instagram, Twitter, etc.",
    type: "text",
    highlightWords: ["red social"],
    required: false,
  },
  {
    id: "experience",
    text: "¿Cuál es tu nivel de experiencia en IA?",
    placeholder: "Selecciona tu nivel",
    type: "select",
    options: ["Principiante", "Intermedio", "Avanzado", "Experto"],
    highlightWords: ["experiencia", "IA"],
    required: true,
  },
  {
    id: "expertise",
    text: "¿Cuál es tu área de especialización?",
    placeholder: "Busca tu especialización",
    type: "searchable-select",
    highlightWords: ["especialización", "área"],
    required: true,
  },
  {
    id: "teamChoice",
    text: "¿Quieres crear un nuevo equipo o unirte a uno existente?",
    placeholder: "Selecciona una opción",
    type: "select",
    options: ["Crear nuevo equipo", "Unirme a equipo existente"],
    highlightWords: ["equipo"],
    required: true,
  },
  {
    id: "teamName",
    text: "¿Cuál será el nombre de tu equipo?",
    placeholder: "Nombre del equipo (mín. 2, máx. 4 integrantes)",
    type: "text",
    highlightWords: ["nombre", "equipo"],
    required: true,
    conditional: {
      dependsOn: "teamChoice",
      value: "Crear nuevo equipo"
    }
  },
  {
    id: "teamDescription",
    text: "Describe qué planean construir o desarrollar",
    placeholder: "Cuéntanos sobre su idea o proyecto...",
    type: "textarea",
    highlightWords: ["construir", "desarrollar"],
    required: true,
    conditional: {
      dependsOn: "teamChoice",
      value: "Crear nuevo equipo"
    }
  },
  {
    id: "existingTeam",
    text: "¿A qué equipo te gustaría unirte?",
    placeholder: "Busca y selecciona un equipo",
    type: "searchable-select",
    highlightWords: ["equipo"],
    required: true,
    conditional: {
      dependsOn: "teamChoice",
      value: "Unirme a equipo existente"
    }
  },
  {
    id: "generateFlyer",
    text: "Flexea tu lugar en la Hackathon 🚀 Carga tu foto y genera tu flyer oficial en segundos. Ready pa' romperla 🔥",
    placeholder: "Generar mi flyer personalizado",
    type: "text",
    highlightWords: ["Hackathon", "flyer", "foto"],
    required: false,
  }
]

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [selectedExpertise, setSelectedExpertise] = useState<Expertise | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string>("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFlyerModal, setShowFlyerModal] = useState(false)

  // Filtrar preguntas basado en condiciones
  const getVisibleQuestions = () => {
    return questions.filter(question => {
      if (!question.conditional) return true

      const dependentAnswer = answers[question.conditional.dependsOn]
      return dependentAnswer === question.conditional.value
    })
  }

  const visibleQuestions = getVisibleQuestions()
  const currentQuestion = visibleQuestions[currentStep]

  // Función de validación para cada campo
  const validateField = (question: Question, value: string, university: University | null, expertise: Expertise | null, team: Team | null): string => {
    if (question.required) {
      if (question.type === "searchable-select") {
        if (question.id === "university" && !university) {
          return "Debes seleccionar una universidad o instituto"
        }
        if (question.id === "expertise" && !expertise) {
          return "Debes seleccionar tu área de especialización"
        }
        if (question.id === "existingTeam" && !team) {
          return "Debes seleccionar un equipo existente"
        }
      } else if (!value || value.trim().length === 0) {
        return "Este campo es obligatorio"
      }
    }

    // Validaciones específicas por tipo de campo
    switch (question.type) {
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Ingresa un email válido"
        }
        break
      case "tel":
        if (value && !/^\+?[\d\s\-\(\)]{9,}$/.test(value)) {
          return "Ingresa un número de teléfono válido"
        }
        break
      case "url":
        if (value && !/^https?:\/\/.+/.test(value)) {
          return "La URL debe comenzar con http:// o https://"
        }
        break
    }

    return ""
  }

  const handleNext = () => {
    // Validar el campo actual antes de continuar
    const error = validateField(
      currentQuestion,
      answers[currentQuestion.id] || "",
      selectedUniversity,
      selectedExpertise,
      selectedTeam
    )

    if (error) {
      setFieldError(error)
      return
    }

    // Limpiar error si la validación es exitosa
    setFieldError("")

    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setShowInput(false)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setFieldError("") // Limpiar errores al retroceder
      setCurrentStep((prev) => prev - 1)
      setShowInput(true)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Mapear las respuestas del formulario al formato de la API
      const isCreatingNewTeam = answers.teamChoice === 'Crear nuevo equipo'

      // Mapear niveles de español a inglés
      const levelMapping: Record<string, string> = {
        'Principiante': 'beginner',
        'Intermedio': 'intermediate',
        'Avanzado': 'advanced',
        'Experto': 'expert'
      }

      const mappedLevel = levelMapping[answers.experience] || 'beginner'

      const registrationData = isCreatingNewTeam ? {
        name: answers.name || '',
        lastname: answers.lastname || '',
        phone: answers.phone || '',
        email: answers.email || '',
        linkedin: answers.linkedin || '',
        github: answers.github || '',
        level: mappedLevel,
        education_id: selectedUniversity?.id || '',
        expertise_id: selectedExpertise?.id || '',
        team_create: true,
        project_description: answers.teamDescription || '',
        team_name: answers.teamName || ''
      } : {
        name: answers.name || '',
        lastname: answers.lastname || '',
        phone: answers.phone || '',
        email: answers.email || '',
        linkedin: answers.linkedin || '',
        github: answers.github || '',
        level: mappedLevel,
        education_id: selectedUniversity?.id || '',
        expertise_id: selectedExpertise?.id || '',
        team_create: false,
        team_id: selectedTeam?.id || ''
      }

      // Llamar a la API
      const API_BASE_URL = process.env.NEXT_PUBLIC_URL_BACKEND_HACK_CIS || 'https://hack-cis-uni-backend.onrender.com/api/v1/'
      const response = await fetch(`${API_BASE_URL}hacker/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      })

      // Verificar si la respuesta fue exitosa basándose en el status code
      if (response.ok) {
        // Status 200-299 indica éxito
        console.log("Registro completado exitosamente")
        toast({
          title: "¡Registro exitoso!",
          description: "Te has registrado correctamente en Hack[CIS] 2026",
        })
        setShowSuccessModal(true)
      } else {
        // Intentar obtener el mensaje de error del response
        let errorMessage = "Error al enviar el registro. Por favor, intenta nuevamente."
        try {
          const result = await response.json()
          errorMessage = result.message || errorMessage
        } catch (e) {
          // Si no se puede parsear el JSON, usar mensaje por defecto
        }

        console.error("Error en el registro:", response.status, errorMessage)
        toast({
          title: "Error en el registro",
          description: errorMessage,
          variant: "destructive",
        })
        setFieldError("Error al enviar el registro. Por favor, intenta nuevamente.")
      }
    } catch (error) {
      console.error("Error al enviar el registro:", error)
      toast({
        title: "Error de conexión",
        description: "No se pudo enviar el registro. Verifica tu conexión a internet.",
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
    // Limpiar error cuando el usuario comience a escribir
    if (fieldError) {
      setFieldError("")
    }
  }

  const canProceed = currentQuestion?.required
    ? currentQuestion.type === "searchable-select"
      ? (currentQuestion.id === "university" ? selectedUniversity !== null :
        currentQuestion.id === "expertise" ? selectedExpertise !== null :
          currentQuestion.id === "existingTeam" ? selectedTeam !== null : false)
      : answers[currentQuestion.id]?.trim().length > 0
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
    <div className="h-screen bg-black text-white overflow-hidden flex flex-col">
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
      <nav className="relative z-10 p-4 sm:p-6 flex justify-between items-center max-w-7xl mx-auto w-full flex-shrink-0">
        <div className="text-xl sm:text-2xl font-bold">
          <GradientText>Hack[CIS]</GradientText>
        </div>
        <a href="/" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
          Volver al inicio
        </a>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start p-8 mt-3 mt-1 sm:mt-8 lg:mt-12">
        <div className="max-w-4xl w-full space-y-8">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mb-8">
            {visibleQuestions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${index <= currentStep ? "bg-cyan-400 scale-110" : "bg-gray-600"
                  }`}
              />
            ))}
          </div>

          {/* Question */}
          <div className="text-center flex-1 flex flex-col justify-center space-y-6 sm:space-y-8 min-h-0">
            <h1 className="text-2xl sm:text-4xl lg:text-1xl  font-bold leading-tight flex items-center justify-center px-2 min-h-[80px] sm:min-h-[120px] lg:min-h-[130px]">
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
                {currentQuestion.id === "generateFlyer" ? (
                  <div className="text-center space-y-4">
                    <div className="mx-auto bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-4 lg:max-w-[40%] max-w-[90%]">
                      <div className="space-y-3">
                        <div className="text-5xl">📸</div>
                        <p className="text-md lg:text-lg text-gray-300">
                          ¡Es hora de crear tu flyer!
                        </p>
                        <p className="text-xs lg:text-sm text-gray-400">
                          Sube tu foto y genera un flyer único para mostrar que estás en Hack[CIS] 2026
                        </p>
                        <div className="flex justify-center items-center mb-4">
                          <Button
                            onClick={() => setShowFlyerModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-yellow-500 hover:from-purple-500 hover:to-yellow-400 text-black font-semibold px-4 py-3 text-sm lg:text-md rounded-xl transition-all duration-300 hover:scale-105"
                          >
                            🎨 Generar mi Flyer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : currentQuestion.type === "searchable-select" ? (
                  <SearchableSelect
                    placeholder={currentQuestion.placeholder}
                    searchFunction={
                      currentQuestion.id === "university" ? searchUniversities :
                        currentQuestion.id === "expertise" ? searchExpertise :
                          currentQuestion.id === "existingTeam" ? async () => await getExistingTeams() :
                            searchUniversities
                    }
                    onSelect={(option) => {
                      if (currentQuestion.id === "university") {
                        setSelectedUniversity(option as University)
                      } else if (currentQuestion.id === "expertise") {
                        setSelectedExpertise(option as Expertise)
                      } else if (currentQuestion.id === "existingTeam") {
                        setSelectedTeam(option as Team)
                      }
                      // Limpiar error cuando se seleccione una opción
                      if (fieldError) {
                        setFieldError("")
                      }
                    }}
                    onCreateNew={currentQuestion.id === "university" ? createUniversity : undefined}
                    value={
                      currentQuestion.id === "university" ? selectedUniversity :
                        currentQuestion.id === "expertise" ? selectedExpertise :
                          currentQuestion.id === "existingTeam" ? selectedTeam :
                            null
                    }
                    createLabel={currentQuestion.id === "university" ? "Crear nueva universidad" : undefined}
                  />
                ) : currentQuestion.type === "select" ? (
                  <select
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full max-w-lg mx-auto bg-gray-900/50 border border-gray-700 rounded-lg px-6 py-4 text-white text-lg focus:border-cyan-400 focus:outline-none transition-colors [&>option]:bg-gray-900 [&>option]:text-white [&>option:checked]:bg-cyan-600"
                  >
                    <option value="" className="bg-gray-900 text-gray-400">{currentQuestion.placeholder}</option>
                    {currentQuestion.options?.map((option) => (
                      <option key={option} value={option} className="bg-gray-900 text-white hover:bg-gray-800">
                        {option}
                      </option>
                    ))}
                  </select>
                ) : currentQuestion.type === "textarea" ? (
                  <textarea
                    placeholder={currentQuestion.placeholder}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full max-w-lg mx-auto bg-gray-900/50 border border-gray-700 rounded-lg px-6 py-4 text-white placeholder-gray-400 text-lg focus:border-cyan-400 focus:outline-none transition-colors min-h-[120px] resize-none"
                    autoFocus
                  />
                ) : (
                  <Input
                    type={currentQuestion.type}
                    placeholder={currentQuestion.placeholder}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full max-w-lg mx-auto bg-gray-900/50 border-gray-700 focus:border-cyan-400 text-white placeholder-gray-400 text-lg py-4 px-6"
                    autoFocus
                  />
                )}

                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    {currentQuestion.required ? "*Campo obligatorio" : "*Campo opcional"}
                  </p>
                  {fieldError && (
                    <p className="text-sm text-red-400 animate-fade-in">
                      {fieldError}
                    </p>
                  )}
                </div>

                <div className="flex justify-center space-x-3 sm:space-x-4 flex-shrink-0">
                  {currentStep > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white px-4 sm:px-8 py-2 sm:py-3 bg-transparent text-sm sm:text-base"
                    >
                      <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Atrás
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={!canProceed || isSubmitting}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black font-semibold px-4 sm:px-8 py-2 sm:py-3 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-sm sm:text-base"
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : currentStep === visibleQuestions.length - 1 ? (
                      "Completar Registro"
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        participantName={answers.name || ""}
      />

      {/* Modal del generador de flyer */}
      <FlyerGeneratorModal
        isOpen={showFlyerModal}
        onClose={() => setShowFlyerModal(false)}
        participantName={answers.name || ""}
      />
    </div>
  )
}
