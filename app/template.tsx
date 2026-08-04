"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { duration, easing } from "@/lib/motion"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    return <>{children}</>
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easing.easeOut }}
    >
      {children}
    </motion.div>
  )
}
