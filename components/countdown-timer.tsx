"use client"

import { useEffect, useState } from "react"
import GradientText from "./gradient-text"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // 02/10/2026 12:00:00 hora Perú (PET = UTC-5) -> UTC 17:00:00
    const targetTimestampUtc = Date.UTC(2026, 10, 2, 17, 0, 0)

    const update = () => {
      const now = Date.now()
      const difference = targetTimestampUtc - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // Actualizar inmediatamente y luego cada segundo
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const timeUnits = [
    { label: "Días", value: timeLeft.days },
    { label: "Horas", value: timeLeft.hours },
    { label: "Minutos", value: timeLeft.minutes },
    { label: "Segundos", value: timeLeft.seconds },
  ]

  return (
    <div className="mb-8">
      {/* Countdown Display */}
      <div className="grid grid-cols-4 gap-1 flex justify-center sm:gap-4 max-w-sm sm:max-w-md mx-auto">
        {timeUnits.map((unit, index) => (
          <div
            key={unit.label}
            className="text-center p-2 sm:p-4 rounded-lg sm:rounded-xl border border-white/10"
            style={{ backgroundColor: "#000000" }}
          >
            <div
              className="text-lg sm:text-3xl font-black mb-1"
              style={{
                color: "#FFDA35",
                fontFamily: "'Orbitron', 'Rajdhani', 'Arial Black', sans-serif",
                fontWeight: "900",
              }}
            >
              {unit.value.toString().padStart(2, "0")}
            </div>
            <div
              className="text-xs uppercase tracking-tight sm:tracking-wider font-medium opacity-70 leading-tight"
              style={{ color: "#D9D9D9" }}
            >
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
