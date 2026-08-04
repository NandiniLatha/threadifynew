"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { easing } from "@/lib/motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Scissors } from "lucide-react"

interface StickyOrderCTAProps {
  tailorId: string
}

export function StickyOrderCTA({ tailorId }: StickyOrderCTAProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const handleScroll = () => {
      // Show the CTA after scrolling down a bit (e.g., past the hero section)
      if (window.scrollY > 400) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    // Initial check
    handleScroll()
    
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={easing.spring}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none"
        >
          <div className="container mx-auto max-w-4xl flex justify-center">
            <div className="bg-foreground text-background shadow-2xl rounded-2xl p-3 px-6 flex items-center justify-between gap-6 pointer-events-auto border border-border/20 backdrop-blur-md">
              <span className="font-serif font-bold text-sm md:text-base hidden sm:inline-block">
                Ready to stitch your dream outfit?
              </span>
              <Button
                onClick={() => router.push(`/design-studio?preferredTailor=${tailorId}`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold h-10 px-6 shrink-0 flex items-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                Start Custom Order
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
