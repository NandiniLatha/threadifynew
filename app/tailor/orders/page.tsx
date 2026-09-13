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
  Clock,
  Truck,
  CreditCard,
  Scissors,
  AlertCircle,
  User,
  Camera,
  ImageIcon,
  Search,
  Calendar,
  Ruler,
  BadgeCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusStepper, OrderStatus } from "@/components/shared/StatusStepper"

// DB status values → display labels
const STATUS_LABEL: Record<string, string> = {
  assigned:             "Assigned (Unpaid)",
  paid:                 "Payment Done",
  confirmed:            "Confirmed",
  measurements_pending: "Measurements Pending",
  cutting:              "Cutting",
  stitching:            "Stitching",
  quality_check:        "Quality Check",
  ready:                "Ready",
  in_production:        "In Production",
  shipped:              "Shipped",
  delivered:            "Delivered",
  completed:            "Completed",
  reviewed:             "Reviewed",
}

const STATUS_COLOR: Record<string, string> = {
  assigned:             "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  paid:                 "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  confirmed:            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  measurements_pending: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  cutting:              "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  stitching:            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  in_production:        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  quality_check:        "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  ready:                "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  shipped:              "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  delivered:            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  completed:            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  reviewed:             "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "assigned":             return <Clock className="w-3.5 h-3.5" />
    case "paid":
    case "confirmed":
    case "measurements_pending": return <CreditCard className="w-3.5 h-3.5" />
    case "cutting":              return <Scissors className="w-3.5 h-3.5" />
    case "stitching":
    case "in_production":        return <Scissors className="w-3.5 h-3.5" />
    case "quality_check":        return <Search className="w-3.5 h-3.5" />
    case "ready":                return <Package className="w-3.5 h-3.5" />
    case "shipped":              return <Truck className="w-3.5 h-3.5" />
    case "delivered":
    case "completed":
    case "reviewed":             return <CheckCircle className="w-3.5 h-3.5" />
    default:                     return <Package className="w-3.5 h-3.5" />
  }
}

// Map frontend action label directly to the next status provided by API
const NEXT_ACTION_LABEL: Record<string, string> = {
  cutting:       "Start Cutting",
  stitching:     "Start Stitching",
  quality_check: "Begin Quality Check",
  ready:         "Mark as Ready",
  shipped:       "Mark as Shipped",
}

interface TailorOrder {
  id: string
  clientName: string
  clientEmail: string
  image_url: string
  garmentType: string
  price: number
  status: string
  evidenceStatus: "none" | "waiting_for_customer_approval" | "changes_requested"
  deadline: string
  notes?: string
  ai_tags: string[]
  paymentVerified: boolean
}

const ACTIVE_ORDER_STATUSES = [
  "assigned", "paid", "confirmed", "measurements_pending", 
  "cutting", "stitching", "quality_check", "ready", "in_production", 
  "shipped", "delivered", "completed", "reviewed"
]

export default function TailorOrders() {
  const supabase = createClient()
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [orders, setOrders] = React.useState<TailorOrder[]>([])
  const [activeOrder, setActiveOrder] = React.useState<TailorOrder | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [updateError, setUpdateError] = React.useState<string | null>(null)

  // Progress photos for the active order
  interface ProgressPhoto { id: string; image_url: string; sort_order: number; created_at: string }
  const [progressPhotos, setProgressPhotos] = React.useState<ProgressPhoto[]>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const [photoUploadError, setPhotoUploadError] = React.useState<string | null>(null)
  const photoInputRef = React.useRef<HTMLInputElement>(null)

  const [feedbackCommentDisplay, setFeedbackCommentDisplay] = React.useState<string | null>(null)

  // Statuses where tailor progress photos make sense
  const PHOTO_UPLOAD_STATUSES = ["paid", "confirmed", "measurements_pending", "cutting", "stitching", "quality_check", "in_production", "ready"]

  const loadProgressPhotos = React.useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/progress-photos`)
      if (!res.ok) return
      const data = await res.json()
      setProgressPhotos(data.photos ?? [])
    } catch {
      // Non-critical
    }
  }, [])

  const loadOrders = React.useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const { data, error } = await supabase
        .from("design_requests")
        .select(`
          id,
          image_url,
          ai_tags,
          status,
          production_evidence_status,
          deadline,
          notes,
          amount_paid,
          customer:users!customer_id (name, email),
          accepted_quotation:quotations!accepted_quotation_id (price)
        `)
        .eq("tailor_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        setOrders([])
        return
      }

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("order_id")
        .eq("tailor_id", user.id)
        .eq("payment_status", "completed")

      const verifiedPayments = new Set(paymentsData?.map(p => p.order_id) || [])

      // Filter in memory to avoid PostgreSQL strict enum validation errors 
      // if the DB enum hasn't been updated with all UI statuses yet.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeData = (data as any[]).filter(row => ACTIVE_ORDER_STATUSES.includes(row.status))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: TailorOrder[] = activeData.map((row) => ({
        id: row.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clientName:  (row.customer as any)?.name  ?? "Customer",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clientEmail: (row.customer as any)?.email ?? "",
        image_url:   row.image_url,
        garmentType: row.ai_tags?.[0] ?? "Custom Clothing",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        price:       Number((row.accepted_quotation as any)?.price ?? row.amount_paid ?? 0),
        status:      row.status,
        evidenceStatus: row.production_evidence_status ?? "none",
        deadline:    row.deadline,
        notes:       row.notes ?? undefined,
        ai_tags:     row.ai_tags ?? [],
        paymentVerified: verifiedPayments.has(row.id),
      }))

      setOrders(mapped)
      setActiveOrder(prev => {
        if (!prev) return mapped[0] ?? null
        return mapped.find(o => o.id === prev.id) ?? mapped[0] ?? null
      })
    } catch (err: any) {
      console.error(err)
      setLoadError("Error: " + (err.message || String(err)))
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    loadOrders()
  }, [loadOrders])

  React.useEffect(() => {
    if (!currentUserId) return
    const channel = supabase
      .channel(`tailor-orders:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "design_requests", filter: `tailor_id=eq.${currentUserId}` },
        () => loadOrders()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, supabase, loadOrders])

  React.useEffect(() => {
    if (activeOrder?.id) {
      setProgressPhotos([])
      setFeedbackCommentDisplay(null)
      loadProgressPhotos(activeOrder.id)

      if (activeOrder.evidenceStatus === "changes_requested") {
        supabase
          .from("production_feedback")
          .select("comment")
          .eq("request_id", activeOrder.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) setFeedbackCommentDisplay(data.comment)
          })
      }
    }
  }, [activeOrder?.id, activeOrder?.evidenceStatus, loadProgressPhotos, supabase])

  const handleAdvanceStatus = async (orderId: string) => {
    setIsUpdating(true)
    setUpdateError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/advance-status`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setUpdateError(data.error ?? "Failed to update status. Please try again.")
        return
      }
      await loadOrders()
    } catch {
      setUpdateError("Network error. Please check your connection and try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  // Derive next possible status directly by replicating API logic strictly for UI display
  const getNextStatusDisplay = (status: string) => {
    const ALLOWED_TRANSITIONS: Record<string, string> = {
      paid: "cutting", cutting: "stitching", stitching: "quality_check",
      quality_check: "ready", ready: "shipped", shipped: "delivered", delivered: "completed",
      // Legacy support
      confirmed: "cutting", measurements_pending: "cutting", in_production: "shipped"
    }
    return ALLOWED_TRANSITIONS[status] || null
  }

  const handleReportIssue = async (reason: string) => {
    if (!activeOrder) return
    setIsUpdating(true)
    setUpdateError(null)
    try {
      const res = await fetch("/api/disputes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: activeOrder.id, reason }),
      })
      const data = await res.json()
      if (!res.ok) setUpdateError(data.error ?? "Failed to submit dispute report.")
    } catch {
      setUpdateError("Network error when submitting dispute.")
    } finally {
      setIsUpdating(false)
    }
  }

  // Group orders for the left pane
  const pendingActionOrders = orders.filter(o => ["assigned", "paid", "confirmed", "measurements_pending"].includes(o.status))
  const inProductionOrders = orders.filter(o => ["cutting", "stitching", "quality_check", "ready", "in_production"].includes(o.status))
  const shippedDeliveredOrders = orders.filter(o => ["shipped", "delivered", "completed", "reviewed"].includes(o.status))

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-foreground">Order Progress</h1>
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{loadError}</p>
            <button onClick={loadOrders} className="mt-2 underline font-semibold text-xs">Retry</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Order Progress</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Manage your active orders, track garment progress, and communicate with clients seamlessly.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed space-y-4 shadow-sm">
          <Scissors className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No active orders yet.</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            New orders will appear here automatically when a customer completes payment for your quotation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANE: Order Queue */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 max-h-[85vh] overflow-y-auto pr-1 pb-1 custom-scrollbar">
            
            {pendingActionOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Ready to Start ({pendingActionOrders.length})
                </h2>
                <div className="space-y-2">
                  {pendingActionOrders.map((ord) => (
                    <OrderListItem key={ord.id} order={ord} isActive={activeOrder?.id === ord.id} onClick={() => { setActiveOrder(ord); setUpdateError(null); setPhotoUploadError(null); loadProgressPhotos(ord.id) }} />
                  ))}
                </div>
              </div>
            )}

            {inProductionOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 dark:text-amber-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> In Production ({inProductionOrders.length})
                </h2>
                <div className="space-y-2">
                  {inProductionOrders.map((ord) => (
                    <OrderListItem key={ord.id} order={ord} isActive={activeOrder?.id === ord.id} onClick={() => { setActiveOrder(ord); setUpdateError(null); setPhotoUploadError(null); loadProgressPhotos(ord.id) }} />
                  ))}
                </div>
              </div>
            )}

            {shippedDeliveredOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Completed / Shipped ({shippedDeliveredOrders.length})
                </h2>
                <div className="space-y-2">
                  {shippedDeliveredOrders.map((ord) => (
                    <OrderListItem key={ord.id} order={ord} isActive={activeOrder?.id === ord.id} onClick={() => { setActiveOrder(ord); setUpdateError(null); setPhotoUploadError(null); loadProgressPhotos(ord.id) }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: Order Details */}
          <div className="lg:col-span-8">
            {activeOrder ? (
              <div className="bg-card border border-border/60 shadow-sm overflow-hidden flex flex-col">
                {/* Header Banner */}
                <div className="relative h-48 w-full bg-muted border-b border-border/40">
                   <Image src={activeOrder.image_url} alt="Garment inspiration" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 66vw" priority />
                   <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                   <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                     <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 border rounded-sm tracking-wider uppercase backdrop-blur-md ${STATUS_COLOR[activeOrder.status] ?? "bg-background border-border text-foreground"}`}>
                          <StatusIcon status={activeOrder.status} />
                          {STATUS_LABEL[activeOrder.status] ?? activeOrder.status}
                        </span>
                        <h2 className="text-2xl font-serif font-bold text-foreground drop-shadow-sm">{activeOrder.garmentType}</h2>
                        <p className="text-xs text-foreground/80 font-medium font-mono drop-shadow-sm flex items-center gap-2">
                          <User className="w-3.5 h-3.5" /> {activeOrder.clientName}
                        </p>
                     </div>
                     <div className="text-right pb-1">
                        <p className="text-2xl font-bold text-foreground tracking-tight drop-shadow-sm">{formatINR(activeOrder.price)}</p>
                     </div>
                   </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 border border-border/60 rounded-xl">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Delivery Date
                      </span>
                      <span className="text-sm font-semibold text-foreground">{activeOrder.deadline}</span>
                    </div>
                    
                    {getNextStatusDisplay(activeOrder.status) ? (
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => handleAdvanceStatus(activeOrder.id)}
                          disabled={isUpdating || activeOrder.evidenceStatus !== "none"}
                          className="bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-wider text-xs h-12 px-6 rounded-none w-full sm:w-auto transition-all"
                        >
                          {isUpdating ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                          ) : (
                            <>
                              {NEXT_ACTION_LABEL[getNextStatusDisplay(activeOrder.status)!] || `Advance to ${STATUS_LABEL[getNextStatusDisplay(activeOrder.status)!]}`} 
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                        {updateError && (
                          <p className="text-[10px] text-destructive font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {updateError}
                          </p>
                        )}
                      </div>
                    ) : (
                       <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold text-sm bg-emerald-500/10 px-4 py-2.5 border border-emerald-500/20">
                          <BadgeCheck className="w-5 h-5" /> Completed
                       </div>
                    )}
                  </div>

                  {/* Order Progress Stepper */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Order Progress</h3>
                    <div className="bg-background border border-border/40 p-4 pt-6">
                      <StatusStepper status={activeOrder.status as OrderStatus} evidenceStatus={activeOrder.evidenceStatus} paymentVerified={activeOrder.paymentVerified} />
                    </div>
                  </div>

                  {/* Design Requirements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border/40">
                    <div className="space-y-4">
                       <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                         <Ruler className="w-3.5 h-3.5" /> Order Details
                       </h3>
                       <div className="flex flex-wrap gap-2">
                         {activeOrder.ai_tags.map(tag => (
                           <span key={tag} className="text-xs font-semibold px-2 py-1 bg-muted border border-border text-foreground">
                             {tag}
                           </span>
                         ))}
                       </div>
                       {activeOrder.notes && (
                         <div className="p-4 bg-primary/5 border-l-2 border-primary text-sm text-foreground italic leading-relaxed">
                           &ldquo;{activeOrder.notes}&rdquo;
                         </div>
                       )}
                    </div>

                    {/* Progress Photos Widget */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" /> Progress Photos
                        </h3>
                        {PHOTO_UPLOAD_STATUSES.includes(activeOrder.status) && (
                          <>
                            <input
                              ref={photoInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                setIsUploadingPhoto(true)
                                setPhotoUploadError(null)
                                try {
                                  const reader = new FileReader()
                                  reader.onloadend = async () => {
                                    const base64 = reader.result as string
                                    const res = await fetch(`/api/orders/${activeOrder.id}/progress-photos`, {
                                      method: "POST", headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ imageBase64: base64, stage: activeOrder.status }),
                                    })
                                    const data = await res.json()
                                    if (!res.ok) {
                                      setPhotoUploadError(data.error ?? "Upload failed.")
                                    } else if (data.photo) {
                                      setProgressPhotos(prev => [...prev, data.photo])
                                    }
                                    setIsUploadingPhoto(false)
                                    if (photoInputRef.current) photoInputRef.current.value = ""
                                  }
                                  reader.readAsDataURL(file)
                                } catch {
                                  setPhotoUploadError("Upload failed. Try again.")
                                  setIsUploadingPhoto(false)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10"
                              disabled={isUploadingPhoto}
                              onClick={() => photoInputRef.current?.click()}
                            >
                              {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Upload"}
                            </Button>
                          </>
                        )}
                      </div>

                      {photoUploadError && (
                        <p className="text-[10px] text-destructive flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {photoUploadError}
                        </p>
                      )}

                      {progressPhotos.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {progressPhotos.map((photo) => (
                            <a key={photo.id} href={photo.image_url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 overflow-hidden border border-border shrink-0 group relative bg-muted block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.image_url} alt="Production progress" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-24 border border-border/50 border-dashed bg-muted/10 text-center px-4">
                          <ImageIcon className="w-5 h-5 text-muted-foreground/40 mb-2" />
                          <p className="text-[10px] text-muted-foreground">No work photos uploaded yet.</p>
                        </div>
                      )}

                      {activeOrder.evidenceStatus === "changes_requested" && feedbackCommentDisplay && (
                        <div className="mt-4 p-4 border border-red-500/20 bg-red-500/5 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold text-red-600 flex items-center gap-1.5 uppercase tracking-wider">
                            <AlertCircle className="w-3.5 h-3.5" /> Customer Feedback
                          </h4>
                          <div className="p-3 bg-background border border-border rounded-lg text-sm italic text-muted-foreground">
                            &ldquo;{feedbackCommentDisplay}&rdquo;
                          </div>
                          <p className="text-[10px] text-muted-foreground font-semibold">Upload new progress photos to submit for re-approval.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Communications */}
                  <div className="pt-4 border-t border-border/40">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Workspace Chat</h3>
                    {currentUserId && (
                      <div className="border border-border/60 bg-muted/10">
                        <ChatWindow orderId={activeOrder.id} currentUserId={currentUserId} placeholderText="Send a message to your client..." />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => {
                        const reason = window.prompt("State the dispute details for admin review:")
                        if (reason) handleReportIssue(reason)
                      }}
                      className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      Report an Issue
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex items-center justify-center text-center p-8 border border-border/40 border-dashed bg-card shadow-sm">
                <div className="max-w-sm">
                   <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                   <p className="text-sm font-semibold text-foreground">Select an order</p>
                   <p className="text-xs text-muted-foreground mt-1">Choose an order from the production queue to view specifications and track progress.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

function OrderListItem({ order, isActive, onClick }: { order: TailorOrder, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border transition-all flex items-start gap-3 group relative overflow-hidden ${
        isActive
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
      <div className="w-12 h-12 shrink-0 relative bg-muted border border-border/40">
        <Image src={order.image_url} alt="Garment" fill sizes="48px" className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <div className="flex justify-between items-start mb-0.5">
          <h3 className={`text-xs font-bold truncate ${isActive ? "text-primary" : "text-foreground"}`}>{order.clientName}</h3>
          <span className="text-[10px] font-bold shrink-0 ml-2">{formatINR(order.price)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate mb-1.5">{order.garmentType}</p>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 border ${STATUS_COLOR[order.status] ?? "border-border text-muted-foreground"}`}>
            <StatusIcon status={order.status} />
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
      </div>
    </button>
  )
}
