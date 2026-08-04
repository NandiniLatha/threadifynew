"use client"

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface LuxuryShowroomBackgroundProps {
  activeIndex: number
  totalCards: number
}

export function LuxuryShowroomBackground({ activeIndex: _activeIndex, totalCards: _totalCards }: LuxuryShowroomBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Calculate rotation position (0 to 360 degrees) to shift light gradients slightly


  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let particles: Array<{
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      opacitySpeed: number
      color: string
    }> = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      const particleCount = Math.min(40, Math.floor((canvas.width * canvas.height) / 50000))
      particles = []
      for (let i = 0; i < particleCount; i++) {
        // Subtle gold/amber colors
        const colors = [
          "rgba(217, 119, 6, ", // Amber-600
          "rgba(245, 158, 11, ", // Amber-500
          "rgba(251, 191, 36, ", // Yellow-400
          "rgba(201, 169, 97, ", // Tailor Gold
        ]
        const colorBase = colors[Math.floor(Math.random() * colors.length)]

        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.1,
          speedY: (Math.random() - 0.5) * 0.1 - 0.05, // Gentle float up
          opacity: Math.random() * 0.4 + 0.1,
          opacitySpeed: 0.001 + Math.random() * 0.002,
          color: colorBase,
        })
      }
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${p.opacity})`
        ctx.shadowBlur = p.size * 2
        ctx.shadowColor = "rgba(251, 191, 36, 0.2)"
        ctx.fill()

        // Move
        p.x += p.speedX
        p.y += p.speedY

        // Wrap boundaries
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Pulse opacity
        p.opacity += p.opacitySpeed
        if (p.opacity > 0.5 || p.opacity < 0.08) {
          p.opacitySpeed = -p.opacitySpeed
        }
      })

      animationFrameId = requestAnimationFrame(drawParticles)
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()
    createParticles()
    drawParticles()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Breathing luxury mesh background */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{
          background: [
            "radial-gradient(circle at 50% 60%, rgba(20, 15, 10, 1) 0%, rgba(5, 5, 5, 1) 100%)",
            "radial-gradient(circle at 50% 55%, rgba(25, 18, 12, 1) 0%, rgba(5, 5, 5, 1) 100%)",
            "radial-gradient(circle at 50% 60%, rgba(20, 15, 10, 1) 0%, rgba(5, 5, 5, 1) 100%)",
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 2. Reactive radial light glow behind active card */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] mix-blend-screen opacity-70"
        style={{
          width: "550px",
          height: "550px",
        }}
        animate={{
          background: [
            `radial-gradient(circle, rgba(201, 169, 97, 0.08) 0%, transparent 70%)`,
            `radial-gradient(circle, rgba(217, 119, 6, 0.12) 0%, transparent 70%)`,
            `radial-gradient(circle, rgba(201, 169, 97, 0.08) 0%, transparent 70%)`,
          ],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 3. Ambient warm gold spotlights */}
      <div className="absolute top-0 left-0 w-full h-[60%] bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.04),transparent_60%)] mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-full h-[40%] bg-[radial-gradient(ellipse_at_bottom,rgba(201,169,97,0.03),transparent_70%)] mix-blend-screen" />

      {/* 4. Drifting warm Bokeh overlays */}
      <motion.div
        className="absolute top-[20%] left-[15%] w-72 h-72 rounded-full bg-amber-600/5 blur-[90px]"
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-[25%] right-[10%] w-96 h-96 rounded-full bg-primary/5 blur-[120px]"
        animate={{
          x: [0, -60, 0],
          y: [0, 45, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 5. Gold particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 mix-blend-screen opacity-55"
      />
    </div>
  )
}
