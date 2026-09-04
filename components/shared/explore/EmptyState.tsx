"use client"

import React from "react"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { staggerContainer, fadeUp } from "@/lib/variants"
import { duration, easing } from "@/lib/motion"

interface EmptyStateProps {
  categories: string[]
  activeCategory: string
  onSelectCategory: (category: string) => void
}

export default function EmptyState({
  categories,
  activeCategory,
  onSelectCategory
}: EmptyStateProps) {
  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/30 rounded-[2rem] border border-dashed border-border"
    >
      <motion.div variants={fadeUp} className="mb-6 relative w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-muted-foreground/30">
          <motion.circle 
            cx="50" cy="50" r="40" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: duration.loop, ease: "easeInOut" }}
          />
          {/* A folded fabric shape */}
          <motion.path
            d="M 30,40 L 70,40 L 60,70 L 20,70 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: duration.loopFast, delay: 0.5, ease: easing.easeOut }}
          />
          {/* Thread swooping over it */}
          <motion.path
            d="M 10,50 C 30,20 70,10 80,60 C 85,85 50,90 40,75"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: duration.loop, ease: easing.easeOut, delay: 1 }}
          />
          {/* Needle at the end of the thread */}
          <motion.path
            d="M 40,75 L 32,88"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: duration.slow, ease: easing.easeOut, delay: 2.8 }}
          />
          <motion.circle
            cx="40" cy="75" r="1.5"
            stroke="hsl(var(--foreground))"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: duration.base, delay: 2.8 }}
          />
        </svg>
      </motion.div>
      
      <motion.h3 variants={fadeUp} className="text-xl font-semibold mb-2">
        No exact matches found
      </motion.h3>
      
      <motion.p variants={fadeUp} className="text-muted-foreground max-w-md mb-8 text-sm">
        We couldn&apos;t find any designers matching &quot;{activeCategory}&quot; at the moment. Try exploring other popular categories below:
      </motion.p>
      
      <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 max-w-2xl">
        {categories.map((category, idx) => (
          <motion.button
            key={category}
            onClick={() => onSelectCategory(category)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 15px rgba(201,169,97,0.3)", "0px 0px 0px rgba(0,0,0,0)"]
            }}
            transition={{
              boxShadow: {
                duration: duration.loop,
                repeat: Infinity,
                repeatDelay: 6,
                delay: 2.5 + (idx * 0.1) // Start pulsing after intro
              }
            }}
            className="px-4 py-2 bg-card hover:bg-muted text-foreground text-sm font-medium rounded-full border border-border flex items-center gap-1.5 transition-colors"
          >
            {category}
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}

