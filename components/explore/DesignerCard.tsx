"use client"

import React, { useRef, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  motion,
  
  useMotionTemplate,
  AnimatePresence,
} from "framer-motion"
import {
  Star,
  Bookmark,
  BadgeCheck,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Scissors,
  TrendingUp,
  Zap,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MessageCircle,
  Package,
} from "lucide-react"
import { TailorConfig } from "@/lib/data/tailor-config"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { duration, easing } from "@/lib/motion"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useMouseTilt } from "@/hooks/useMouseTilt"

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
interface DesignerCardProps {
  id: string
  name: string
  isVerified: boolean
  rating: number
  ordersCompleted: number
  config: TailorConfig
  initialSaved?: boolean
  images: string[]
  badge?: "top-rated" | "ai-recommended" | "new" | null
  responseMinutes?: number
}

// ─────────────────────────────────────────────────────────────
//  LuxuryImage — skeleton + fallback
// ─────────────────────────────────────────────────────────────
// Memoised: re-renders only when src/alt change
const LuxuryImage = React.memo(function LuxuryImage({
  src,
  alt,
  fill,
  className = "",
  fallbackText,
  sizes,
  priority,
  style,
}: {
  src: string
  alt: string
  fill?: boolean
  className?: string
  fallbackText?: string
  sizes?: string
  priority?: boolean
  style?: React.CSSProperties
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [retryCount, setRetryCount] = useState(0)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setCurrentSrc(src)
    setHasError(!src || (!src.startsWith("http") && !src.startsWith("/")))
    setIsLoading(true)
    setRetryCount(0)
  }, [src])

  const handleImageError = () => {
    if (retryCount === 0 && src && src.includes("unsplash.com")) {
      const hash = alt.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const w = fill ? 800 : 400
      const h = fill ? 600 : 600
      setCurrentSrc(`https://picsum.photos/${w}/${h}?random=${hash}`)
      setRetryCount(1)
    } else {
      setHasError(true)
      setIsLoading(false)
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[inherit] flex items-center justify-center">
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 bg-neutral-800 animate-pulse" />
      )}
      {hasError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit]"
          style={{ background: "linear-gradient(135deg, #1c1814, #141210)" }}>
          {fallbackText ? (
            <span className="text-base font-bold font-serif tracking-wider"
              style={{ color: "rgba(201,169,97,0.6)" }}>
              {fallbackText.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          ) : (
            <Scissors className="w-5 h-5" style={{ color: "rgba(201,169,97,0.3)" }} />
          )}
        </div>
      ) : (
        <Image
          src={currentSrc}
          alt={alt}
          fill={fill}
          className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
          onLoad={() => setIsLoading(false)}
          onError={handleImageError}
          sizes={sizes}
          priority={priority}
          style={style}
        />
      )}
    </div>
  )
})

// ─────────────────────────────────────────────────────────────
//  Premium Previous Work Mini-Card  80 × 100 px
// ─────────────────────────────────────────────────────────────
function PortfolioMiniCard({
  src,
  alt,
  showExtra,
  totalExtra,
  onClick,
}: {
  src: string
  alt: string
  showExtra?: boolean
  totalExtra?: number
  onClick?: () => void
}) {
  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.()
      }}
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className="relative shrink-0 cursor-zoom-in group/mini"
      style={{ width: 76, height: 100 }}
    >
      <div
        className="absolute inset-0 rounded-[14px] overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <LuxuryImage
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover/mini:scale-110"
          sizes="76px"
        />
        {/* Hover shimmer */}
        <div className="absolute inset-0 opacity-0 group-hover/mini:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)" }} />
        {/* +N overlay */}
        {showExtra && totalExtra && totalExtra > 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[14px]"
            style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(3px)" }}>
            <span className="font-bold text-white text-sm tracking-tight">+{totalExtra}</span>
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────
//  Badge Label
// ─────────────────────────────────────────────────────────────
function BadgeLabel({ type }: { type: "top-rated" | "ai-recommended" | "new" }) {
  const map = {
    "top-rated": { label: "Top Rated", Icon: TrendingUp, color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.38)" },
    "ai-recommended": { label: "AI Pick", Icon: Sparkles, color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.38)" },
    "new": { label: "New", Icon: Zap, color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.38)" },
  }
  const { label, Icon, color, bg, border } = map[type]
  return (
    <motion.span
      initial={{ opacity: 0, x: -8, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      <Icon className="w-2.5 h-2.5" />
      {label}
    </motion.span>
  )
}

// ─────────────────────────────────────────────────────────────
//  Animated Gradient CTA Button
// ─────────────────────────────────────────────────────────────
function GradientCTAButton({
  isLoading,
  isHovered,
  onClick,
  href,
}: {
  isLoading: boolean
  isHovered: boolean
  onClick: (e: React.MouseEvent) => void
  href: string
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])
  const rippleCounter = useRef(0)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = rippleCounter.current++
    setRipples((prev) => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 900)
    onClick(e)
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="relative w-full"
    >
      {/* Animated gold gradient border */}
      <div
        className="relative w-full rounded-2xl p-[1.5px] overflow-hidden"
        style={{
          background: "linear-gradient(270deg, #c9a961, #e8c97e, #b8860b, #d4af37, #c9a961)",
          backgroundSize: "300% 300%",
          animation: "gradBorderMove 2.5s ease infinite",
          opacity: isHovered ? 1 : 0.7,
          transition: "opacity 0.3s",
        }}
      >
        <Link
          href={href}
          onClick={handleClick}
          className="relative flex items-center justify-center gap-2.5 w-full overflow-hidden rounded-[14px]"
          style={{
            height: 52,
            background: isLoading
              ? "linear-gradient(135deg,rgba(22,18,14,0.97),rgba(14,11,8,0.99))"
              : "linear-gradient(135deg,rgba(26,22,16,0.94) 0%,rgba(16,13,9,0.97) 100%)",
          }}
        >
          {/* Idle shimmer sweep */}
          {!isLoading && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,169,97,0.15) 50%, transparent 100%)", width: "60%" }}
            />
          )}

          {/* Hover glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ background: "radial-gradient(ellipse at center, rgba(201,169,97,0.12) 0%, transparent 70%)" }}
          />

          {/* Ripples */}
          <AnimatePresence>
            {ripples.map((r) => (
              <motion.span
                key={r.id}
                initial={{ scale: 0, opacity: 0.55 }}
                animate={{ scale: 8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute rounded-full pointer-events-none"
                style={{ width: 40, height: 40, left: r.x - 20, top: r.y - 20, background: "rgba(201,169,97,0.3)" }}
              />
            ))}
          </AnimatePresence>

          {/* Label */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2.5"
              >
                <motion.div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ borderColor: "rgba(201,169,97,0.25) rgba(201,169,97,0.25) rgba(201,169,97,0.25) #c9a961" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-sm font-semibold tracking-wide" style={{ color: "rgba(201,169,97,0.85)" }}>
                  Loading Collection...
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm font-bold tracking-wide" style={{ color: "#e8c97e" }}>
                  👗 View Previous Work
                </span>
                <motion.div animate={{ x: isHovered ? 4 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  <ArrowRight className="w-4 h-4" style={{ color: "#c9a961" }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress line */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="bar"
                className="absolute bottom-0 left-0 h-[2px] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                style={{ background: "linear-gradient(90deg, #c9a961, #e8c97e, #d4af37)" }}
              />
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Previous Work Modal — glassmorphic, full-detail
// ─────────────────────────────────────────────────────────────
function PortfolioModal({
  isOpen,
  onClose,
  images,
  name,
  config,
  rating,
  ordersCompleted,
  id,
  isVerified,
}: {
  isOpen: boolean
  onClose: () => void
  images: string[]
  name: string
  config: TailorConfig
  rating: number
  ordersCompleted: number
  id: string
  isVerified: boolean
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const reviewCount = config.reviewCount ?? config.happyCustomers ?? ordersCompleted

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(22px)" }}
          />

          {/* Modal shell */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 32 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-[0_40px_120px_rgba(0,0,0,0.7)] z-10 flex flex-col lg:flex-row"
            style={{
              background: "rgba(16,13,10,0.97)",
              border: "1px solid rgba(201,169,97,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.12, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
            >
              <X className="w-4 h-4" />
            </motion.button>

            {/* Left — Gallery */}
            <div className="relative w-full lg:w-[55%] shrink-0">
              <div className="relative overflow-hidden rounded-t-[2rem] lg:rounded-l-[2rem] lg:rounded-tr-none"
                style={{ height: 300 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIdx}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
                    className="absolute inset-0"
                  >
                    <LuxuryImage
                      src={images[activeIdx] || ""}
                      alt={`${name} portfolio ${activeIdx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width:1024px) 100vw, 55vw"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(16,13,10,0.7), transparent)" }} />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveIdx((p) => (p - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center z-10 hover:scale-110 transition-transform"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setActiveIdx((p) => (p + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center z-10 hover:scale-110 transition-transform"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </>
                )}

                {/* Thumbnails */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-4 z-10">
                  {images.slice(0, 8).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className="relative w-8 h-8 rounded-lg overflow-hidden transition-all"
                      style={{
                        border: i === activeIdx ? "2px solid #c9a961" : "2px solid rgba(255,255,255,0.18)",
                        opacity: i === activeIdx ? 1 : 0.55,
                        transform: i === activeIdx ? "scale(1.15)" : "scale(1)",
                      }}
                    >
                      <LuxuryImage src={img} alt="" fill className="object-cover" sizes="32px" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Details */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-5">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0"
                  style={{ border: "2px solid rgba(201,169,97,0.4)" }}>
                  <LuxuryImage src={config.profileImage} alt={name} fill className="object-cover" fallbackText={name} sizes="56px" />
                  {isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2"
                      style={{ borderColor: "rgba(16,13,10,0.97)" }}>
                      <BadgeCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-white tracking-tight leading-tight font-serif">{name}</h2>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "#c9a961" }}>{config.category}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className="w-3 h-3"
                          style={{ fill: s <= Math.round(rating) ? "#f59e0b" : "rgba(255,255,255,0.12)", color: s <= Math.round(rating) ? "#f59e0b" : "rgba(255,255,255,0.12)" }} />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {rating.toFixed(1)} · {reviewCount} reviews
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Starting", value: `₹${config.startingPrice.toLocaleString("en-IN")}` },
                  { label: "Clients", value: `${config.happyCustomers ?? ordersCompleted}` },
                  { label: "Orders", value: `${ordersCompleted}` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(201,169,97,0.07)", border: "1px solid rgba(201,169,97,0.14)" }}>
                    <p className="text-base font-bold text-white leading-none">{value}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Info rows */}
              <div className="space-y-2">
                {[
                  { Icon: MapPin, text: config.location },
                  { Icon: Scissors, text: `${config.experience} years experience` },
                  { Icon: Clock, text: config.responseTime },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "#c9a961" }} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              {config.pricing.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Popular Services
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {config.pricing.slice(0, 4).map((p, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.72)" }}>
                        {p.item}{" "}
                        <span style={{ color: "#c9a961" }}>₹{p.startingAt.toLocaleString("en-IN")}+</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col gap-2.5 mt-auto">
                <Link href={`/tailor/${id}`} onClick={onClose}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm hover:brightness-110 transition-all"
                  style={{ background: "linear-gradient(135deg, #c9a961, #e8c97e)", color: "#0f0d0a" }}>
                  <Calendar className="w-4 h-4" />
                  Book Consultation
                </Link>
                <div className="flex gap-2">
                  <Link href="https://wa.me/" target="_blank"
                    className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold hover:brightness-110 transition-all"
                    style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.22)", color: "#25d366" }}>
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Link>
                  <Link href={`/tailor/${id}`} onClick={onClose}
                    className="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.65)" }}>
                    <Package className="w-4 h-4" />
                    Full Profile
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main DesignerCard
// ─────────────────────────────────────────────────────────────
function DesignerCard({
  id,
  name,
  isVerified,
  rating,
  ordersCompleted,
  config,
  initialSaved = false,
  images,
  badge = null,
  responseMinutes,
}: DesignerCardProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)
  const [isLoadingCollection, setIsLoadingCollection] = useState(false)
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const reducedMotion = usePrefersReducedMotion()

  const portfolioImages = images.length > 0
    ? images
    : [
        config.coverImage || "/images/inspiration/bridal_lehenga.png",
        config.profileImage || "/images/fashion/designer_1.png",
      ]

  const displayImages = portfolioImages.slice(0, 4)
  const extraCount = portfolioImages.length > 4 ? portfolioImages.length - 4 : 0
  const reviewCount = config.reviewCount ?? config.happyCustomers ?? ordersCompleted

  // ── Supabase Save ────────────────────────────────────────
  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/login?next=/explore`); return }
    if (saved) {
      await supabase.from("saved_tailors").delete().match({ customer_id: user.id, tailor_id: id })
      setSaved(false)
    } else {
      await supabase.from("saved_tailors").insert({ customer_id: user.id, tailor_id: id })
      setSaved(true)
    }
    setSaving(false)
  }

  // Reusable 3D Tilt & Glow hook
  const {
    rotateX,
    rotateY,
    glowX,
    glowY,
    isHovered,
    handleMouseMove,
    handleMouseLeave,
  } = useMouseTilt(cardRef, { 
    maxRotateX: 4, 
    maxRotateY: 4,
    stiffness: 200,
    damping: 25,
  })

  const spotlightBg = useMotionTemplate`radial-gradient(400px circle at ${glowX}px ${glowY}px, rgba(201,169,97,0.07), transparent 55%)`

  // ── CTA handler ──────────────────────────────────────────
  const handleCTAClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isLoadingCollection || showPortfolioModal) return
    setIsLoadingCollection(true)
    setTimeout(() => {
      setIsLoadingCollection(false)
      setShowPortfolioModal(true)
    }, 650)
  }

  return (
    <>
      {/* CSS keyframes — injected once globally */}
      <style jsx global>{`
        @keyframes gradBorderMove {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ratingPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50%      { box-shadow: 0 0 0 5px rgba(245,158,11,0.13); }
        }
        .rating-pulse { animation: ratingPulse 2.8s ease-in-out infinite; }
        @keyframes verifiedRotate {
          0%,88%,100% { transform: rotate(0deg); }
          94%         { transform: rotate(18deg); }
        }
        .verified-rotate { animation: verifiedRotate 4s ease-in-out infinite; }
      `}</style>

      {/* ── Card ─────────────────────────────────────────────── */}
      <motion.div
        ref={cardRef}
        className="group relative flex flex-col rounded-[2rem] overflow-hidden cursor-pointer select-none"
        style={{
          width: "100%",
          maxWidth: 360,
          minHeight: 580,
          background: "linear-gradient(145deg,rgba(28,23,18,0.97) 0%,rgba(18,15,11,0.99) 100%)",
          border: "1px solid rgba(201,169,97,0.1)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
          rotateX: reducedMotion ? 0 : rotateX,
          rotateY: reducedMotion ? 0 : rotateY,
          transformPerspective: 1200,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: duration.slow, ease: easing.easeOut }}
        variants={{
          rest: { y: 0, scale: 1, boxShadow: "0 4px 24px rgba(0,0,0,0.2)" },
          hover: {
            y: -12,
            scale: 1.012,
            boxShadow: "0 32px 80px -12px rgba(201,169,97,0.24), 0 16px 48px rgba(0,0,0,0.38)",
            transition: { duration: 0.35, ease: [0.25, 0.8, 0.25, 1] },
          },
        }}
        animate={isHovered && !reducedMotion ? "hover" : "rest"}
      >
        {/* Cursor spotlight */}
        {!reducedMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{
              background: spotlightBg,
            }}
          />
        )}

        {/* Gold border glow on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[2rem] z-30"
          animate={{ boxShadow: isHovered ? "inset 0 0 0 1.5px rgba(201,169,97,0.5)" : "inset 0 0 0 1.5px rgba(201,169,97,0)" }}
          transition={{ duration: 0.3 }}
        />

        {/* Loading skeleton overlay */}
        <AnimatePresence>
          {isLoadingCollection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40 flex items-center justify-center p-6 rounded-[2rem]"
              style={{ background: "rgba(10,8,6,0.84)", backdropFilter: "blur(14px)" }}
            >
              <div className="w-full h-full flex flex-col gap-4 justify-center">
                <div className="h-32 rounded-2xl animate-pulse" style={{ background: "rgba(201,169,97,0.06)" }} />
                <div className="space-y-2.5">
                  <div className="h-4 w-3/5 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.05)", animationDelay: "0.1s" }} />
                  <div className="h-3 w-2/5 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.04)", animationDelay: "0.2s" }} />
                </div>
                <div className="flex gap-2 justify-center mt-1">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="rounded-xl animate-pulse"
                      style={{ width: 64, height: 80, background: "rgba(201,169,97,0.05)", animationDelay: `${i*0.08}s` }} />
                  ))}
                </div>
                <div className="relative h-[2px] rounded-full overflow-hidden mt-2"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    style={{ width: "60%", background: "linear-gradient(90deg, transparent, #c9a961, #e8c97e, transparent)" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Cover Image 220px ─────────────────────────────── */}
        <div className="relative w-full overflow-hidden shrink-0" style={{ height: 220 }}>
          <LuxuryImage
            src={config.coverImage || portfolioImages[0] || "https://images.unsplash.com/photo-1583391733956-6c79a17a8ee2?auto=format&fit=crop&w=800&h=600&q=80"}
            alt={`${name} cover`}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
            style={{ willChange: "transform" }}
            sizes="(max-width:768px) 100vw, 380px"
            priority
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(18,15,11,1) 0%, rgba(18,15,11,0.2) 50%, transparent 100%)" }} />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom right, rgba(0,0,0,0.18), transparent)" }} />

          {/* Badge top-left */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 max-w-[calc(100%-80px)]">
            {badge && <BadgeLabel type={badge} />}
          </div>

          {/* Availability chip */}
          <div className="absolute top-4 right-14 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md"
              style={{
                background: config.availabilityStatus === "Accepting Orders" ? "rgba(16,185,129,0.15)"
                  : config.availabilityStatus === "Limited Availability" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                border: `1px solid ${config.availabilityStatus === "Accepting Orders" ? "rgba(16,185,129,0.32)"
                  : config.availabilityStatus === "Limited Availability" ? "rgba(245,158,11,0.32)" : "rgba(239,68,68,0.32)"}`,
                color: config.availabilityStatus === "Accepting Orders" ? "#10b981"
                  : config.availabilityStatus === "Limited Availability" ? "#f59e0b" : "#ef4444",
              }}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.availabilityStatus === "Accepting Orders" ? "animate-pulse bg-emerald-400" : ""}`}
                style={{ background: config.availabilityStatus !== "Accepting Orders"
                  ? config.availabilityStatus === "Limited Availability" ? "#f59e0b" : "#ef4444"
                  : undefined }} />
              {config.availabilityStatus === "Accepting Orders" ? "Open"
                : config.availabilityStatus === "Limited Availability" ? "Limited" : "Booked"}
            </span>
          </div>

          {/* Bookmark */}
          <motion.button
            onClick={toggleSave}
            disabled={saving}
            whileHover={{ scale: 1.15, y: -2 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              border: saved ? "1px solid rgba(201,169,97,0.5)" : "1px solid rgba(255,255,255,0.14)",
            }}
            aria-label={saved ? "Remove from saved" : "Save designer"}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.div key="s" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                  <Bookmark className="w-4 h-4" style={{ fill: "#c9a961", color: "#c9a961" }} />
                </motion.div>
              ) : (
                <motion.div key="u" initial={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Bookmark className="w-4 h-4" style={{ color: "rgba(255,255,255,0.8)" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── Profile Avatar — overlaps cover ──────────────── */}
        <div className="absolute z-20 overflow-visible" style={{ top: 198, left: 20 }}>
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 12 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 22 }}
            whileHover={{ scale: 1.06 }}
            className="relative overflow-visible"
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              boxShadow: "0 8px 24px rgba(0,0,0,0.45), 0 0 0 2.5px rgba(201,169,97,0.38)",
              transform: "translateZ(40px)",
            }}
          >
            <div className="absolute inset-0 rounded-[18px] overflow-hidden">
              <LuxuryImage
                src={config.profileImage || "/images/fashion/designer_1.png"}
                alt={name}
                fill
                className="object-cover"
                fallbackText={name}
                sizes="68px"
              />
            </div>
            {isVerified && (
              <div className="verified-rotate absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 z-10"
                style={{ borderColor: "rgba(18,15,11,0.99)" }}>
                <BadgeCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Content ──────────────────────────────────────── */}
        <div className="flex flex-col flex-grow px-5 pb-5 min-w-0"
          style={{ paddingTop: 58, transform: "translateZ(20px)" }}>

          {/* Name + Rating */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-xl font-bold leading-tight tracking-tight text-white truncate" title={name}>
                {name}
              </h3>
              <p className="text-xs font-semibold uppercase tracking-widest mt-0.5" style={{ color: "#c9a961" }}>
                {config.category}
              </p>
            </div>
            <motion.div
              className="rating-pulse flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.11)", border: "1px solid rgba(245,158,11,0.26)" }}>
              <Star className="w-3 h-3" style={{ fill: "#f59e0b", color: "#f59e0b" }} />
              <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>{rating.toFixed(1)}</span>
            </motion.div>
          </div>

          {/* Location + Experience */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" style={{ color: "#c9a961" }} />
              {config.location.split(",")[0]}
            </span>
            <span className="flex items-center gap-1">
              <Scissors className="w-3 h-3 shrink-0" style={{ color: "#c9a961" }} />
              {config.experience} yrs exp
            </span>
            {responseMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                ~{responseMinutes}m reply
              </span>
            )}
          </div>

          {/* Scissors divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px dashed rgba(201,169,97,0.18)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2" style={{ background: "rgba(18,15,11,0.99)", color: "rgba(201,169,97,0.28)" }}>
                <Scissors className="w-3 h-3 rotate-90" />
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex gap-2 mb-4">
            {[
              { label: "Starting", value: `₹${config.startingPrice.toLocaleString("en-IN")}+` },
              { label: "Clients", value: `${config.happyCustomers ?? ordersCompleted}` },
              { label: "Orders", value: `${ordersCompleted}` },
            ].map(({ label, value }) => (
              <motion.div
                key={label}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl flex-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-sm font-bold text-white leading-none">{value}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide mt-0.5"
                  style={{ color: "rgba(255,255,255,0.32)" }}>{label}</span>
              </motion.div>
            ))}
          </div>

          {/* Stars + Reviews */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: star * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.4, rotate: 18 }}
                >
                  <Star className="w-3.5 h-3.5"
                    style={{ fill: star <= Math.round(rating) ? "#f59e0b" : "rgba(255,255,255,0.1)", color: star <= Math.round(rating) ? "#f59e0b" : "rgba(255,255,255,0.1)" }} />
                </motion.div>
              ))}
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{reviewCount} reviews</span>
            {rating >= 4.8 && (
              <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.11)", border: "1px solid rgba(245,158,11,0.24)", color: "#f59e0b" }}>
                Top Rated
              </span>
            )}
          </div>

          {/* Previous Work Preview 4 mini-cards */}
          {displayImages.length > 0 && (
            <div className="mb-4">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2.5"
                style={{ color: "rgba(255,255,255,0.28)" }}>
                Previous Work Preview
              </p>
              <div className="flex gap-2">
                {displayImages.map((img, idx) => (
                  <PortfolioMiniCard
                    key={idx}
                    src={img}
                    alt={`${name} portfolio ${idx + 1}`}
                    showExtra={idx === 3 && extraCount > 0}
                    totalExtra={extraCount}
                    onClick={() => setShowPortfolioModal(true)}
                  />
                ))}
                {/* Empty slot fill if < 4 images */}
                {displayImages.length < 4 &&
                  Array.from({ length: 4 - displayImages.length }).map((_, i) => (
                    <div key={`e${i}`} className="shrink-0 rounded-[14px]"
                      style={{ width: 76, height: 100, background: "rgba(255,255,255,0.025)", border: "1px dashed rgba(255,255,255,0.06)" }} />
                  ))}
              </div>
            </div>
          )}

          {/* CTA Button — full width, 52px, glass border */}
          <div className="mt-auto">
            <GradientCTAButton
              isLoading={isLoadingCollection}
              isHovered={isHovered}
              onClick={handleCTAClick}
              href={`/tailor/${id}`}
            />
          </div>
        </div>
      </motion.div>

      {/* Previous Work Modal */}
      <PortfolioModal
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        images={portfolioImages}
        name={name}
        config={config}
        rating={rating}
        ordersCompleted={ordersCompleted}
        id={id}
        isVerified={isVerified}
      />
    </>
  )
}

export default React.memo(DesignerCard)
