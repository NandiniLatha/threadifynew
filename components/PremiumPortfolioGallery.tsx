"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react"
import Image from "next/image"
import Link from "next/link"
import {
  motion,
  AnimatePresence,
} from "framer-motion"
import { Heart, ArrowRight } from "lucide-react"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { LuxuryShowroomBackground } from "./luxury/LuxuryShowroomBackground"

// Premium curated fashion cards
const CARDS = [
  {
    id: 1,
    title: "Crimson Bridal Lehenga",
    category: "Bridal Couture",
    designer: "Aisha Bridal",
    price: "₹45,000+",
    likes: 5400,
    image: "/images/inspiration/bridal_lehenga.webp",
    tags: ["Bridal", "Zardosi", "Silk"],
    badge: "✨ AI Recommended",
    accent: "from-red-950/90 via-red-900/40 to-transparent",
  },
  {
    id: 2,
    title: "Ivory Banarasi Saree",
    category: "Luxury Sarees",
    designer: "Zoya Saree Studio",
    price: "₹18,000+",
    likes: 3100,
    image: "/images/inspiration/banarasi_saree.webp",
    tags: ["Silk", "Brocade", "Wedding"],
    badge: "👑 Luxury Collection",
    accent: "from-amber-950/90 via-amber-900/40 to-transparent",
  },
  {
    id: 3,
    title: "Midnight Sequined Gown",
    category: "Party Wear",
    designer: "Stella Fits",
    price: "₹9,500+",
    likes: 2100,
    image: "/images/inspiration/party_wear_dress.webp",
    tags: ["Sequins", "Evening", "Glamour"],
    badge: "🔥 Trending",
    accent: "from-indigo-950/90 via-indigo-900/40 to-transparent",
  },
  {
    id: 4,
    title: "Charcoal Bespoke Suit",
    category: "Menswear",
    designer: "Royal Knot",
    price: "₹22,000+",
    likes: 3800,
    image: "/images/inspiration/three_piece_suit.webp",
    tags: ["Bespoke", "Wool", "Formal"],
    badge: "🧵 Master Tailor",
    accent: "from-slate-950/90 via-slate-900/40 to-transparent",
  },
  {
    id: 5,
    title: "Royal Ivory Sherwani",
    category: "Sherwanis",
    designer: "Maharaja Groom",
    price: "₹35,000+",
    likes: 4500,
    image: "/images/inspiration/sherwani.webp",
    tags: ["Groom", "Embroidery", "Royal"],
    badge: "🏆 Best Seller",
    accent: "from-stone-950/90 via-stone-900/40 to-transparent",
  },
  {
    id: 6,
    title: "Silk Slip Evening Dress",
    category: "Western Wear",
    designer: "Stella Fits",
    price: "₹7,500+",
    likes: 4100,
    image: "/images/inspiration/wedding_gown.webp",
    tags: ["Silk", "Minimal", "Elegant"],
    badge: "✨ AI Recommended",
    accent: "from-rose-950/90 via-rose-900/40 to-transparent",
  },
  {
    id: 7,
    title: "Emerald Anarkali Suit",
    category: "Ethnic Wear",
    designer: "Avani Couture",
    price: "₹12,000+",
    likes: 2800,
    image: "/images/inspiration/half_saree.webp",
    tags: ["Anarkali", "Flowy", "Festive"],
    badge: "👑 Luxury Collection",
    accent: "from-emerald-950/90 via-emerald-900/40 to-transparent",
  },
]

const TOTAL = CARDS.length
const AUTO_ROTATE_INTERVAL = 4000

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

export function PremiumPortfolioGallery() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [likedCards, setLikedCards] = useState<Record<number, boolean>>({})

  const dragStartX = useRef(0)
  const dragDelta = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  // ── Auto rotate ──────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (isPaused || reducedMotion) return
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => mod(prev + 1, TOTAL))
    }, AUTO_ROTATE_INTERVAL)
  }, [isPaused, reducedMotion])

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startTimer])

  const goTo = useCallback((index: number) => {
    setActiveIndex(mod(index, TOTAL))
    if (timerRef.current) clearInterval(timerRef.current)
    if (!isPaused && !reducedMotion) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => mod(prev + 1, TOTAL))
      }, AUTO_ROTATE_INTERVAL)
    }
  }, [isPaused, reducedMotion])

  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex])
  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex])

  // ── Interaction Handlers ─────────────────────────────────
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX
    dragDelta.current = 0
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    const x = "touches" in e ? e.touches[0].clientX : e.clientX
    dragDelta.current = x - dragStartX.current
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    const threshold = 60
    if (dragDelta.current < -threshold) next()
    else if (dragDelta.current > threshold) prev()
  }

  // Keyboard navigation — passive listener for scroll performance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handleKeyDown, { passive: true })
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [prev, next])

  // Mouse wheel scroll to slide
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 20 || Math.abs(e.deltaY) > 20) {
      if (e.deltaX > 20 || e.deltaY > 20) {
        next()
      } else {
        prev()
      }
    }
  }

  // Like card toggle
  const toggleLike = (cardId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  // ── Mobile Responsive Visual Counts ──────────────────────
  const getVisibleSlots = () => {
    if (typeof window === "undefined") return 3
    const width = window.innerWidth
    if (width < 640) return 1 // Mobile: show active card and immediate neighbors peek
    if (width < 1024) return 2 // Tablet: show active + 2 neighbors on each side
    return 3 // Desktop: show active + 3 neighbors on each side
  }

  const [visibleSlots, setVisibleSlots] = useState(3)
  useEffect(() => {
    const handleResize = () => setVisibleSlots(getVisibleSlots())
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (reducedMotion) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-8 relative z-10">
        {CARDS.slice(0, 4).map((card) => (
          <div
            key={card.id}
            className="relative aspect-[3/4.2] rounded-[2rem] overflow-hidden border border-white/10 bg-black"
          >
            <Image src={card.image} alt={card.title} fill className="object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${card.accent} opacity-70`} />
            <div className="absolute bottom-0 left-0 p-6 text-white w-full">
              <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest font-bold">
                {card.category}
              </span>
              <p className="font-serif font-bold text-lg mt-2">{card.title}</p>
              <p className="text-xs text-white/50">{card.designer}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full overflow-hidden select-none bg-black py-20 min-h-[660px] flex items-center justify-center"
    >
      {/* Immersive Showroom Background */}
      <LuxuryShowroomBackground activeIndex={activeIndex} totalCards={TOTAL} />

      {/* 3D Stage */}
      <div
        className="relative w-full h-[520px] md:h-[600px] flex items-center justify-center"
        style={{ perspective: "1600px" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); handleDragEnd() }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {CARDS.map((card, idx) => {
            // Shortest circular offset path
            let offset = idx - activeIndex
            if (offset > TOTAL / 2) offset -= TOTAL
            if (offset < -TOTAL / 2) offset += TOTAL

            const absOffset = Math.abs(offset)
            if (absOffset > visibleSlots) return null

            const isCenter = offset === 0

            // 3D positioning on circular locus
            const theta = (offset / TOTAL) * (2 * Math.PI)
            const radius = typeof window !== "undefined" && window.innerWidth < 768 ? 200 : 420
            
            const x = Math.sin(theta) * radius
            const z = isCenter ? 140 : Math.cos(theta) * radius - radius - 100 * absOffset
            const scale = isCenter ? 1.05 : Math.max(0.65, 1 - absOffset * 0.12)
            const opacity = isCenter ? 1 : Math.max(0.35, 0.7 - absOffset * 0.15)
            const rotateY = offset * -28 // tilt toward center

            // Lighting shadow mapping
            const shadow = isCenter
              ? "0 35px 80px -15px rgba(217, 119, 6, 0.25), 0 0 60px rgba(251, 191, 36, 0.08)"
              : "0 10px 40px rgba(0,0,0,0.5)"

            // Visual filters
            const blur = isCenter ? 0 : Math.min(8, absOffset * 2.5)
            const saturate = isCenter ? 1 : Math.max(0.3, 0.8 - absOffset * 0.2)

            return (
              <motion.div
                key={card.id}
                onClick={() => {
                  if (!isCenter) goTo(idx)
                }}
                className={`absolute ${isCenter ? "z-30 cursor-default" : "z-10 cursor-pointer"}`}
                animate={{
                  x,
                  z,
                  rotateY,
                  scale,
                  opacity,
                  boxShadow: shadow,
                  filter: `blur(${blur}px) saturate(${saturate})`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 24,
                  mass: 0.9,
                }}
                style={{
                  transformStyle: "preserve-3d",
                  borderRadius: "2rem",
                }}
                whileHover={
                  isCenter
                    ? { y: -10, scale: 1.07 }
                    : { scale: scale + 0.05, opacity: opacity + 0.15 }
                }
              >
                {/* Individual Card */}
                <div
                  className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-xl group
                    ${isCenter ? "w-[280px] md:w-[350px] h-[400px] md:h-[500px]" : "w-[200px] md:w-[250px] h-[280px] md:h-[350px]"}
                  `}
                  style={{
                    transition: "width 0.4s ease, height 0.4s ease",
                  }}
                >
                  {/* Glass reflection shine effect */}
                  <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />

                  {/* Image */}
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    sizes="(max-width: 768px) 240px, 400px"
                    priority={isCenter}
                  />

                  {/* Dynamic Dark Gradient Backdrop */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${card.accent} pointer-events-none opacity-85 z-10`} />

                  {/* Active Card Content */}
                  <AnimatePresence>
                    {isCenter && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col justify-end z-20 h-full bg-gradient-to-t from-black/95 via-black/40 to-transparent"
                      >
                        {/* Floating AI Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 rounded-full bg-black/60 border border-primary/30 text-[9px] font-bold text-primary uppercase tracking-widest">
                            {card.badge}
                          </span>
                        </div>

                        {/* Title block */}
                        <div>
                          <h3 className="font-serif text-white text-xl md:text-2xl font-bold leading-tight tracking-wide drop-shadow-md">
                            {card.title}
                          </h3>
                          <p className="text-white/60 text-xs mt-1 uppercase tracking-wider font-semibold">
                            {card.category} &bull; <span className="text-primary font-medium">{card.designer}</span>
                          </p>
                        </div>

                        {/* Floating tags */}
                        <div className="flex flex-wrap gap-1.5 my-4">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/50 tracking-wider"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Cost & Heart Favorites & Button CTAs */}
                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-widest text-white/40">Est. Price</span>
                            <span className="text-white font-bold text-lg">{card.price}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Like heart */}
                            <motion.button
                              onClick={(e) => toggleLike(card.id, e)}
                              whileTap={{ scale: 0.8 }}
                              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
                            >
                              <Heart
                                className={`w-4 h-4 transition-colors ${
                                  likedCards[card.id] ? "fill-red-500 text-red-500" : "text-white/60"
                                }`}
                              />
                            </motion.button>

                            {/* Frosty Get Made CTA */}
                            <Link href="/inspiration" onClick={(e) => e.stopPropagation()}>
                              <button className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_4px_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_4px_20px_rgba(var(--primary-rgb),0.5)]">
                                Custom Order
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inactive Card Content */}
                  {!isCenter && (
                    <div className="absolute inset-x-0 bottom-0 p-4 z-20 text-center bg-gradient-to-t from-black via-black/30 to-transparent">
                      <p className="text-white font-serif text-xs font-bold truncate">
                        {card.title}
                      </p>
                      <p className="text-primary text-[9px] font-bold uppercase tracking-widest mt-0.5 truncate">
                        {card.category}
                      </p>
                    </div>
                  )}

                  {/* Spotlight rim line */}
                  {isCenter && (
                    <div className="absolute inset-0 rounded-[2rem] border-2 border-primary/40 pointer-events-none z-30" />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
