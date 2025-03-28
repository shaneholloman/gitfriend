"use client"

import type React from "react"
import { useRef } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"

interface AnimatedBeamsProps {
  className?: string
  beamCount?: number
  minOpacity?: number
  maxOpacity?: number
  minSize?: number
  maxSize?: number
  minDuration?: number
  maxDuration?: number
  minDelay?: number
  maxDelay?: number
}

export const AnimatedBeams: React.FC<AnimatedBeamsProps> = ({
  className = "",
  beamCount = 8,
  minOpacity = 0.05,
  maxOpacity = 0.15,
  minSize = 30,
  maxSize = 80,
  minDuration = 15,
  maxDuration = 40,
  minDelay = 0,
  maxDelay = 10,
}) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate random beams
  const beams = Array.from({ length: beamCount }).map((_, i) => {
    const size = Math.floor(Math.random() * (maxSize - minSize) + minSize)
    const opacity = Math.random() * (maxOpacity - minOpacity) + minOpacity
    const duration = Math.random() * (maxDuration - minDuration) + minDuration
    const delay = Math.random() * (maxDelay - minDelay) + minDelay
    const x = Math.random() * 100
    const y = Math.random() * 100
    const rotation = Math.random() * 360

    return { id: i, size, opacity, duration, delay, x, y, rotation }
  })

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {beams.map((beam) => (
        <motion.div
          key={beam.id}
          className="absolute rounded-full"
          style={{
            width: `${beam.size}vw`,
            height: `${beam.size}vw`,
            left: `${beam.x}%`,
            top: `${beam.y}%`,
            background: isDark
              ? `radial-gradient(circle, rgba(139, 92, 246, ${beam.opacity}) 0%, rgba(139, 92, 246, 0) 70%)`
              : `radial-gradient(circle, rgba(139, 92, 246, ${beam.opacity}) 0%, rgba(139, 92, 246, 0) 70%)`,
            transform: `rotate(${beam.rotation}deg)`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8],
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
          }}
          transition={{
            duration: beam.duration,
            delay: beam.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

