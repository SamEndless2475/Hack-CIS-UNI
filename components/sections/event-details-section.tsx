import { Card, CardContent } from "@/components/ui/card"
import { Calendar, MapPin, Users, Trophy } from "lucide-react"
import GradientText from "@/components/gradient-text"

export default function EventDetailsSection() {
  return (
    <section id="details" className="relative z-10 py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <GradientText>Detalles del Evento</GradientText>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fecha y Duración</h3>
                    <p className="text-gray-400">04-13 Marzo, 2026</p>
                    <p className="text-gray-400">240 horas de innovación continua</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-teal-400 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Ubicación</h3>
                    <p className="text-gray-400">IEEE CIS UNI</p>
                    <p className="text-gray-400">Lima, Perù</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Participantes</h3>
                    <p className="text-gray-400">500+ desarrolladores</p>
                    <p className="text-gray-400">Equipos de 2-4 personas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    <GradientText gradient="from-yellow-400 to-orange-400">Premios Totales</GradientText>
                  </h3>
                  <div className="text-4xl font-bold mb-6">
                    <GradientText gradient="from-green-400 to-blue-400">$1000</GradientText>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">1er Lugar</span>
                    <span className="font-semibold">$700</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">2do Lugar</span>
                    <span className="font-semibold">$300</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">3er Lugar</span>
                    <span className="font-semibold">Becas CTIC</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}