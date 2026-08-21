"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Wand2,
  Scissors,
  ShieldCheck,
  MessageSquare,
  Package,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { createClient } from "@/lib/supabase/client"

interface WhyFeatureItem {
  id: string
  number: string
  title: string
  description: string
  image: string
  icon: React.ElementType
  actionType: "link" | "modal"
  href?: string
  requiresAuth?: boolean
}

const WHY_FEATURES: WhyFeatureItem[] = [
  {
    id: "ai-recognition",
    number: "01",
    title: "AI Design Recognition",
    description: "Understand fabrics, silhouettes, details, and styling from the inspiration you love.",
    image: "/images/features/feature_1_ai_scan.webp",
    icon: Wand2,
    actionType: "link",
    href: "/design-studio",
  },
  {
    id: "master-tailors",
    number: "02",
    title: "Verified Master Tailors",
    description: "Connect with carefully verified designers and tailoring professionals.",
    image: "/images/features/feature_2_tailor.webp",
    icon: Scissors,
    actionType: "link",
    href: "/explore",
  },
  {
    id: "secure-payments",
    number: "03",
    title: "Secure Payments",
    description: "Pay securely and keep your custom order protected throughout the process.",
    image: "/images/features/feature_3_secure.webp",
    icon: ShieldCheck,
    actionType: "modal",
  },
  {
    id: "live-consultations",
    number: "04",
    title: "Live Chat & Consultations",
    description: "Discuss details, adjustments, measurements, and ideas directly with your designer.",
    image: "/images/features/feature_4_chat.webp",
    icon: MessageSquare,
    actionType: "link",
    href: "/dashboard/messages",
    requiresAuth: true,
  },
  {
    id: "real-time-tracking",
    number: "05",
    title: "Real-Time Tracking",
    description: "Follow your garment from design and stitching to final completion.",
    image: "/images/features/feature_5_tracking.webp",
    icon: Package,
    actionType: "link",
    href: "/dashboard/orders",
    requiresAuth: true,
  },
  {
    id: "personalized-fashion",
    number: "06",
    title: "Personalized Fashion",
    description: "Every creation is shaped around your measurements, preferences, and style.",
    image: "/images/features/feature_6_personalized.webp",
    icon: Sparkles,
    actionType: "link",
    href: "/how-it-works/customize",
    requiresAuth: false,
  },
]

export function WhyThreadifySection() {
  const router = useRouter()
  const supabase = createClient()
  const shouldReduceMotion = usePrefersReducedMotion()
  const sectionRef = React.useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" })

  const [modalOpen, setModalOpen] = React.useState(false)
  const [notifyLoading, setNotifyLoading] = React.useState(false)
  const [notifySuccess, setNotifySuccess] = React.useState(false)
  const [activeFeatureId, setActiveFeatureId] = React.useState<string | null>(null)

  const handleFeatureClick = async (feature: WhyFeatureItem) => {
    if (feature.actionType === "modal") {
      setModalOpen(true)
      setNotifySuccess(false)
      return
    }

    setActiveFeatureId(feature.id)

    if (feature.requiresAuth) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (feature.href) {
          router.push(`/login?next=${encodeURIComponent(feature.href)}`)
        }
        return
      }
    }

    if (feature.href) {
      router.push(feature.href)
    }
  }

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 z-10 overflow-hidden"
      aria-label="Why Threadify"
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
              WHY THREADIFY
            </span>
            <span className="h-px w-6 bg-terracotta/40" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.18]">
            Crafted with technology.
            <br />
            Perfected by{" "}
            <span className="italic font-normal text-terracotta">tradition.</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground font-light tracking-wide max-w-2xl mx-auto">
            State-of-the-art technology elevating traditional bespoke tailoring.
          </p>
        </motion.div>

        {/* ─── 3x2 Editorial Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {WHY_FEATURES.map((feature, idx) => {
            const Icon = feature.icon
            const isWorking = activeFeatureId === feature.id

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{
                  duration: 0.75,
                  delay: shouldReduceMotion ? 0 : 0.1 + idx * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <button
                  onClick={() => handleFeatureClick(feature)}
                  onMouseEnter={() => {
                    if (feature.href) router.prefetch(feature.href)
                  }}
                  onFocus={() => {
                    if (feature.href) router.prefetch(feature.href)
                  }}
                  aria-label={`${feature.title}: ${feature.description}`}
                  className="group w-full h-full text-left p-4 sm:p-5 rounded-[1.5rem] bg-card/60 hover:bg-card/90 border border-border/40 hover:border-terracotta/40 shadow-sm hover:shadow-md transition-all duration-300 flex flex-row items-center gap-5 sm:gap-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
                >
                  {/* Left Column: Editorial Feature Image */}
                  <div className="relative w-24 sm:w-28 lg:w-32 aspect-[4/5] flex-shrink-0 rounded-[1.15rem] overflow-hidden bg-muted/40 border border-border/40 shadow-inner">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity" />
                  </div>

                  {/* Right Column: Information & Micro-interactions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-1">
                    <div>
                      {/* Feature Number & Icon Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center transition-colors group-hover:bg-terracotta group-hover:text-primary-foreground">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-mono font-medium text-terracotta/80 group-hover:text-terracotta">
                          {feature.number}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-base sm:text-lg font-medium text-foreground leading-snug group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-[13px] text-muted-foreground font-light leading-relaxed line-clamp-3">
                        {feature.description}
                      </p>
                    </div>

                    {/* Arrow / Spinner Indicator */}
                    <div className="pt-2 flex items-center justify-end">
                      {isWorking ? (
                        <Loader2 className="w-4 h-4 animate-spin text-terracotta" />
                      ) : (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/60 group-hover:text-terracotta group-hover:translate-x-1 transition-all duration-300">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* ─── Bottom Editorial Closing Line ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16 md:mt-20 flex items-center justify-center gap-2 text-muted-foreground"
        >
          <span className="font-serif italic text-base md:text-lg tracking-wide text-foreground/80">
            Technology understands. Tradition perfects.
          </span>
          <span className="text-terracotta/80 text-lg select-none">♡</span>
        </motion.div>

        {/* ─── Secure Payments Modal ─────────────────────────────────────── */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border/60 rounded-[2rem] p-8 sm:p-10 shadow-2xl max-w-md w-full relative"
              >
                <button
                  onClick={() => setModalOpen(false)}
                  aria-label="Close modal"
                  className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors focus-visible:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center mb-6 shadow-inner">
                  <ShieldCheck className="w-7 h-7" />
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-foreground mb-3">
                  Secure Custom Payments
                </h3>

                <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-light">
                  We are finalizing our seamless payment integration. Every custom tailoring request is protected with end-to-end payment encryption and verified stage approvals.
                </p>

                {notifySuccess ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-3 font-medium"
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>You&apos;re on the priority access list.</span>
                  </motion.div>
                ) : (
                  <Button
                    onClick={() => {
                      setNotifyLoading(true)
                      setTimeout(() => {
                        setNotifyLoading(false)
                        setNotifySuccess(true)
                      }, 1000)
                    }}
                    disabled={notifyLoading}
                    className="w-full h-12 bg-primary text-primary-foreground font-serif text-base font-medium rounded-xl shadow-md hover:bg-primary/90 transition-all"
                  >
                    {notifyLoading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : null}
                    Request Priority Notification
                  </Button>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
