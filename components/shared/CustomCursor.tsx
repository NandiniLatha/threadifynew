"use client"

import React, { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 }
  const smoothX = useSpring(cursorX, springConfig)
  const smoothY = useSpring(cursorY, springConfig)

  useEffect(() => {
    // Disable on touch devices
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) {
      return
    }

    const mouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      if (!isVisible) setIsVisible(true)
    }

    const mouseEnter = () => setIsVisible(true)
    const mouseLeave = () => setIsVisible(false)

    // Check hover states on interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if we are hovering a clickable/interactive element
      const isInteractive = target.closest("a, button, input, textarea, select, [role='button']")
      setIsHovering(!!isInteractive)
    }

    const handleMouseDown = () => setIsClicked(true)
    const handleMouseUp = () => setIsClicked(false)

    window.addEventListener("mousemove", mouseMove)
    window.addEventListener("mouseenter", mouseEnter)
    window.addEventListener("mouseleave", mouseLeave)
    window.addEventListener("mouseover", handleMouseOver)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", mouseMove)
      window.removeEventListener("mouseenter", mouseEnter)
      window.removeEventListener("mouseleave", mouseLeave)
      window.removeEventListener("mouseover", handleMouseOver)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [cursorX, cursorY, isVisible, reducedMotion])

  if (reducedMotion || typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
    return null
  }

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-primary/50 pointer-events-none z-[100] flex items-center justify-center mix-blend-difference"
      style={{
        x: smoothX,
        y: smoothY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        scale: isClicked ? 0.85 : isHovering ? 1.4 : isVisible ? 1 : 0,
        backgroundColor: isClicked ? "rgba(201,169,97,0.3)" : isHovering ? "rgba(201,169,97,0.15)" : "transparent",
        borderColor: isClicked ? "rgba(201,169,97,1)" : isHovering ? "rgba(201,169,97,0.8)" : "rgba(201,169,97,0.5)",
      }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <motion.div 
        className="w-1.5 h-1.5 bg-primary rounded-full"
        animate={{
          opacity: isHovering ? 0 : 1,
          scale: isHovering ? 0 : 1
        }}
      />
    </motion.div>
  )
}
