"use client"

import * as React from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { duration, easing } from "@/lib/motion"

interface PortfolioLightboxProps {
  images: string[]
  tailorName: string
}

export function PortfolioLightbox({ images, tailorName }: PortfolioLightboxProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedIndex(null)
      }
    }
    if (selectedIndex !== null) {
      window.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [selectedIndex])

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img: string, i: number) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className="aspect-[3/4] relative rounded-2xl overflow-hidden shadow-sm group border-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full text-left"
            aria-label={`View ${tailorName} portfolio image ${i + 1}`}
          >
            <Image
              src={img}
              alt={`${tailorName} portfolio item ${i + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedIndex(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: duration.base, ease: easing.easeOut }}
              className="relative z-10 max-w-4xl w-full h-[80vh] bg-transparent flex flex-col items-center justify-center"
            >
              <button
                className="absolute -top-12 right-0 md:-right-12 p-2 text-foreground/50 hover:text-foreground transition-colors bg-background/50 rounded-full backdrop-blur-md"
                onClick={() => setSelectedIndex(null)}
                aria-label="Close lightbox"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
                <Image
                  src={images[selectedIndex]}
                  alt={`${tailorName} portfolio item ${selectedIndex + 1} expanded`}
                  fill
                  className="object-contain"
                  quality={100}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
