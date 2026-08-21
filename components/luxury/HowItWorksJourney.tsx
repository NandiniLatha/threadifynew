"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import { 
  Upload, 
  Sparkles, 
  Sliders, 
  IndianRupee, 
  Users, 
  HeartHandshake,
  ArrowRight
} from "lucide-react"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

interface JourneyStep {
  number: string
  title: string
  description: string
  image: string
  icon: React.ElementType
  href: string
  isFinal?: boolean
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    number: "01",
    title: "Upload Inspiration",
    description: "Share an outfit image that you love.",
    image: "/images/journey/step_1_upload.jpg",
    icon: Upload,
    href: "/how-it-works/upload",
  },
  {
    number: "02",
    title: "AI Analysis",
    description: "Understand the garment, style, details, and design characteristics.",
    image: "/images/journey/step_2_ai.jpg",
    icon: Sparkles,
    href: "/design-studio",
  },
  {
    number: "03",
    title: "Customize Design",
    description: "Tell us what you'd like to change or add.",
    image: "/images/journey/step_3_customize.jpg",
    icon: Sliders,
    href: "/how-it-works/customize",
  },
  {
    number: "04",
    title: "Get Your Quote",
    description: "Receive a clear, transparent price quote.",
    image: "/images/journey/step_4_quote.jpg",
    icon: IndianRupee,
    href: "/how-it-works/quotations",
  },
  {
    number: "05",
    title: "Choose Your Designer",
    description: "Find the right designer based on your style and requirements.",
    image: "/images/journey/step_5_designer.jpg",
    icon: Users,
    href: "/explore",
  },
  {
    number: "06",
    title: "Wear Your Craft",
    description: "Receive your custom creation, made just for you.",
    image: "/images/journey/step_6_wear.jpg",
    icon: HeartHandshake,
    href: "/how-it-works/wear",
    isFinal: true,
  },
]

export function HowItWorksJourney() {
  const router = useRouter()
  const shouldReduceMotion = usePrefersReducedMotion()
  const sectionRef = React.useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" })
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)

  const handleNavigate = (step: JourneyStep) => {
    router.push(step.href)
  }

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden z-10"
      aria-label="How Threadify Works"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-20"
        >
          <div className="inline-flex items-center justify-center gap-2.5 mb-4">
            <span className="h-px w-6 bg-terracotta/40" />
            <span className="text-[11px] md:text-xs font-semibold tracking-[0.25em] uppercase text-terracotta">
              HOW THREADIFY WORKS
            </span>
            <span className="h-px w-6 bg-terracotta/40" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.15]">
            From inspiration <span className="italic font-normal text-terracotta">to creation.</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground font-light tracking-wide">
            Your idea. Our technology. Expert hands.
          </p>
        </motion.div>

        {/* ─── DESKTOP HORIZONTAL JOURNEY (lg & up) ──────────────────────── */}
        <div className="hidden lg:block relative">
          {/* Connecting Sewing Thread Line (Desktop) */}
          <div className="absolute top-[108px] left-0 w-full pointer-events-none z-0" aria-hidden="true">
            <svg
              className="w-full h-12 overflow-visible"
              viewBox="0 0 1100 48"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Subtle background thread line */}
              <path
                d="M 20 24 C 200 18, 400 30, 550 24 C 700 18, 900 30, 1080 24"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeDasharray="4 4"
                className="text-terracotta/25"
              />
              {/* Animated drawing thread line */}
              <motion.path
                d="M 20 24 C 200 18, 400 30, 550 24 C 700 18, 900 30, 1080 24"
                stroke="hsl(var(--terracotta))"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: 0.85 }}
                animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
            </svg>
          </div>

          {/* 6 Step Columns */}
          <div className="grid grid-cols-6 gap-4 xl:gap-6 relative z-10">
            {JOURNEY_STEPS.map((step, idx) => {
              const Icon = step.icon

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 35 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 35 }}
                  transition={{
                    duration: 0.8,
                    delay: shouldReduceMotion ? 0 : 0.15 + idx * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex flex-col items-center"
                >
                  {/* Step Actionable / Interactive Container */}
                  <button
                    onClick={() => handleNavigate(step)}
                    onMouseEnter={() => {
                      setHoveredIdx(idx)
                      router.prefetch(step.href)
                    }}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onFocus={() => {
                      setHoveredIdx(idx)
                      router.prefetch(step.href)
                    }}
                    onBlur={() => setHoveredIdx(null)}
                    aria-label={`Step ${step.number}: ${step.title}. ${step.description}`}
                    className="group w-full flex flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-2xl transition-all duration-300 cursor-pointer"
                  >
                    {/* Image Card Container */}
                    <div className="relative w-full aspect-[4/5] rounded-[1.35rem] overflow-hidden bg-muted/40 border border-border/40 shadow-sm transition-all duration-500 group-hover:border-terracotta/50 group-hover:shadow-md mb-4">
                      {/* Image */}
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        sizes="(max-width: 1280px) 16vw, 200px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />

                      {/* Gentle Editorial Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5 opacity-40 group-hover:opacity-20 transition-opacity duration-500" />

                      {/* Circular Icon Pill Badge */}
                      <div
                        className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-background/90 backdrop-blur-md border border-border/60 flex items-center justify-center text-foreground shadow-sm transition-all duration-300 group-hover:bg-terracotta group-hover:text-primary-foreground group-hover:scale-105"
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Step Number */}
                    <span className="text-xs font-mono font-semibold tracking-wider text-terracotta/90 mb-1 transition-colors group-hover:text-terracotta">
                      {step.number}
                    </span>

                    {/* Step Title */}
                    <h3 className="font-serif text-base xl:text-lg font-medium text-foreground leading-snug transition-colors group-hover:text-primary mb-1.5 line-clamp-2">
                      {step.title}
                    </h3>

                    {/* Step Description */}
                    <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-3 px-1">
                      {step.description}
                    </p>

                    {/* Subtle Explore arrow hint on hover */}
                    <div className="mt-2 text-[11px] font-medium text-terracotta inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ─── TABLET HORIZONTALLY SCROLLABLE TRACK (md to lg) ────────────── */}
        <div className="hidden md:block lg:hidden relative">
          <div className="flex gap-5 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory">
            {JOURNEY_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.number}
                  className="flex-none w-[200px] snap-start"
                >
                  <button
                    onClick={() => handleNavigate(step)}
                    className="group w-full flex flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded-2xl text-left"
                  >
                    <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-muted/40 border border-border/40 mb-3 shadow-sm">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        sizes="200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div
                        className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-background/90 backdrop-blur-md border border-border/60 flex items-center justify-center text-foreground shadow-sm group-hover:bg-terracotta group-hover:text-primary-foreground transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-terracotta mb-1">
                      {step.number}
                    </span>
                    <h3 className="font-serif text-base font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-light leading-relaxed">
                      {step.description}
                    </p>
                  </button>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-2 text-[11px] text-muted-foreground font-light">
            Scroll horizontally to view the full journey →
          </div>
        </div>

        {/* ─── MOBILE VERTICAL CONNECTED JOURNEY (< md) ───────────────────── */}
        <div className="block md:hidden relative pl-6 sm:pl-8">
          {/* Vertical Connecting Thread Line */}
          <div
            className="absolute left-[27px] sm:left-[35px] top-6 bottom-10 w-0.5 border-l-2 border-dashed border-terracotta/40 pointer-events-none z-0"
            aria-hidden="true"
          />

          <div className="space-y-8 relative z-10">
            {JOURNEY_STEPS.map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.08 }}
                  className="relative"
                >
                  {/* Thread Node Dot */}
                  <div
                    className="absolute -left-[27px] sm:-left-[35px] top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-terracotta flex items-center justify-center z-20 shadow-sm"
                    aria-hidden="true"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                  </div>

                  <button
                    onClick={() => handleNavigate(step)}
                    className="group w-full flex items-start gap-4 p-3.5 rounded-2xl bg-card/40 border border-border/30 hover:border-terracotta/40 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                  >
                    {/* Small Thumbnail */}
                    <div className="relative w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted/40 border border-border/40">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        sizes="80px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-foreground">
                        <Icon className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold text-terracotta">
                          {step.number}
                        </span>
                        <h3 className="font-serif text-base font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">
                        {step.description}
                      </p>
                      <div className="mt-2 text-[11px] font-medium text-terracotta inline-flex items-center gap-1">
                        <span>Continue</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
