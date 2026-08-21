"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { duration, easing } from "@/lib/motion"

export function InitialLoader() {
  const [loading, setLoading] = useState(true)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    // Check if we've already shown the loader this session
    const hasLoaded = sessionStorage.getItem("threadify-loaded")
    if (hasLoaded || reducedMotion) {
      setLoading(false)
      return
    }

    // Dismiss immediately upon mounting without artificial delay
    sessionStorage.setItem("threadify-loaded", "true")
    setLoading(false)
  }, [reducedMotion])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="initial-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-100%", filter: "blur(10px)" }}
          transition={{ duration: duration.fast, ease: easing.easeOut }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-label="Loading Threadify"
        >
          <div className="flex flex-col items-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-4"
            >
              {/* Thread/Needle path animation */}
              <motion.path
                d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              />
            </svg>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.fast }}
              className="text-2xl font-serif font-bold tracking-widest text-foreground"
            >
              THREADIFY
            </motion.h1>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
