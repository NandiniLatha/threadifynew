import React, { useState, useCallback } from "react"
import { useMotionValue, useSpring, useTransform } from "framer-motion"
import { usePrefersReducedMotion } from "./usePrefersReducedMotion"

interface MouseTiltOptions {
  stiffness?: number
  damping?: number
  mass?: number
  maxRotateX?: number
  maxRotateY?: number
}

export function useMouseTilt(
  ref: React.RefObject<HTMLElement>,
  options: MouseTiltOptions = {}
) {
  const {
    stiffness = 150,
    damping = 20,
    mass = 0.6,
    maxRotateX = 10,
    maxRotateY = 10,
  } = options

  const reducedMotion = usePrefersReducedMotion()
  const [isHovered, setIsHovered] = useState(false)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const glowX = useSpring(0, { stiffness, damping })
  const glowY = useSpring(0, { stiffness, damping })

  const mX = useSpring(rawX, { stiffness, damping, mass })
  const mY = useSpring(rawY, { stiffness, damping, mass })

  const rotateX = useTransform(mY, [-0.5, 0.5], [`${maxRotateX}deg`, `${-maxRotateX}deg`])
  const rotateY = useTransform(mX, [-0.5, 0.5], [`${-maxRotateY}deg`, `${maxRotateY}deg`])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (reducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    rawX.set(mouseX / width - 0.5)
    rawY.set(mouseY / height - 0.5)
    glowX.set(mouseX)
    glowY.set(mouseY)
    setIsHovered(true)
  }, [reducedMotion, ref, rawX, rawY, glowX, glowY])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (!reducedMotion) {
      rawX.set(0)
      rawY.set(0)
    }
  }, [reducedMotion, rawX, rawY])

  return {
    rotateX,
    rotateY,
    glowX,
    glowY,
    isHovered,
    handleMouseMove,
    handleMouseLeave,
  }
}
