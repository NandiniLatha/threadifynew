"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { inspirationGallery, InspirationItem } from "@/lib/data/inspiration-gallery"
import { ChevronLeft, ChevronRight, Heart, Clock } from "lucide-react"

// Use a subset of items for the carousel to keep it manageable, or all of them.
// We'll use all of them but only show a few at a time based on distance from center.

const VISIBLE_COUNT = 5 // Number of items visible at a time (must be odd, e.g., center + 2 on each side)
const CENTER_INDEX = Math.floor(VISIBLE_COUNT / 2)

export function CarouselGallery() {
  const [items] = useState<InspirationItem[]>(inspirationGallery)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  // Auto-rotation
  useEffect(() => {
    if (isHovered) return

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [isHovered, items.length])

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (_e: unknown, { offset }: { offset: { x: number; y: number } }) => {
    const swipe = offset.x

    if (swipe < -50) {
      handleNext()
    } else if (swipe > 50) {
      handlePrev()
    }
  }

  return (
    <div 
      className="relative w-full h-[600px] flex items-center justify-center perspective-[1200px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item, index) => {
            // Calculate distance from active index, wrapping around
            const distance = (index - activeIndex + items.length) % items.length
            
            // Adjust distance to be centered around 0 (e.g., -2, -1, 0, 1, 2)
            let relativeIndex = distance
            if (relativeIndex > items.length / 2) {
              relativeIndex -= items.length
            }

            // Only render items within the visible range to improve performance
            if (Math.abs(relativeIndex) > CENTER_INDEX) return null

            const isCenter = relativeIndex === 0
            
            // Animation values based on position
            const zIndex = items.length - Math.abs(relativeIndex)
            const scale = isCenter ? 1 : 0.8 - Math.abs(relativeIndex) * 0.1
            const opacity = isCenter ? 1 : 1 - Math.abs(relativeIndex) * 0.3
            const rotateY = relativeIndex * -15 // Tilt side cards
            const xOffset = relativeIndex * 180 // Spacing between cards

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8, x: xOffset, rotateY: rotateY }}
                animate={{
                  opacity,
                  scale,
                  x: xOffset,
                  y: isCenter ? 0 : 20, // push side cards down slightly
                  rotateY,
                  zIndex,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                  mass: 1,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (!isCenter) {
                    setActiveIndex(index)
                  }
                }}
                className={`absolute w-[300px] sm:w-[350px] md:w-[400px] h-[500px] rounded-2xl overflow-hidden cursor-pointer shadow-2xl ${isCenter ? 'ring-2 ring-primary/50 ring-offset-4 ring-offset-background' : ''}`}
                style={{
                  transformStyle: 'preserve-3d',
                  boxShadow: isCenter 
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="relative w-full h-full bg-muted group">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-700 ease-out"
                    loading="lazy"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = item.fallback
                    }}
                  />
                  
                  {/* Overlay for inactive cards */}
                  {!isCenter && (
                    <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
                  )}

                  {/* Gradient Overlay & Content for Center Card */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent transition-opacity duration-500 ${isCenter ? 'opacity-100' : 'opacity-0'}`} />
                  
                  {isCenter && (
                    <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end h-full">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/90 text-primary-foreground mb-3 backdrop-blur-md">
                          {item.category}
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-foreground mb-2 drop-shadow-md leading-tight">
                          {item.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-foreground/80 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          <span className="flex items-center gap-1.5 bg-background/50 backdrop-blur-md px-2 py-1 rounded-md">
                            <Heart className="w-4 h-4 text-rose-400" />
                            {item.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1.5 bg-background/50 backdrop-blur-md px-2 py-1 rounded-md">
                            <Clock className="w-4 h-4 text-primary" />
                            {item.estimatedDelivery}
                          </span>
                        </div>
                        
                        <Link
                          href={`/design-studio?inspiration=${item.id}`}
                          className="flex items-center justify-center w-full py-3.5 rounded-xl bg-background/90 hover:bg-background text-foreground font-semibold shadow-lg transition-all duration-300 hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 border border-border/50 backdrop-blur-md opacity-0 group-hover:opacity-100 delay-150"
                        >
                          Customize This Design
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        <button
          onClick={handlePrev}
          className="p-3 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-md border border-border/50 text-foreground transition-all hover:scale-110 active:scale-90"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeIndex 
                  ? "w-6 bg-primary" 
                  : "bg-foreground/20 hover:bg-foreground/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-3 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-md border border-border/50 text-foreground transition-all hover:scale-110 active:scale-90"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
