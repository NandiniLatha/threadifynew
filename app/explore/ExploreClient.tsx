"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Search, Star, Sparkles, TrendingUp, Trophy, Zap, Clock } from "lucide-react"
import DesignerCard from "@/components/explore/DesignerCard"
import EmptyState from "@/components/explore/EmptyState"
import { TailorConfig, CATEGORIES } from "@/lib/data/tailor-config"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { staggerContainer, fadeUp, viewportOnce } from "@/lib/variants"
import { duration, easing } from "@/lib/motion"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"

interface MappedTailor {
  id: string
  name: string
  isVerified: boolean
  rating: number
  ordersCompleted: number
  config: TailorConfig
  saved: boolean
  createdAt: string
  images: string[]
}

interface ExploreClientProps {
  initialTailors: MappedTailor[]
  recentlyBooked: MappedTailor[]
}

function ExploreClient({ initialTailors, recentlyBooked }: ExploreClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  // ── Stable callbacks ── prevent child re-renders ────────────────────────
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleSearchFocus = useCallback(() => setIsSearchFocused(true), [])
  const handleSearchBlur = useCallback(() => setIsSearchFocused(false), [])

  const handleCategoryAll = useCallback(() => setActiveCategory("All"), [])

  // Filter & Search Logic
  const filteredTailors = useMemo(() => {
    return initialTailors.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.config.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.config.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        activeCategory === "All" || t.config.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [initialTailors, searchQuery, activeCategory])

  // Sections Data
  const featuredTailor = useMemo(() => {
    if (initialTailors.length === 0) return null
    // Sort by rating desc, ordersCompleted desc
    const sorted = [...initialTailors].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating
      return b.ordersCompleted - a.ordersCompleted
    })
    return sorted[0]
  }, [initialTailors])

  const trendingDesigners = useMemo(() => {
    return [...filteredTailors].sort((a, b) => b.ordersCompleted - a.ordersCompleted)
  }, [filteredTailors])

  const luxuryDesigners = useMemo(() => {
    return filteredTailors.filter((t) => t.config.category === "Luxury Couture")
  }, [filteredTailors])

  const fastDeliveryDesigners = useMemo(() => {
    // Parse responseTime helper for sorting (simulated speed sorting)
    const getHours = (t: MappedTailor) => {
      const match = t.config.responseTime.match(/\d+/)
      return match ? parseInt(match[0]) : 24
    }
    return [...filteredTailors].sort((a, b) => getHours(a) - getHours(b))
  }, [filteredTailors])

  const topRatedDesigners = useMemo(() => {
    return [...filteredTailors].sort((a, b) => b.rating - a.rating)
  }, [filteredTailors])

  const newlyJoinedDesigners = useMemo(() => {
    return [...filteredTailors].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [filteredTailors])

  // Fallback Recommendations when filter returns nothing
  const recommendedDesigners = useMemo(() => {
    if (filteredTailors.length > 0) return []
    // Find closest matches from same category, or general top-rated
    return [...initialTailors]
      .filter((t) => activeCategory === "All" || t.config.category === activeCategory)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4)
  }, [initialTailors, filteredTailors, activeCategory])

  // Recently Booked or Fallback
  const bookingList = recentlyBooked.length >= 4 ? recentlyBooked : newlyJoinedDesigners.slice(0, 4)

  return (
    <div className="space-y-16">
      {/* Search and Categories Header */}
      <section className="relative py-12 px-6 bg-gradient-to-b from-muted/50 to-transparent rounded-[3rem] border border-border/40">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-foreground">
            Find the Perfect Tailor
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            Browse verified independent designers, custom tailors, and luxury couturiers.
          </p>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeUp}
            className={`relative max-w-xl mx-auto mt-8 ${isSearchFocused ? 'z-50' : 'z-20'}`}
          >
            <motion.div 
              animate={{ scale: isSearchFocused ? 1.1 : 1, color: isSearchFocused ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
              transition={{ duration: duration.fast, ease: easing.easeOut }}
              className="absolute left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
            >
              <Search className="w-5 h-5" />
            </motion.div>
            <motion.input
              type="text"
              placeholder="Search by designer name, style, location..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              animate={{
                boxShadow: isSearchFocused ? "0 4px 20px -2px rgba(201, 169, 97, 0.25)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                borderColor: isSearchFocused ? "rgba(201, 169, 97, 0.5)" : "var(--border)"
              }}
              transition={{ duration: duration.fast, ease: easing.easeOut }}
              className="w-full h-14 pl-12 pr-6 rounded-2xl bg-card border shadow-sm focus:outline-none text-foreground transition-all duration-200 placeholder:transition-opacity focus:placeholder:opacity-0"
            />
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-full left-0 right-0 mt-2 p-4 bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 text-left overflow-hidden"
                >
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Trending Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {["Bridal Couture", "Summer Linen", "Bespoke Suits", "Vintage Alterations"].map((tag) => (
                        <button 
                          key={tag}
                          className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium hover:bg-primary/20 hover:text-primary transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(tag);
                            setIsSearchFocused(false);
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Recent Searches
                    </h4>
                    <div className="flex flex-col gap-1">
                      {["Evening Gown", "Tailor in Mumbai", "Silk Blouse"].map((tag) => (
                        <button 
                          key={tag}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(tag);
                            setIsSearchFocused(false);
                          }}
                        >
                          <Search className="w-3.5 h-3.5 text-muted-foreground" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Categories Chips */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="max-w-6xl mx-auto mt-12 flex flex-wrap justify-center gap-2"
        >
          <motion.button
            variants={fadeUp}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: duration.fast, ease: easing.easeOut }}
            onClick={handleCategoryAll}
            className={`relative px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors duration-200 ${
              activeCategory === "All"
                ? "text-primary-foreground shadow-md"
                : "bg-card hover:bg-muted text-muted-foreground border border-border"
            }`}
          >
            {activeCategory === "All" && (
              <motion.div
                layoutId="activeCategoryBgExplore"
                className="absolute inset-0 bg-primary rounded-full -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            All
          </motion.button>
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: duration.fast, ease: easing.easeOut }}
              onClick={() => setActiveCategory(cat)}
              className={`relative px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors duration-200 ${
                activeCategory === cat
                  ? "text-primary-foreground shadow-md"
                  : "bg-card hover:bg-muted text-muted-foreground border border-border"
              }`}
            >
              {activeCategory === cat && (
                <motion.div
                  layoutId="activeCategoryBgExplore"
                  className="absolute inset-0 bg-primary rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {cat}
            </motion.button>
          ))}
        </motion.div>
      </section>

      {/* Featured Designer Section */}
      {featuredTailor && activeCategory === "All" && !searchQuery && (
        <section className="relative rounded-[2.5rem] overflow-hidden bg-card border border-border shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative h-[400px] lg:h-auto min-h-[300px]">
              <Image
                src={featuredTailor.config.coverImage || featuredTailor.images[0]}
                alt="Featured Tailor"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/30" />
            </div>
            <div className="p-8 lg:p-16 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> Featured Designer
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  ⭐ {featuredTailor.rating.toFixed(1)} / 5.0
                </span>
              </div>
              <h3 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
                {featuredTailor.name}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg">
                Specializing in {featuredTailor.config.specialty}. Crafting custom fits with premium materials, handpicked just for you.
              </p>
              <div className="pt-4 flex gap-4">
                <Link
                  href={`/tailor/${featuredTailor.id}`}
                  className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/25 hover:bg-primary/95 transition-all"
                >
                  Explore Collection
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid View / Results */}
      {filteredTailors.length > 0 ? (
        <div className="space-y-16">
          {/* Trending Section */}
          {trendingDesigners.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-2xl font-serif font-semibold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" /> Trending Designers
              </h3>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center"
                variants={reducedMotion ? {} : staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {trendingDesigners.slice(0, 6).map((t) => (
                  <motion.div key={t.id} variants={reducedMotion ? {} : fadeUp} className="w-full flex justify-center">
                    <DesignerCard {...t} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Luxury Designers (if any matching) */}
          {luxuryDesigners.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-2xl font-serif font-semibold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500" /> Luxury Couture
              </h3>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center"
                variants={reducedMotion ? {} : staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {luxuryDesigners.slice(0, 6).map((t) => (
                  <motion.div key={t.id} variants={reducedMotion ? {} : fadeUp} className="w-full flex justify-center">
                    <DesignerCard {...t} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Fast Delivery Section */}
          {fastDeliveryDesigners.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-2xl font-serif font-semibold flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-500" /> Fast Delivery
              </h3>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center"
                variants={reducedMotion ? {} : staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {fastDeliveryDesigners.slice(0, 6).map((t) => (
                  <motion.div key={t.id} variants={reducedMotion ? {} : fadeUp} className="w-full flex justify-center">
                    <DesignerCard {...t} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Top Rated Section */}
          {topRatedDesigners.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-2xl font-serif font-semibold flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-current" /> Top Rated
              </h3>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center"
                variants={reducedMotion ? {} : staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {topRatedDesigners.slice(0, 6).map((t) => (
                  <motion.div key={t.id} variants={reducedMotion ? {} : fadeUp} className="w-full flex justify-center">
                    <DesignerCard {...t} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Newly Joined Section */}
          {newlyJoinedDesigners.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-2xl font-serif font-semibold flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-500" /> Newly Joined
              </h3>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center"
                variants={reducedMotion ? {} : staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {newlyJoinedDesigners.slice(0, 6).map((t) => (
                  <motion.div key={t.id} variants={reducedMotion ? {} : fadeUp} className="w-full flex justify-center">
                    <DesignerCard {...t} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          <EmptyState
            categories={CATEGORIES.slice(0, 6)}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
          />

          {recommendedDesigners.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-2xl font-serif font-semibold">Recommended Designers</h3>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center"
                variants={reducedMotion ? {} : staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
              >
                {recommendedDesigners.map((t) => (
                  <motion.div key={t.id} variants={reducedMotion ? {} : fadeUp} className="w-full flex justify-center">
                    <DesignerCard {...t} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}
        </div>
      )}

      {/* Booked / Newly Joined Carousel Section */}
      {bookingList.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-border">
          <h3 className="text-2xl font-serif font-semibold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Recently Booked Designers
          </h3>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center"
            variants={reducedMotion ? {} : staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {bookingList.map((t) => (
              <motion.div key={t.id} variants={reducedMotion ? {} : fadeUp} className="w-full flex justify-center">
                <DesignerCard {...t} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}
    </div>
  )
}

export default React.memo(ExploreClient)
