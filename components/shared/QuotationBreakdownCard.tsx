import * as React from "react"
import { formatINR } from "@/lib/utils/currency"
import { Receipt } from "lucide-react"

export interface QuotationBreakdown {
  base_garment_price:    number
  fabric_cost:           number
  stitching_cost:        number
  customization_charges: number
  delivery_charges:      number
  price:                 number  // total
  estimated_days?:       number
  estimated_completion_date?: string
  note?:                 string
}

interface QuotationBreakdownCardProps {
  quote: QuotationBreakdown
  className?: string
}

/**
 * Renders a clean line-item cost breakdown for a quotation.
 * Used in both customer order detail and tailor quotation views.
 */
export function QuotationBreakdownCard({ quote, className = "" }: QuotationBreakdownCardProps) {
  const lineItems = [
    { label: "Base Garment",        amount: quote.base_garment_price    || 0 },
    { label: "Fabric",              amount: quote.fabric_cost            || 0 },
    { label: "Stitching",           amount: quote.stitching_cost         || 0 },
    { label: "Customization",       amount: quote.customization_charges  || 0 },
    { label: "Delivery",            amount: quote.delivery_charges       || 0 },
  ].filter((item) => item.amount > 0)

  const hasBreakdown = lineItems.length > 0

  return (
    <div className={`bg-card border border-border rounded-2xl p-5 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Receipt className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Price Breakdown</h3>
      </div>

      {hasBreakdown ? (
        <div className="space-y-2">
          {lineItems.map((item) => (
            <div key={item.label} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{formatINR(item.amount)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No detailed breakdown provided.</p>
      )}

      {/* Total */}
      <div className="flex justify-between items-center text-base font-bold border-t border-border pt-3">
        <span>Total</span>
        <span className="text-primary text-lg">{formatINR(quote.price)}</span>
      </div>

      {/* Delivery info */}
      <div className="space-y-1 text-xs text-muted-foreground">
        {quote.estimated_completion_date && (
          <div className="flex justify-between">
            <span>Estimated Completion</span>
            <span className="font-medium text-foreground">
              {new Date(quote.estimated_completion_date).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>
        )}
        {quote.estimated_days && !quote.estimated_completion_date && (
          <div className="flex justify-between">
            <span>Estimated Days</span>
            <span className="font-medium text-foreground">{quote.estimated_days} days</span>
          </div>
        )}
      </div>

      {/* Tailor note */}
      {quote.note && (
        <div className="p-3 bg-muted rounded-xl text-xs text-foreground/80 italic leading-relaxed border-l-2 border-primary/30 pl-4">
          &ldquo;{quote.note}&rdquo;
        </div>
      )}
    </div>
  )
}
