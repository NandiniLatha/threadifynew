"use client"

import * as React from "react"
import { motion,  useMotionTemplate, AnimatePresence } from "framer-motion"
import { Star } from "lucide-react"
import Link from "next/link"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { cn } from "@/lib/utils"
import { duration, easing } from "@/lib/motion"
import { useMouseTilt } from "@/hooks/useMouseTilt"

export interface LuxuryDesignerCardProps {
  id: string
  name: string
  specialty: string
  rating: number
  reviews: number
  orders: number
  avatarBg: string
}

export function LuxuryDesignerCard({ tailor }: { tailor: LuxuryDesignerCardProps }) {
  const reducedMotion = usePrefersReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)
  
  // Reusable 3D Tilt & Glow hook
  const {
    rotateX,
    rotateY,
    glowX,
    glowY,
    isHovered,
    handleMouseMove,
    handleMouseLeave,
  } = useMouseTilt(ref, { maxRotateX: 10, maxRotateY: 10 })

  const spotlightBg = useMotionTemplate`radial-gradient(400px circle at ${glowX}px ${glowY}px, rgba(201,169,97,0.1), transparent 40%)`

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: duration.base, ease: easing.easeOut }}
      className="group relative flex flex-col p-8 rounded-[2rem] border border-border/40 bg-background/40 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:border-primary/30 transition-colors cursor-pointer w-full text-center overflow-hidden"
    >
      {/* Interactive Glow Spotlight */}
      {!reducedMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: spotlightBg,
          }}
        />
      )}

      {/* Glassmorphism Inner Shadow */}
      <div className="absolute inset-0 rounded-[2rem] pointer-events-none border border-white/10 mix-blend-overlay z-0" />

      <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
        {/* Avatar */}
        <motion.div 
          className={cn(
            "w-24 h-24 rounded-full mx-auto bg-gradient-to-tr flex items-center justify-center mb-6 shadow-inner",
            tailor.avatarBg
          )}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="font-serif text-3xl font-bold text-foreground drop-shadow-sm">
            {tailor.name.split(" ").map(n => n[0]).join("")}
          </span>
        </motion.div>
        
        {/* Content */}
        <h3 className="text-xl font-serif font-bold text-foreground tracking-tight mb-1">{tailor.name}</h3>
        <p className="text-sm text-muted-foreground/80 font-medium min-h-[40px] px-4 leading-relaxed">{tailor.specialty}</p>

        {/* Animated Stars */}
        <div className="flex items-center justify-center space-x-1.5 mt-6 text-sm font-semibold">
          <AnimatePresence>
            {isHovered ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-center gap-1"
              >
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </motion.div>
            ) : (
              <Star className="w-5 h-5 text-amber-500/80 fill-amber-500/80 transition-colors" />
            )}
          </AnimatePresence>
          <span className="text-foreground">{tailor.rating}</span>
          <span className="text-muted-foreground font-normal">({tailor.reviews})</span>
        </div>

        <div className="mt-6 pt-6 border-t border-border/30 flex items-center justify-between text-sm text-muted-foreground">
          <span className="tracking-wide uppercase text-[10px] font-bold opacity-70">Crafted</span>
          <span className="font-bold text-foreground tracking-tight">{tailor.orders} pieces</span>
        </div>

        {/* Magnetic CTA Button Area */}
        <motion.div className="mt-8 relative" style={{ transform: "translateZ(20px)" }}>
          <Link href={`/explore`} className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 bg-primary text-primary-foreground font-serif text-sm font-bold flex items-center justify-center rounded-xl shadow-lg hover:shadow-primary/20 transition-all"
            >
              View Tailor
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}
