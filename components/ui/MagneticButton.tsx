"use client"

import React, { useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { cn } from "@/lib/utils"

import { HTMLMotionProps } from "framer-motion"

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode
  className?: string
  magneticPull?: number
}

export function MagneticButton({ 
  children, 
  className,
  magneticPull = 0.5,
  ...props 
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 }
  const x = useSpring(rawX, springConfig)
  const y = useSpring(rawY, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    // Calculate distance from center, scaled by magneticPull
    rawX.set((e.clientX - centerX) * magneticPull)
    rawY.set((e.clientY - centerY) * magneticPull)
  }

  const handleMouseLeave = () => {
    if (!reducedMotion) {
      rawX.set(0)
      rawY.set(0)
    }
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={reducedMotion ? undefined : { scale: 1.05 }}
      whileTap={reducedMotion ? undefined : { scale: 0.95 }}
      style={{ x, y }}
      className={cn(
        "relative overflow-hidden group",
        className
      )}
      {...props}
    >
      <span className="relative z-10 block">{children}</span>
      
      {/* Sweeping Shine Overlay */}
      {!reducedMotion && (
        <motion.div 
          className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none z-0"
          style={{ transform: "skewX(-20deg)" }}
        />
      )}
    </motion.button>
  )
}
