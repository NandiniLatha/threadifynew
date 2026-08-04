"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { ChatWindow } from "@/components/shared/ChatWindow"
import { formatINR } from "@/lib/utils/currency"
import {
  Package,
  ArrowRight,
  Loader2,
  CheckCircle,
  Truck,
  CreditCard,
  Scissors,
  AlertCircle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusStepper, OrderStatus } from "@/components/shared/StatusStepper"

// DB status values → display labels
const STATUS_LABEL: Record<string, string> = {
  paid:          "Paid",
  in_production: "In Production",
  shipped:       "Shipped",
  delivered:     "Delivered",
}

const STATUS_COLOR: Record<string, string> = {
  paid:          "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_production: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  shipped:       "bg-purple-500/10 text-purple-500 border-purple-500/20",
  delivered:     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "paid":          return <CreditCard className="w-4 h-4" />
    case "in_production": return <Scissors className="w-4 h-4" />
    case "shipped":       return <Truck className="w-4 h-4" />
    case "delivered":     return <CheckCircle className="w-4 h-4" />
    default:              return <Package className="w-4 h-4" />
  }
}

// DB status values that allow the tailor to advance
const NEXT_STATUS: Record<string, string> = {
  paid:          "in_production",
  in_production: "shipped",
}

interface TailorOrder {
  id: string
  clientName: string
  clientEmail: string
  image_url: string
  garmentType: string
  price: number
  status: string
  deadline: string
  notes?: string
}

export default function TailorOrders() {
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [orders, setOrders] = React.useState<TailorOrder[]>([])
  const [activeOrder, setActiveOrder] = React.useState<TailorOrder | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [updateError, setUpdateError] = React.useState<string | null>(null)

  const loadOrders = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Fetch all orders assigned to this tailor that are in an active state
      const { data, error } = await supabase
        .from("design_requests")
        .select(`
          id,
          image_url,
          ai_tags,
          status,
          deadline,
          notes,
          amount_paid,
          customer:users!customer_id (name, email),
          accepted_quotation:quotations!accepted_quotation_id (price)
        `)
        .eq("tailor_id", user.id)
        .in("status", ["paid", "in_production", "shipped", "delivered"])
        .order("created_at", { ascending: false })

      if (error) {
        setLoadError("Could not load your orders. Please refresh.")
        return
      }

      if (!data || data.length === 0) {
        setOrders([])
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: TailorOrder[] = (data as any[]).map((row) => ({
        id: row.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clientName:  (row.customer as any)?.name  ?? "Customer",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clientEmail: (row.customer as any)?.email ?? "",
        image_url:   row.image_url,
        garmentType: row.ai_tags?.[0] ?? "Custom Garment",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        price:       Number((row.accepted_quotation as any)?.price ?? row.amount_paid ?? 0),
        status:      row.status,
        deadline:    row.deadline,
        notes:       row.notes ?? undefined,
      }))

      setOrders(mapped)
      // Keep active order in sync if it was already selected
      setActiveOrder(prev => {
        if (!prev) return mapped[0] ?? null
        return mapped.find(o => o.id === prev.id) ?? mapped[0] ?? null
      })
    } catch {
      setLoadError("An unexpected error occurred while loading orders.")
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initial load
  React.useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Realtime: re-fetch whenever the customer updates one of our orders (e.g. confirms delivery)
  React.useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel(`tailor-orders:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "design_requests",
          filter: `tailor_id=eq.${currentUserId}`,
        },
        () => {
          loadOrders()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, supabase, loadOrders])

  const handleAdvanceStatus = async (orderId: string) => {
    setIsUpdating(true)
    setUpdateError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/advance-status`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        setUpdateError(data.error ?? "Failed to update status. Please try again.")
        return
      }
      // Reload from DB to get the authoritative new state
      await loadOrders()
    } catch {
      setUpdateError("Network error. Please check your connection and try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReportIssue = async (reason: string) => {
    if (!activeOrder) return
    setIsUpdating(true)
    setUpdateError(null)
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: activeOrder.id, reason }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUpdateError(data.error ?? "Failed to submit dispute report.")
      }
      // Success — no alert, dispute is quietly filed
    } catch {
      setUpdateError("Network error when submitting dispute.")
    } finally {
      setIsUpdating(false)
    }
  }

  // ── Loading & error states ──
  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl font-bold text-foreground">Your Orders</h1>
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{loadError}</p>
            <button onClick={loadOrders} className="mt-2 underline text-destructive font-semibold text-xs">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Your Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor your customer orders, track production stages, and update shipping parameters.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <Package className="w-12 h-12 text-muted-foreground/45 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No Active Orders</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Once a client accepts one of your quotations, the order details will be displayed here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Orders List */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active queue</h2>
            <div className="space-y-3">
              {orders.map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => { setActiveOrder(ord); setUpdateError(null) }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                    activeOrder?.id === ord.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-muted/30"
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted border border-border shrink-0 relative">
                    <Image src={ord.image_url} alt="Garment" fill sizes="56px" className="object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-bold text-foreground truncate">{ord.clientName}</h3>
                      <span className="text-[10px] font-bold shrink-0 ml-2">{formatINR(ord.price)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{ord.garmentType}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 border rounded-full ${STATUS_COLOR[ord.status] ?? ""}`}>
                        <StatusIcon status={ord.status} />
                        {STATUS_LABEL[ord.status] ?? ord.status}
                      </span>
                      <span className="text-[9px] text-muted-foreground">Due: {ord.deadline}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Order Detail Panel */}
          <div className="lg:col-span-7">
            {activeOrder ? (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{activeOrder.garmentType}</h2>
                    <p className="text-xs text-muted-foreground mt-1">Order ID: {activeOrder.id.split("-")[0]}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 border rounded-full ${STATUS_COLOR[activeOrder.status] ?? ""}`}>
                    <StatusIcon status={activeOrder.status} />
                    {STATUS_LABEL[activeOrder.status] ?? activeOrder.status}
                  </span>
                </div>

                {/* Progress Stepper */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Order Status</h3>
                  <StatusStepper status={activeOrder.status as OrderStatus} />
                </div>

                {/* Client Details */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/60">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Client Details
                    </h4>
                    <p className="text-sm font-semibold text-foreground mt-1">{activeOrder.clientName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activeOrder.clientEmail}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground">Delivery Deadline</h4>
                    <p className="text-sm font-semibold text-foreground mt-1">{activeOrder.deadline}</p>
                  </div>
                </div>

                {activeOrder.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground">Client Instructions</h4>
                    <div className="mt-2 p-3 bg-muted/40 border border-border/50 rounded-2xl text-xs text-foreground/80 italic leading-relaxed">
                      &ldquo;{activeOrder.notes}&rdquo;
                    </div>
                  </div>
                )}

                {/* Chat */}
                {currentUserId && (
                  <div className="pt-4 border-t border-border space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground">Workspace Chat</h4>
                    <ChatWindow orderId={activeOrder.id} currentUserId={currentUserId} />
                  </div>
                )}

                {/* Advance Status Button */}
                <div className="pt-6 border-t border-border space-y-2">
                  {NEXT_STATUS[activeOrder.status] ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleAdvanceStatus(activeOrder.id)}
                          disabled={isUpdating}
                          className="bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow-sm px-6"
                        >
                          {isUpdating ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…</>
                          ) : (
                            <>
                              <span>Advance to {STATUS_LABEL[NEXT_STATUS[activeOrder.status]]}</span>
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                      {updateError && (
                        <p className="flex items-start gap-1.5 text-xs text-destructive justify-end">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          {updateError}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Garment successfully completed and delivered!</span>
                    </div>
                  )}
                </div>

                {/* Report Issue */}
                <div className="pt-4 border-t border-border/60 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Encountering delivery issues or disputes?</span>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      const reason = window.prompt("State the dispute details for admin review:")
                      if (reason) handleReportIssue(reason)
                    }}
                    className="text-destructive font-bold hover:underline focus:outline-none focus:ring-1 focus:ring-destructive rounded disabled:opacity-50"
                  >
                    Report an Issue
                  </button>
                </div>

                {/* Chat Panel */}
                {currentUserId && (
                  <div className="pt-6 border-t border-border/60">
                    <h3 className="text-sm font-bold text-foreground mb-4">Messages</h3>
                    <ChatWindow 
                      orderId={activeOrder.id} 
                      currentUserId={currentUserId} 
                      placeholderText="Message your client..."
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8 border border-border border-dashed rounded-3xl text-muted-foreground text-sm">
                Select an order from the list to view instructions and progress status.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
