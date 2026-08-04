"use client"

/**
 * AIToolResultCard — Renders a navigation/action result from a tool call.
 * Styled with existing theme tokens only. No new colors.
 */

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, CreditCard, Upload, Package, GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTE_WHITELIST } from "@/lib/ai/whitelist"

export interface ToolResult {
  type: "navigation"
  routeId: string
  path: string
  label: string
  direct: boolean
}

interface AIToolResultCardProps {
  result: ToolResult
  onNavigate: (path: string, direct: boolean) => void
}

const ROUTE_ICONS: Record<string, React.ElementType> = {
  "customer-orders": Package,
  "tailor-orders": Package,
  "customer-payments": CreditCard,
  "customer-requests": GitCompare,
  "tailor-requests": GitCompare,
  "tailor-portfolio": Upload,
  "design-studio": Upload,
  "customer-settings": MapPin,
  "tailor-settings": MapPin,
}

export function AIToolResultCard({ result, onNavigate }: AIToolResultCardProps) {
  const route = ROUTE_WHITELIST[result.routeId]
  const Icon = ROUTE_ICONS[result.routeId] || ArrowRight

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mt-3 pt-3 border-t border-border/50"
    >
      <div className="flex items-center gap-2.5 p-2.5 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground truncate">{result.label}</p>
          {route?.description && (
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
              {route.description}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onNavigate(result.path, result.direct)}
          aria-label={`Navigate to ${result.label}`}
          className="h-7 px-2.5 text-[11px] bg-primary text-primary-foreground hover:opacity-90 rounded-lg shrink-0 flex items-center gap-1"
        >
          Open
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Button>
      </div>
    </motion.div>
  )
}
