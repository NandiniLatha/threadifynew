"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, useAnimation } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Sparkles, Code, Layout, Cpu, Database, Mail } from "lucide-react"

// Inline minimal SVG outlines for fashion objects
const ScissorsOutline = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-primary/30 fill-none" strokeWidth="1.5">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="8.5" y1="8.5" x2="19" y2="19" />
    <line x1="8.5" y1="15.5" x2="19" y2="5" />
  </svg>
)

const HangerOutline = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-primary/30 fill-none" strokeWidth="1.5">
    <path d="M12 2a3 3 0 0 1 3 3c0 .8-.3 1.5-.8 2L12 8.5 3.5 17A2 2 0 0 0 5 20h14a2 2 0 0 0 1.5-3L12 8.5" />
  </svg>
)

const NeedleOutline = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-primary/30 fill-none" strokeWidth="1.5" transform="rotate(45)">
    <path d="M12 2L2 12 M20 4c1 1 1 2.5 0 3.5s-2.5 1-3.5 0 M17.5 4.5l-1 1" />
  </svg>
)

const ButtonOutline = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-primary/30 fill-none" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <circle cx="9" cy="9" r="1" fill="currentColor" className="text-primary/20" />
    <circle cx="15" cy="9" r="1" fill="currentColor" className="text-primary/20" />
    <circle cx="9" cy="15" r="1" fill="currentColor" className="text-primary/20" />
    <circle cx="15" cy="15" r="1" fill="currentColor" className="text-primary/20" />
  </svg>
)

export function AboutFounder() {
  const containerRef = useRef<HTMLDivElement>(null)
  const portraitRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Cursor 3D Tilt states
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  // requestAnimationFrame cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!portraitRef.current || !isHovered) return

      const rect = portraitRef.current.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const mouseX = e.clientX - rect.left - width / 2
      const mouseY = e.clientY - rect.top - height / 2

      // Max rotation: ±10°
      const rX = -(mouseY / (height / 2)) * 10
      const rY = (mouseX / (width / 2)) * 10

      setTilt({ x: rX, y: rY })
    }

    if (isHovered) {
      window.addEventListener("mousemove", handleMouseMove)
    } else {
      setTilt({ x: 0, y: 0 })
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isHovered])

  // Canvas floating dust background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let dustParticles: Array<{
      x: number
      y: number
      size: number
      speedY: number
      opacity: number
    }> = []

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      canvas.height = canvas.parentElement?.clientHeight || 600
    }

    const init = () => {
      dustParticles = []
      for (let i = 0; i < 30; i++) {
        dustParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speedY: -(Math.random() * 0.15 + 0.05),
          opacity: Math.random() * 0.4 + 0.1,
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      dustParticles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx.fill()

        p.y += p.speedY
        if (p.y < 0) {
          p.y = canvas.height
          p.x = Math.random() * canvas.width
        }
      })
      animationId = requestAnimationFrame(draw)
    }

    resize()
    init()
    draw()

    window.addEventListener("resize", resize)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  // Viewport entrance animations
  const headingControls = useAnimation()
  const paragraphControls = useAnimation()
  const statsControls = useAnimation()
  const cardControls = useAnimation()
  const ctaControls = useAnimation()
  const portraitControls = useAnimation()

  const handleViewportEnter = async () => {
    // Staggered reveal sequence (Background is CSS)
    await portraitControls.start({ opacity: 1, scale: 1, rotateY: 0, transition: { duration: 1.1, ease: "easeOut" } })
    headingControls.start({ opacity: 1, y: 0, transition: { duration: 0.6 } })
    paragraphControls.start({ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } })
    cardControls.start({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, staggerChildren: 0.1 } })
    statsControls.start({ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } })
    ctaControls.start({ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.4 } })
  }

  // Achievement cards data
  const achievements = [
    { title: "Full Stack Developer", desc: "Expertise in React, Next.js, and modern serverless runtimes.", icon: Code },
    { title: "UI/UX Designer", desc: "Crafting beautiful luxury interactions, motions, and layouts.", icon: Layout },
    { title: "AI-Powered Engines", desc: "Integrating cognitive vision models and stable diffusion pipelines.", icon: Cpu },
    { title: "Supabase & Postgres", desc: "Building secure, scalable, and responsive real-time databases.", icon: Database },
  ]

  // Magnetic button hover logic
  const ctaRef = useRef<HTMLButtonElement>(null)
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 })
  const handleBtnMouseMove = (e: React.MouseEvent) => {
    if (!ctaRef.current) return
    const rect = ctaRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * 0.35
    const dy = (e.clientY - cy) * 0.35
    setBtnOffset({ x: dx, y: dy })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden py-24 md:py-32 bg-black flex items-center justify-center border-t border-white/5"
    >
      {/* 1. Immersive Animated Showroom Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Shifting colored background mesh blobs */}
        <motion.div
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[150px]"
          animate={{ x: [0, 50, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[160px]"
          animate={{ x: [0, -60, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[40%] right-[20%] w-[40%] h-[40%] rounded-full bg-cyan-950/10 blur-[120px]"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Canvas floating dust */}
        <canvas ref={canvasRef} className="absolute inset-0 mix-blend-screen opacity-40" />

        {/* Soft vignette overlay */}
        <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)" />
      </div>

      <motion.div
        onViewportEnter={handleViewportEnter}
        viewport={{ once: true, margin: "-100px" }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
      >
        {/* Left Column: Portrait & Floating Icons */}
        <div className="lg:col-span-5 flex justify-center relative min-h-[460px] md:min-h-[540px]">
          {/* Ambient Glow behind portrait */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/25 to-cyan-500/20 blur-[90px] mix-blend-screen pointer-events-none"
            animate={{
              scale: isHovered ? 1.25 : 1,
              opacity: [0.6, 0.8, 0.6],
              rotate: 360,
            }}
            transition={{
              scale: { duration: 0.5 },
              opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            }}
          />

          {/* Orbiting outlined fashion items */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <motion.div
              className="absolute top-6 left-12"
              animate={{ y: [0, -10, 0], x: [0, 5, 0], rotate: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ScissorsOutline />
            </motion.div>
            <motion.div
              className="absolute bottom-16 left-6"
              animate={{ y: [0, 12, 0], rotate: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <HangerOutline />
            </motion.div>
            <motion.div
              className="absolute top-16 right-10"
              animate={{ y: [0, -8, 0], x: [0, -10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <NeedleOutline />
            </motion.div>
            <motion.div
              className="absolute bottom-20 right-8"
              animate={{ y: [0, 10, 0], rotate: [0, 12, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ButtonOutline />
            </motion.div>
          </div>

          {/* Portrait Wrapper with perspective */}
          <div style={{ perspective: 1200 }} className="flex items-center justify-center w-full">
            <motion.div
              ref={portraitRef}
              initial={{ opacity: 0, scale: 0.88, rotateY: -10 }}
              animate={portraitControls}
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              }}
              onMouseEnter={() => {
                setIsHovered(true)
              }}
              onMouseLeave={() => {
                setIsHovered(false)
              }}
              className="relative w-[280px] sm:w-[360px] md:w-[420px] aspect-[4/5] rounded-[28px] p-[2px] bg-white/5 border border-white/10 overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.6)] shadow-[0_0_50px_rgba(168,85,247,0.18)] group-hover:shadow-[0_0_60px_rgba(168,85,247,0.35)] cursor-pointer flex items-center justify-center group"
            >
              <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-neutral-950/60 backdrop-blur-2xl">
                {/* Thin colored border ring */}
                <div
                  className="absolute inset-0 rounded-[26px] p-[1.5px] pointer-events-none z-30 border border-purple-500/30"
                />

                {/* Profile Photo */}
                <Image
                  src="/images/founder.webp"
                  alt="Threadify Founder Portrait"
                  fill
                  className="object-cover rounded-[26px]"
                  style={{ filter: "brightness(1.05) contrast(1.06) saturate(1.02) sepia(0.04)" }}
                  sizes="(max-width: 768px) 280px, 420px"
                  priority
                />

                {/* Ambient color tinting to blend the beige wall into a purple/blue glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-blue-900/35 to-purple-800/40 mix-blend-color-burn pointer-events-none rounded-[26px] z-10" />

                {/* Vignette to darken the edges and merge with dark UI */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_20%,rgba(10,5,25,0.6)_65%,rgba(5,2,15,0.95)_100%)] pointer-events-none rounded-[26px] z-20" />

                {/* Front shine sweep */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-25 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
              </div>

              {/* Accent light highlight ring */}
              <div className="absolute inset-0 rounded-[28px] border border-primary/20 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          </div>
        </div>

        {/* Right Column: Founder Info and Text Content */}
        <div className="lg:col-span-7 flex flex-col justify-center text-left">
          {/* Header block */}
          <div className="mb-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={headingControls}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 text-primary mb-3"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Founder & Architect
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={headingControls}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-wide text-white"
            >
              Meet the Creator
            </motion.h2>
            
            {/* Drawing gold underline */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "160px" }}
              transition={{ delay: 0.8, duration: 1 }}
              className="h-[2px] bg-gradient-to-r from-primary to-transparent mt-2"
            />
          </div>

          {/* Story Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={paragraphControls}
            className="text-white/60 text-base md:text-lg leading-relaxed font-light mb-8 max-w-2xl"
          >
            I built Threadify to bridge the gap between digital cognitive technology and the timeless artisanship of custom tailoring. By integrating predictive style engines with verified master tailors, we&apos;ve replaced the static marketplace with a living ecosystem where luxury design meets technical precision.
          </motion.p>

          {/* Achievements Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={cardControls}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl"
          >
            {achievements.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, scale: 1.01 }}
                className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md hover:border-primary/30 transition-all duration-300 flex items-start gap-4 group"
              >
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-white tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats count and CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={statsControls}
            className="flex flex-wrap items-center gap-8 md:gap-12 border-t border-white/5 pt-8"
          >
            <div className="flex gap-8">
              <div>
                <span className="text-2xl md:text-3xl font-bold text-white font-serif block">4.95</span>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-0.5">Rating</span>
              </div>
              <div className="border-l border-white/10 pl-8">
                <span className="text-2xl md:text-3xl font-bold text-white font-serif block">12k+</span>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-0.5">Lines of Code</span>
              </div>
            </div>

            {/* Magnetic Button */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={ctaControls}>
              <Link href="mailto:founder@threadify.in">
                <button
                  ref={ctaRef}
                  onMouseMove={handleBtnMouseMove}
                  onMouseLeave={() => setBtnOffset({ x: 0, y: 0 })}
                  style={{ transform: `translate(${btnOffset.x}px, ${btnOffset.y}px)` }}
                  className="flex items-center gap-2 px-6 py-4 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all group shadow-[0_4px_25px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_4px_30px_rgba(var(--primary-rgb),0.5)] cursor-pointer"
                >
                  Let&apos;s Connect
                  <Mail className="w-4 h-4 transition-transform group-hover:scale-110" />
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
