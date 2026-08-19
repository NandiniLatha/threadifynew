"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import {
  Scissors,
  Loader2,
  AlertCircle,
  Tag,
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  Star,
  MessageSquare,
  CreditCard,
  Truck,
  PackageCheck,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusStepper } from "@/components/shared/StatusStepper"
import { QuotationBreakdownCard } from "@/components/shared/QuotationBreakdownCard"
import { ChatWindow } from "@/components/shared/ChatWindow"

export default function CustomerOrderDetails() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [request, setRequest] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quotations, setQuotations] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)

  // Per-quote loading state (keyed by quoteId)
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null)
  const [acceptError, setAcceptError] = React.useState<string | null>(null)

  // Confirm delivery state
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [confirmError, setConfirmError] = React.useState<string | null>(null)

  // Review state
  const [rating, setRating] = React.useState<number>(5)
  const [reviewComment, setReviewComment] = React.useState("")
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false)
  const [reviewError, setReviewError] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setCurrentUserId(user.id)

      // Fetch request details with tailor join and accepted quotation
      const { data: reqData, error: reqError } = await supabase
        .from("design_requests")
        .select(`
          *,
          tailor:users!tailor_id (name, email),
          accepted_quotation:quotations!accepted_quotation_id (price, estimated_days, note),
          review:reviews!order_id (rating, comment)
        `)
        .eq("id", id)
        .eq("customer_id", user.id)
        .single()

      if (reqError || !reqData) {
        setErrorMsg("Could not find this design request.")
        setIsLoading(false)
        return
      }
      setRequest(reqData)

      // Fetch all quotations while request is in bidding or quoted stages
      if (["pending_bids", "quoted"].includes(reqData.status)) {
        const { data: quotesData, error: quotesError } = await supabase
          .from("quotations")
          .select(`
            *,
            tailor:users!tailor_id (name),
            profile:tailor_profiles!tailor_id (avg_rating, portfolio_images)
          `)
          .eq("request_id", id)
          .order("price", { ascending: true })

        if (!quotesError && quotesData) {
          setQuotations(quotesData)
        }
      }
    } catch {
      setErrorMsg("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }, [id, router, supabase])

  // Initial load
  React.useEffect(() => {
    if (id) loadData()
  }, [id, loadData])

  // Realtime: re-fetch whenever the tailor updates this order's status
  React.useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`order-status:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "design_requests",
          filter: `id=eq.${id}`,
        },
        () => {
          // Re-fetch full row so joins (tailor name, accepted_quotation) are fresh
          loadData()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase, loadData])

  // Accept a quote + mock-pay in one click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAcceptAndPay = async (quote: any) => {
    setAcceptingId(quote.id)
    setAcceptError(null)
    try {
      const res = await fetch(`/api/orders/${id}/mock-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAcceptError(data.error ?? "Payment failed. Please try again.")
        return
      }
      // Reload the page state so it reflects the new status
      await loadData()
    } catch {
      setAcceptError("Network error. Please check your connection and try again.")
    } finally {
      setAcceptingId(null)
    }
  }

  // Confirm delivery (customer side)
  const handleConfirmDelivery = async () => {
    setIsConfirming(true)
    setConfirmError(null)
    try {
      const res = await fetch(`/api/orders/${id}/confirm-delivery`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        setConfirmError(data.error ?? "Could not confirm delivery. Please try again.")
        return
      }
      // Reload to reflect delivered state
      await loadData()
    } catch {
      setConfirmError("Network error. Try again.")
    } finally {
      setIsConfirming(false)
    }
  }

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true)
    setReviewError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          rating,
          comment: reviewComment
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Reload to show the review and updated status
      await loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review"
      setReviewError(msg)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      draft:                { label: "Draft",                         color: "text-muted-foreground", icon: <Clock className="w-4 h-4" /> },
      pending_bids:         { label: "Awaiting Quotes",               color: "text-amber-600",        icon: <Clock className="w-4 h-4" /> },
      quoted:               { label: "Quote Received",                color: "text-amber-600",        icon: <Star className="w-4 h-4" /> },
      quote_accepted:       { label: "Quote Accepted",                color: "text-primary",          icon: <CheckCircle className="w-4 h-4" /> },
      payment_pending:      { label: "Payment Pending",               color: "text-amber-600",        icon: <CreditCard className="w-4 h-4" /> },
      assigned:             { label: "Tailor Assigned",               color: "text-primary",          icon: <User className="w-4 h-4" /> },
      paid:                 { label: "Paid — In Production",         color: "text-primary",          icon: <CreditCard className="w-4 h-4" /> },
      confirmed:            { label: "Confirmed",                     color: "text-primary",          icon: <CheckCircle className="w-4 h-4" /> },
      measurements_pending: { label: "Sending Measurements",          color: "text-amber-600",        icon: <Clock className="w-4 h-4" /> },
      cutting:              { label: "Cutting",                       color: "text-primary",          icon: <Scissors className="w-4 h-4" /> },
      stitching:            { label: "Stitching",                     color: "text-primary",          icon: <Scissors className="w-4 h-4" /> },
      quality_check:        { label: "Quality Check",                 color: "text-primary",          icon: <CheckCircle className="w-4 h-4" /> },
      ready:                { label: "Ready to Ship",                 color: "text-emerald-600",      icon: <PackageCheck className="w-4 h-4" /> },
      in_production:        { label: "In Production",                 color: "text-primary",          icon: <Scissors className="w-4 h-4" /> },
      shipped:              { label: "Shipped",                       color: "text-blue-600",         icon: <Truck className="w-4 h-4" /> },
      delivered:            { label: "Delivered",                     color: "text-emerald-600",      icon: <PackageCheck className="w-4 h-4" /> },
      completed:            { label: "Completed",                     color: "text-emerald-600",      icon: <CheckCircle className="w-4 h-4" /> },
      reviewed:             { label: "Completed & Reviewed",          color: "text-emerald-600",      icon: <Star className="w-4 h-4" /> },
      cancelled:            { label: "Cancelled",                     color: "text-destructive",      icon: <AlertCircle className="w-4 h-4" /> },
      rejected:             { label: "Rejected",                      color: "text-destructive",      icon: <AlertCircle className="w-4 h-4" /> },
    }
    return map[status] ?? map.draft
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (errorMsg || !request) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-10 h-10" />
          <p className="font-semibold">{errorMsg || "Request not found"}</p>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusDisplay(request.status)
  const ACTIVE_STATUSES = ["paid", "confirmed", "measurements_pending", "cutting", "stitching", "quality_check", "ready", "in_production", "shipped", "delivered", "completed", "reviewed"]
  const isActiveOrder = ACTIVE_STATUSES.includes(request.status)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/requests")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              {request.ai_tags[0] || "Custom Design Request"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Order #{request.id.split("-")[0]}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-background font-medium text-sm ${statusInfo.color}`}>
          {statusInfo.icon}
          {statusInfo.label}
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Order Timeline</h3>
        <StatusStepper status={request.status} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col: Image & Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-border bg-muted relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={request.image_url}
              alt="Design inspiration"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Tag className="w-4 h-4 text-primary" />
              Design Details
            </h3>

            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Detected Styles</p>
              <div className="flex flex-wrap gap-1.5">
                {request.ai_tags.map((tag: string, i: number) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Budget Range</p>
              <p className="text-sm font-medium">{formatINR(request.budget_min)} – {formatINR(request.budget_max)}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Deadline</p>
              <p className="text-sm font-medium">{request.deadline}</p>
            </div>

            {request.notes && (
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Your Notes</p>
                <p className="text-sm text-foreground/80">{request.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quotes or Active Order info */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── PENDING BIDS: show quotation comparison ── */}
          {request.status === "pending_bids" && (
            <>
              <h2 className="text-xl font-serif font-bold text-foreground mb-4">Tailor Quotes ({quotations.length})</h2>

              {/* Global accept error */}
              {acceptError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{acceptError}</span>
                </div>
              )}

              {quotations.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border border-dashed rounded-3xl space-y-4">
                  <Clock className="w-10 h-10 text-muted-foreground/45 mx-auto" />
                  <h3 className="font-bold text-foreground">Waiting for proposals</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    We&apos;ve notified our network of tailors. You should start receiving quotes within 24-48 hours.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotations.map(quote => (
                    <div key={quote.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:border-primary/30 transition-colors space-y-4">
                      {/* Tailor info & price */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {quote.tailor?.name?.charAt(0) || "T"}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{quote.tailor?.name || "Verified Tailor"}</p>
                            <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              {quote.profile?.avg_rating?.toFixed(1) || "5.0"} Rating
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">{formatINR(quote.price)}</p>
                          <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" /> {quote.estimated_days} days
                          </p>
                        </div>
                      </div>

                      {quote.note && (
                        <div className="bg-muted p-3 rounded-xl text-sm text-foreground/80">
                          &ldquo;{quote.note}&rdquo;
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="space-y-2 pt-2">
                        <div className="flex gap-3">
                          {/* Accept & Pay (simulated) */}
                          <Button
                            className="flex-1 bg-primary text-primary-foreground font-semibold rounded-xl"
                            onClick={() => handleAcceptAndPay(quote)}
                            disabled={acceptingId !== null}
                          >
                            {acceptingId === quote.id ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                            ) : (
                              "Accept & Pay (Simulated)"
                            )}
                          </Button>
                          <Link href="/dashboard/messages" className="flex-1">
                            <Button variant="outline" className="w-full font-semibold rounded-xl gap-2" disabled={acceptingId !== null}>
                              <MessageSquare className="w-4 h-4" /> Message
                            </Button>
                          </Link>
                        </div>
                        {/* Simulated payment notice */}
                        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          Simulated payment — Razorpay integration coming soon. No real charge will be made.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── QUOTED: single quote received, awaiting customer decision ── */}
          {request.status === "quoted" && (
            <>
              <h2 className="text-xl font-serif font-bold text-foreground mb-4">Quote Received</h2>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-sm text-amber-700 dark:text-amber-400 mb-4">
                A tailor has submitted a quote for your request. Review the details below and accept to confirm.
              </div>

              {acceptError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{acceptError}</span>
                </div>
              )}

              <div className="space-y-4">
                {quotations.map(quote => (
                  <div key={quote.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {quote.tailor?.name?.charAt(0) || "T"}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{quote.tailor?.name || "Verified Tailor"}</p>
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {quote.profile?.avg_rating?.toFixed(1) || "5.0"} Rating
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">{formatINR(quote.price)}</p>
                        <p className="text-xs text-muted-foreground">{quote.estimated_days} days</p>
                      </div>
                    </div>

                    <QuotationBreakdownCard quote={quote} />

                    <div className="space-y-2 pt-2">
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 bg-primary text-primary-foreground font-semibold rounded-xl"
                          onClick={() => handleAcceptAndPay(quote)}
                          disabled={acceptingId !== null}
                        >
                          {acceptingId === quote.id ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
                          ) : (
                            "Accept & Pay (Simulated)"
                          )}
                        </Button>
                        <Link href="/dashboard/messages" className="flex-1">
                          <Button variant="outline" className="w-full font-semibold rounded-xl gap-2" disabled={acceptingId !== null}>
                            <MessageSquare className="w-4 h-4" /> Message
                          </Button>
                        </Link>
                      </div>
                      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Simulated payment — Razorpay integration coming soon. No real charge will be made.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ACTIVE ORDER: show status & actions ── */}
          {isActiveOrder && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
                <h2 className="text-xl font-serif font-bold text-foreground">Order Status</h2>

                {/* Assigned tailor */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold">ASSIGNED TAILOR</p>
                    <p className="font-bold text-foreground truncate">{request.tailor?.name || "Tailor"}</p>
                  </div>
                  <Link href="/dashboard/messages">
                    <Button size="icon" variant="outline" className="rounded-full h-10 w-10">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                {/* Order details / breakdown */}
                {request.accepted_quotation ? (
                  <QuotationBreakdownCard quote={request.accepted_quotation} />
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Agreed Price</span>
                      <span className="font-semibold">{formatINR(request.accepted_quotation?.price || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Estimated Time</span>
                      <span className="font-semibold">{request.accepted_quotation?.estimated_days || 0} days</span>
                    </div>
                    {request.amount_paid > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="font-semibold text-emerald-600">{formatINR(request.amount_paid)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status-specific customer actions */}

                {/* Paid state — waiting for tailor to start */}
                {request.status === "paid" && (
                  <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Payment confirmed. Waiting for your tailor to begin production.</span>
                  </div>
                )}

                {/* In Production — nothing for customer to do */}
                {request.status === "in_production" && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                    <Scissors className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Your garment is being crafted. You&apos;ll be notified when it ships.</span>
                  </div>
                )}

                {/* Shipped — customer can confirm delivery */}
                {request.status === "shipped" && (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 text-sm font-bold gap-2"
                      onClick={handleConfirmDelivery}
                      disabled={isConfirming}
                    >
                      {isConfirming ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Confirming…</>
                      ) : (
                        <><CheckCircle className="w-4 h-4" /> Confirm Delivery</>
                      )}
                    </Button>
                    {confirmError && (
                      <p className="flex items-start gap-1.5 text-xs text-destructive">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {confirmError}
                      </p>
                    )}
                  </div>
                )}

                {/* Delivered / Reviewed */}
                {["delivered", "reviewed"].includes(request.status) && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      <PackageCheck className="w-4 h-4 shrink-0" />
                      Delivery confirmed on {request.delivered_confirmed_at
                        ? new Date(request.delivered_confirmed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </div>

                    {request.status === "delivered" && !request.review?.length && (
                      <div className="bg-muted p-4 rounded-2xl border border-border space-y-4">
                        <h4 className="font-bold text-sm text-foreground">Rate your tailor</h4>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted text-border"
                                } transition-colors`}
                              />
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Leave a comment about the craftsmanship, fit, and communication..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="min-h-[80px] text-sm w-full rounded-md border border-input bg-transparent px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {reviewError && (
                          <p className="text-xs text-destructive flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {reviewError}
                          </p>
                        )}
                        <Button 
                          onClick={handleSubmitReview}
                          disabled={isSubmittingReview}
                          className="w-full font-bold"
                        >
                          {isSubmittingReview ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Submitting...</> : "Submit Review"}
                        </Button>
                      </div>
                    )}

                    {request.review && request.review.length > 0 && (
                      <div className="bg-muted p-4 rounded-2xl border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-foreground">Your Review</h4>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= request.review[0].rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted text-border"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {request.review[0].comment && (
                          <p className="text-sm text-muted-foreground italic">&quot;{request.review[0].comment}&quot;</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Panel */}
              {currentUserId && (
                <div className="bg-card border border-border rounded-3xl p-6 mt-6">
                  <h3 className="text-xl font-serif font-bold text-foreground mb-4">Messages</h3>
                  <ChatWindow 
                    orderId={request.id} 
                    currentUserId={currentUserId} 
                    placeholderText="Send a message to your tailor..."
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
