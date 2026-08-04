"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { duration, easing } from "@/lib/motion"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"

interface ToastProps {
  isOpen: boolean
  onClose: () => void
  message: string
  type?: "success" | "error" | "info" | "warning"
}

export function Toast({ isOpen, onClose, message, type = "success" }: ToastProps) {
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  } as const

  const getStatusConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          borderColor: "border-emerald-500/20 dark:border-emerald-500/30",
          bgColor: "bg-emerald-50/95 dark:bg-emerald-950/20",
          shadowColor: "shadow-emerald-500/5",
          ariaLabel: "Success notification"
        }
      case "error":
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
          borderColor: "border-rose-500/20 dark:border-rose-500/30",
          bgColor: "bg-rose-50/95 dark:bg-rose-950/20",
          shadowColor: "shadow-rose-500/5",
          ariaLabel: "Error notification"
        }
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          borderColor: "border-amber-500/20 dark:border-amber-500/30",
          bgColor: "bg-amber-50/95 dark:bg-amber-950/20",
          shadowColor: "shadow-amber-500/5",
          ariaLabel: "Warning notification"
        }
      case "info":
      default:
        return {
          icon: <Info className="w-5 h-5 text-sky-500" />,
          borderColor: "border-sky-500/20 dark:border-sky-500/30",
          bgColor: "bg-sky-50/95 dark:bg-sky-950/20",
          shadowColor: "shadow-sky-500/5",
          ariaLabel: "Information notification"
        }
    }
  }

  const config = getStatusConfig()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(2px)" }}
          transition={{ duration: duration.fast, ease: easing.easeOut }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3.5 w-[calc(100vw-3rem)] sm:w-full sm:max-w-sm p-4 bg-card/95 border ${config.borderColor} ${config.bgColor} rounded-2xl shadow-2xl backdrop-blur-md ${config.shadowColor}`}
          role="alert"
          aria-live="polite"
        >
          <motion.div 
            variants={iconVariants} 
            initial="hidden" 
            animate="visible" 
            className="shrink-0 flex items-center justify-center"
          >
            {type === "success" ? (
              <div className="relative flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.4, 0] }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full bg-emerald-500/20 pointer-events-none"
                />
              </div>
            ) : config.icon}
          </motion.div>
          <div className="flex-1 text-sm font-medium text-foreground leading-relaxed">
            {message}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
