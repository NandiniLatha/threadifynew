"use client"

import * as React from "react"
import { Check, XCircle, Clock } from "lucide-react"

export type OrderStatus =
  | "draft"
  | "pending_bids"
  | "quoted"
  | "quote_accepted"
  | "assigned"
  | "payment_pending"
  | "paid"
  | "confirmed"
  | "measurements_pending"
  | "cutting"
  | "stitching"
  | "quality_check"
  | "ready"
  | "in_production"
  | "shipped"
  | "delivered"
  | "completed"
  | "reviewed"
  | "cancelled"
  | "rejected"

interface StatusStepperProps {
  status: OrderStatus
  className?: string
  /** When true, renders a vertical timeline with optional dates/notes */
  vertical?: boolean
  /** Optional history records from order_status_history for vertical mode */
  history?: { to_status: string; created_at: string; note?: string }[]
  /** Optional evidence status to display awaiting approval state */
  evidenceStatus?: "none" | "waiting_for_customer_approval" | "changes_requested"
  /** Ensures the Paid step is only shown if the payment is verified in the DB */
  paymentVerified?: boolean
}

const STEPS: { key: string; label: string; short: string }[] = [
  { key: "pending_bids",   label: "Requested",          short: "Requested"  },
  { key: "quoted",         label: "Price Received",      short: "Quoted"     },
  { key: "quote_accepted", label: "Price Accepted",      short: "Accepted"   },
  { key: "paid",           label: "Payment Confirmed",   short: "Paid"       },
  { key: "cutting",        label: "Cutting",             short: "Cutting"    },
  { key: "stitching",      label: "Stitching",           short: "Stitching"  },
  { key: "quality_check",  label: "Quality Check",       short: "QC"         },
  { key: "ready",          label: "Ready to Ship",       short: "Ready"      },
  { key: "shipped",        label: "Shipped",             short: "Shipped"    },
  { key: "delivered",      label: "Delivered",           short: "Delivered"  },
  { key: "completed",      label: "Completed",           short: "Done"       },
]

/** Maps any status to a canonical step index (0-based in STEPS array) */
function getStepIndex(status: OrderStatus, paymentVerified: boolean = true): number {
  switch (status) {
    case "draft":
      return -1
    case "pending_bids":
      return 0
    case "quoted":
      return 1
    case "quote_accepted":
    case "payment_pending":
      return 2
    case "paid":
    case "confirmed":
    case "measurements_pending":
      return paymentVerified ? 3 : 2
    case "cutting":
      return paymentVerified ? 4 : 2
    case "stitching":
      return paymentVerified ? 5 : 2
    case "quality_check":
      return paymentVerified ? 6 : 2
    case "ready":
    case "in_production":
      return paymentVerified ? 7 : 2
    case "shipped":
      return paymentVerified ? 8 : 2
    case "delivered":
      return paymentVerified ? 9 : 2
    case "completed":
    case "reviewed":
      return paymentVerified ? 10 : 2
    default:
      return 0
  }
}

// ── Horizontal Stepper ──────────────────────────────────────────────────────

function HorizontalStepper({ 
  status, 
  evidenceStatus = "none",
  paymentVerified = true,
  className = "" 
}: { 
  status: OrderStatus; 
  evidenceStatus?: "none" | "waiting_for_customer_approval" | "changes_requested"
  paymentVerified?: boolean
  className?: string 
}) {
  const currentIdx = getStepIndex(status, paymentVerified)

  return (
    <div className={`w-full overflow-x-auto pb-4 ${className}`}>
      <div className="flex items-center justify-between min-w-[640px] max-w-4xl mx-auto px-2">
        {STEPS.map((step, i) => {
          const isPast    = i < currentIdx
          const isCurrent = i === currentIdx

          return (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <div
                  className={`h-[2px] flex-1 mx-1.5 transition-colors duration-500 ${
                    isPast || isCurrent ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div className="flex flex-col items-center relative group shrink-0">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors duration-500 z-10 ${
                    isPast
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? evidenceStatus === "waiting_for_customer_approval"
                        ? "bg-orange-500/10 border-orange-500 text-orange-500 ring-4 ring-orange-500/20 shadow-sm"
                        : evidenceStatus === "changes_requested"
                        ? "bg-red-500/10 border-red-500 text-red-500 ring-4 ring-red-500/20 shadow-sm"
                        : "bg-primary/10 border-primary text-primary ring-4 ring-primary/20 shadow-sm"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {isPast ? <Check className="w-3.5 h-3.5" /> : isCurrent && evidenceStatus !== "none" ? <Clock className="w-3.5 h-3.5 animate-pulse" /> : i + 1}
                </div>
                <span
                  className={`absolute top-9 text-[9px] font-semibold whitespace-nowrap transition-colors duration-500 ${
                    isPast || isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.short}
                </span>
                {isCurrent && evidenceStatus !== "none" && (
                  <span className="absolute top-[52px] text-[8px] uppercase tracking-wider font-bold whitespace-nowrap text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                    {evidenceStatus === "changes_requested" ? "Changes Needed" : "Awaiting Approval"}
                  </span>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ── Vertical Timeline ───────────────────────────────────────────────────────

function VerticalTimeline({
  status,
  history,
  evidenceStatus = "none",
  paymentVerified = true,
  className = "",
}: {
  status: OrderStatus
  history?: { to_status: string; created_at: string; note?: string }[]
  evidenceStatus?: "none" | "waiting_for_customer_approval" | "changes_requested"
  paymentVerified?: boolean
  className?: string
}) {
  const currentIdx = getStepIndex(status, paymentVerified)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day:   "numeric",
      month: "short",
      year:  "numeric",
      hour:  "2-digit",
      minute:"2-digit",
    })

  const getHistoryEntry = (stepKey: string) =>
    history?.find((h) => h.to_status === stepKey)

  return (
    <div className={`space-y-0 ${className}`}>
      {STEPS.map((step, i) => {
        const isPast    = i < currentIdx
        const isCurrent = i === currentIdx
        const isFuture  = i > currentIdx
        const entry     = getHistoryEntry(step.key)

        return (
          <div key={step.key} className="flex gap-4">
            {/* Connector column */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 z-10 ${
                  isPast
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? evidenceStatus === "waiting_for_customer_approval"
                      ? "bg-orange-500/10 border-orange-500 text-orange-500 ring-4 ring-orange-500/20 shadow-sm"
                      : evidenceStatus === "changes_requested"
                      ? "bg-red-500/10 border-red-500 text-red-500 ring-4 ring-red-500/20 shadow-sm"
                      : "bg-primary/10 border-primary text-primary ring-4 ring-primary/20 shadow-sm"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                {isPast ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCurrent && evidenceStatus !== "none" ? (
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-0.5 flex-1 my-1 min-h-[24px] transition-colors duration-300 ${
                    isPast ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>

            {/* Content column */}
            <div className={`pb-5 flex-1 ${i === STEPS.length - 1 ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-semibold leading-tight ${
                  isFuture ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {step.label}
              </p>
              {(isPast || isCurrent) && entry && (
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.created_at)}</p>
              )}
              {isCurrent && (
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                  evidenceStatus === "changes_requested" 
                    ? "text-red-600 bg-red-600/10" 
                    : evidenceStatus === "waiting_for_customer_approval"
                    ? "text-orange-600 bg-orange-600/10"
                    : "text-primary bg-primary/10"
                }`}>
                  {evidenceStatus === "changes_requested" ? "Changes Needed" : evidenceStatus === "waiting_for_customer_approval" ? "Waiting for Your Approval" : "Current Stage"}
                </span>
              )}
              {entry?.note && (
                <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-primary/30 pl-2">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ─────────────────────────────────────────────────────────────

export function StatusStepper({ 
  status, 
  className = "", 
  vertical = false, 
  history,
  evidenceStatus = "none",
  paymentVerified = true
}: StatusStepperProps) {
  if (status === "cancelled" || status === "rejected") {
    return (
      <div
        className={`p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center justify-center gap-2 text-destructive ${className}`}
      >
        <XCircle className="w-5 h-5" />
        <span className="font-bold">
          {status === "rejected" ? "This request was rejected." : "This order was cancelled."}
        </span>
      </div>
    )
  }

  if (vertical) {
    return <VerticalTimeline status={status} history={history} evidenceStatus={evidenceStatus} paymentVerified={paymentVerified} className={className} />
  }

  return <HorizontalStepper status={status} evidenceStatus={evidenceStatus} paymentVerified={paymentVerified} className={className} />
}
