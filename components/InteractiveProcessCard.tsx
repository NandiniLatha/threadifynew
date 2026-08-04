"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface InteractiveProcessCardProps {
  children: React.ReactNode;
  stepNumber: number;
  title: string;
  description: string;
  href: string;
  className?: string;
  variants?: any;
}

export function InteractiveProcessCard({
  children,
  stepNumber,
  title,
  description,
  href,
  className = "",
  variants,
}: InteractiveProcessCardProps) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const rippleCount = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Add ripple
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: rippleCount.current++ };
    setRipples((prev) => [...prev, newRipple]);

    // Clean up ripple
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 400);

    // Navigate with a small delay for the click pulse to register
    setTimeout(() => {
      router.push(href);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Navigate on keyboard trigger
      router.push(href);
    }
  };

  // Pre-fetch the route on hover/focus
  const handlePrefetch = () => {
    router.prefetch(href);
  };

  return (
    <motion.button
      variants={variants}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      aria-label={`Step ${stepNumber}: ${title} — ${description}`}
      className={`group relative text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      whileHover={reducedMotion ? { opacity: 0.95 } : {
        y: -6,
        scale: 1.015,
        boxShadow: "0 12px 32px rgba(201, 169, 97, 0.12)",
      }}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 22,
        mass: 0.5,
      }}
    >
      {/* Container for ripples */}
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none z-0">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.25 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute bg-primary rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 100,
                height: 100,
                marginTop: -50,
                marginLeft: -50,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* The original unchanged card content wraps here */}
      <div className="relative z-10 h-full w-full pointer-events-none">
        {children}
      </div>
    </motion.button>
  );
}
