"use client"

import * as React from "react"
import { Sparkles, Bot, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface AIAssistantFloatingButtonProps {
  isOpen: boolean
  onClick: () => void
  unreadBadge?: boolean
}

export function AIAssistantFloatingButton({
  isOpen,
  onClick,
  unreadBadge = false,
}: AIAssistantFloatingButtonProps) {
  const [showTooltip, setShowTooltip] = React.useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-auto">
      {/* Tooltip */}
      <AnimatePresence>
        {!isOpen && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="mb-2 px-3 py-1.5 bg-ink text-ivory text-xs font-medium rounded-xl shadow-lg border border-border/20 whitespace-nowrap flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-rust animate-pulse" />
            <span>Need help? Ask Threadify AI</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse Ring when closed */}
      <div className="relative">
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-rust/30 animate-ping pointer-events-none opacity-75" />
        )}

        <button
          onClick={onClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label={isOpen ? "Close Threadify AI Assistant" : "Open Threadify AI Assistant"}
          aria-expanded={isOpen}
          className={`relative w-13 h-13 md:w-14 md:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            isOpen
              ? "bg-muted text-foreground border border-border hover:bg-muted/80"
              : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-primary/20"
          }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex items-center justify-center"
              >
                <Bot className="w-6 h-6" />
                <Sparkles className="w-3 h-3 text-ivory absolute -top-1 -right-1 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unread indicator dot */}
          {!isOpen && unreadBadge && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rust rounded-full border-2 border-background" />
          )}
        </button>
      </div>
    </div>
  )
}
