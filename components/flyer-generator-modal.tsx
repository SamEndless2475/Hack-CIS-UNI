"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Download, Share2, Upload, Loader2 } from "lucide-react"
import { FlyerGeneratorService } from "@/lib/neobanana-service"
import { toast } from "@/hooks/use-toast"

interface FlyerGeneratorModalProps {
    isOpen: boolean
    onClose: () => void
    participantName: string
}

export default function FlyerGeneratorModal({
    isOpen,
    onClose,
    participantName
}: FlyerGeneratorModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>("")
    const [generatedFlyerUrl, setGeneratedFlyerUrl] = useState<string>("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [step, setStep] = useState<'upload' | 'preview' | 'generated'>('upload')

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Archivo inválido",
                description: "Por favor selecciona una imagen válida (JPG, PNG, etc.)",
                variant: "destructive"
            })
            return
        }

        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "Archivo muy grande",
                description: "La imagen debe ser menor a 10MB",
                variant: "destructive"
            })
            return
        }

        setSelectedFile(file)

        // Crear preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string)
            setStep('preview')
        }
        reader.readAsDataURL(file)
    }

    const handleGenerateFlyer = async () => {
        if (!selectedFile) return

        setIsProcessing(true)

        try {
            const flyerUrl = await FlyerGeneratorService.generatePersonalizedFlyer(
                selectedFile,
                participantName
            )

            setGeneratedFlyerUrl(flyerUrl)
            setStep('generated')

            toast({
                title: "¡Flyer generado! 🚀",
                description: "Tu flyer personalizado está listo para compartir",
            })
        } catch (error) {
            console.error('Error generando flyer:', error)
            toast({
                title: "Error al generar flyer",
                description: error instanceof Error ? error.message : "Intenta nuevamente",
                variant: "destructive"
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDownload = async () => {
        if (!generatedFlyerUrl) return

        try {
            const response = await fetch(generatedFlyerUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `hack-cis-2026-${participantName.replace(/\s+/g, '-').toLowerCase()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            window.URL.revokeObjectURL(url)

            toast({
                title: "¡Descargado! 📱",
                description: "Tu flyer se guardó en tu dispositivo",
            })
        } catch (error) {
            toast({
                title: "Error al descargar",
                description: "No se pudo descargar la imagen",
                variant: "destructive"
            })
        }
    }

    const handleShare = async () => {
        if (!generatedFlyerUrl) return

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mi flyer para Hack[CIS] 2026',
                    text: `¡Estoy participando en Hack[CIS] 2026! 🚀 #HackCIS2026`,
                    url: generatedFlyerUrl
                })
            } catch (error) {
                // Usuario canceló o error en share
            }
        } else {
            // Fallback: copiar URL al clipboard
            try {
                await navigator.clipboard.writeText(generatedFlyerUrl)
                toast({
                    title: "¡Copiado! 📋",
                    description: "El enlace se copió al portapapeles",
                })
            } catch (error) {
                toast({
                    title: "Error al compartir",
                    description: "No se pudo copiar el enlace",
                    variant: "destructive"
                })
            }
        }
    }

    const resetModal = () => {
        setSelectedFile(null)
        setPreviewUrl("")
        setGeneratedFlyerUrl("")
        setStep('upload')
        setIsProcessing(false)
    }

    const handleClose = () => {
        resetModal()
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Genera tu Flyer 🖌️
                    </h2>
                    <Button
                        onClick={handleClose}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white hover:bg-cyan-400 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {step === 'upload' && (
                        <div className="text-center space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-white">
                                    Flexea tu lugar en la Hackathon 🚀
                                </h3>
                                <p className="text-gray-400">
                                    Carga tu foto y genera tu flyer oficial en segundos. Ready pa' romperla 😎🔥
                                </p>
                            </div>

                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-cyan-400 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="cursor-pointer flex flex-col items-center space-y-4"
                                >
                                    <Upload className="h-12 w-12 text-gray-400" />
                                    <div className="text-center">
                                        <p className="text-white font-medium">Sube tu foto</p>
                                        <p className="text-sm text-gray-400">JPG, PNG (máx. 5MB)</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    ¿Te gusta cómo se ve?
                                </h3>
                                <p className="text-gray-400">
                                    Esta foto se usará para generar tu flyer personalizado
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-w-xs max-h-64 object-contain rounded-lg border border-gray-600"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center space-x-4">
                                <Button
                                    onClick={() => setStep('upload')}
                                    variant="outline"
                                    className="border-gray-600 text-white bg-gray-800 hover:bg-white hover:text-gray-900"
                                >
                                    Cambiar foto
                                </Button>
                                <Button
                                    onClick={handleGenerateFlyer}
                                    disabled={isProcessing}
                                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black font-semibold"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        "Generar Flyer 🎨"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'generated' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    ¡Tu flyer está listo! 🔥
                                </h3>
                                <p className="text-gray-400">
                                    Compártelo en tus redes y muestra que estás en Hack[CIS] 2026
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <div className="aspect-square w-80 flex items-center justify-center">
                                    <img
                                        src={generatedFlyerUrl}
                                        alt="Flyer generado"
                                        className="object-contain rounded-lg border border-gray-600 shadow-2xl max-w-full max-h-full"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center space-x-4">
                                <Button
                                    onClick={handleDownload}
                                    variant="outline"
                                    className="border-gray-600 text-gray-400 hover:bg-gray-800"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar
                                </Button>
                                <Button
                                    onClick={handleShare}
                                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-black font-semibold"
                                >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Compartir
                                </Button>
                            </div>

                            <div className="text-center">
                                <Button
                                    onClick={() => setStep('upload')}
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white text-sm"
                                >
                                    Generar otro flyer
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}