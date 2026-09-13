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
  Camera,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusStepper } from "@/components/shared/StatusStepper"
import { QuotationBreakdownCard } from "@/components/shared/QuotationBreakdownCard"
import { ChatWindow } from "@/components/shared/ChatWindow"
import { DemoCheckoutDialog } from "@/components/shared/DemoCheckoutDialog"

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

  // Approval state
  const [isApproving, setIsApproving] = React.useState(false)
  const [approvalError, setApprovalError] = React.useState<string | null>(null)
  const [isRejecting, setIsRejecting] = React.useState(false)
  const [feedbackComment, setFeedbackComment] = React.useState("")
  const [showFeedbackInput, setShowFeedbackInput] = React.useState(false)

  // Payment Verification & Feedback Display
  const [paymentVerified, setPaymentVerified] = React.useState(false)
  const [feedbackCommentDisplay, setFeedbackCommentDisplay] = React.useState<string | null>(null)

  // Progress photos uploaded by the tailor
  interface ProgressPhoto { id: string; image_url: string; sort_order: number; created_at: string }
  const [progressPhotos, setProgressPhotos] = React.useState<ProgressPhoto[]>([])

  // Progress photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)
  const [uploadPhotoError, setUploadPhotoError] = React.useState<string | null>(null)
  const [uploadPhotoSuccess, setUploadPhotoSuccess] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Demo Checkout state
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false)
  const [checkoutQuote, setCheckoutQuote] = React.useState<any>(null)

  // Cancellation state
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [cancelError, setCancelError] = React.useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = React.useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = React.useState(false)

  const loadProgressPhotos = React.useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/progress-photos`)
      if (!res.ok) return
      const data = await res.json()
      setProgressPhotos(data.photos ?? [])
    } catch {
      // Non-critical — silently ignore
    }
  }, [])

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

      // Check payment verification
      if (!["draft", "pending_bids", "quoted", "quote_accepted", "assigned", "payment_pending"].includes(reqData.status)) {
        const { data: payment } = await supabase
          .from("payments")
          .select("id")
          .eq("order_id", id)
          .eq("payment_status", "completed")
          .maybeSingle()
        setPaymentVerified(!!payment)
      } else {
        setPaymentVerified(false)
      }

      // Fetch feedback if changes requested
      if (reqData.production_evidence_status === "changes_requested") {
        const { data: feedback } = await supabase
          .from("production_feedback")
          .select("comment")
          .eq("request_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
        if (feedback) setFeedbackCommentDisplay(feedback.comment)
      }

      // Load progress photos when order is in an active production state
      const ACTIVE_FOR_PHOTOS = ["paid", "confirmed", "in_production", "cutting", "stitching", "quality_check", "ready", "shipped", "delivered", "completed", "reviewed", "assigned", "measurements_pending"]
      if (ACTIVE_FOR_PHOTOS.includes(reqData.status)) {
        loadProgressPhotos(reqData.id)
      }

      // Fetch all quotations while request is in bidding, assigned, or quoted stages
      if (["pending_bids", "quoted", "assigned"].includes(reqData.status)) {
        const { data: quotesData, error: quotesError } = await supabase
          .from("quotations")
          .select(`
            *,
            tailor:users!tailor_id (
              name,
              tailor_profiles (avg_rating, portfolio_images),
              tailor_portfolio_items (public_url)
            )
          `)
          .eq("request_id", id)
          .order("price", { ascending: true })

        if (quotesError) {
          console.error("Quotes fetch error:", quotesError)
        } else if (quotesData) {
          // Filter out withdrawn quotes and keep only the latest active quote per tailor
          const activeQuotes = quotesData.filter((q: any) => q.status === "pending" || q.status === "accepted")
          
          // Deduplicate: If there are historical duplicate pending quotes from the same tailor, only keep the newest
          const tailorQuoteMap = new Map()
          
          // Assuming quotesData is already ordered by price asc, but we need to resolve duplicates by taking the latest.
          // Instead, let's just group them and take the first one (since we might want the cheapest or newest).
          // To be safe and show only 1 per tailor:
          for (const q of activeQuotes) {
            if (!tailorQuoteMap.has(q.tailor_id) || new Date(q.created_at) > new Date(tailorQuoteMap.get(q.tailor_id).created_at)) {
              tailorQuoteMap.set(q.tailor_id, q)
            }
          }
          
          const uniqueQuotes = Array.from(tailorQuoteMap.values())
          
          const mappedQuotes = uniqueQuotes.map((q: any) => {
            const profile = Array.isArray(q.tailor?.tailor_profiles) ? q.tailor.tailor_profiles[0] : q.tailor?.tailor_profiles
            const pImages = [
              ...(q.tailor?.tailor_portfolio_items || []).map((i: any) => i.public_url),
              ...(profile?.portfolio_images || [])
            ]
            if (profile) {
              profile.portfolio_images = pImages
            }
            return {
              ...q,
              profile
            }
          })
          
          // Re-sort by price ascending for display
          mappedQuotes.sort((a, b) => a.price - b.price)
          
          setQuotations(mappedQuotes)
        }
      }
    } catch (err) {
      console.error("Load data error:", err)
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
          // Also refresh progress photos in case the tailor just uploaded one
          if (id) loadProgressPhotos(id as string)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase, loadData])

  // Open the Demo Checkout Dialog
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenCheckout = (quote: any) => {
    setCheckoutQuote(quote)
    setIsCheckoutOpen(true)
  }

  const handleCheckoutSuccess = async () => {
    // Reload the page state so it reflects the new paid status
    await loadData()
  }

  const handleCancelOrder = async () => {
    if (!id) return
    setIsCancelling(true)
    setCancelError(null)
    setCancelSuccess(false)
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "POST"
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "We couldn't cancel this order. Please try again.")
      }
      setCancelSuccess(true)
      setIsCancelConfirmOpen(false)
      loadData()
    } catch (err: any) {
      setCancelError(err.message || "We couldn't cancel this order. Please try again.")
    } finally {
      setIsCancelling(false)
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

  const handleApproval = async (action: "approve" | "request_changes") => {
    if (action === "approve") setIsApproving(true)
    else setIsRejecting(true)
    setApprovalError(null)

    try {
      const res = await fetch(`/api/orders/${request.id}/customer-approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, stage: request.status, comment: action === "request_changes" ? feedbackComment : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to process approval")
      
      // Reload request
      const { data: newReq } = await supabase.from("design_requests").select("*, tailor:users!tailor_id (name, email), accepted_quotation:quotations!accepted_quotation_id (price, estimated_days, note), review:reviews!order_id (rating, comment)").eq("id", request.id).single()
      if (newReq) setRequest(newReq)
      setShowFeedbackInput(false)
      setFeedbackComment("")
    } catch (err: any) {
      setApprovalError(err.message)
    } finally {
      setIsApproving(false)
      setIsRejecting(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadPhotoError(null)
    setUploadPhotoSuccess(false)

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setUploadPhotoError("Please select a valid image (JPEG, PNG, or WEBP).")
      e.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadPhotoError("Image must be smaller than 5MB.")
      e.target.value = ""
      return
    }

    setIsUploadingPhoto(true)

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
      })
      reader.readAsDataURL(file)
      const base64 = await base64Promise

      const res = await fetch(`/api/orders/${id}/progress-photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload photo.")
      
      setUploadPhotoSuccess(true)
      if (id) await loadProgressPhotos(id as string)
      setTimeout(() => setUploadPhotoSuccess(false), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload error"
      setUploadPhotoError(msg)
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const getStatusDisplay = (status: string) => {
    const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      draft:                { label: "Draft",                         color: "text-muted-foreground", icon: <Clock className="w-4 h-4" /> },
      pending_bids:         { label: "Requested",                     color: "text-amber-600",        icon: <Clock className="w-4 h-4" /> },
      quoted:               { label: "Price Sent",                    color: "text-amber-600",        icon: <Star className="w-4 h-4" /> },
      quote_accepted:       { label: "Price Accepted",                color: "text-primary",          icon: <CheckCircle className="w-4 h-4" /> },
      assigned:             { label: "Tailor Assigned",               color: "text-primary",          icon: <User className="w-4 h-4" /> },
      payment_pending:      { label: "Payment Pending",               color: "text-amber-600",        icon: <CreditCard className="w-4 h-4" /> },
      paid:                 { label: "Payment Done",                  color: "text-primary",          icon: <CreditCard className="w-4 h-4" /> },
      confirmed:            { label: "Confirmed",                     color: "text-primary",          icon: <CheckCircle className="w-4 h-4" /> },
      measurements_pending: { label: "Sending Measurements",          color: "text-amber-600",        icon: <Clock className="w-4 h-4" /> },
      cutting:              { label: "Cutting",                       color: "text-primary",          icon: <Scissors className="w-4 h-4" /> },
      stitching:            { label: "Stitching",                     color: "text-primary",          icon: <Scissors className="w-4 h-4" /> },
      quality_check:        { label: "Quality Check",                 color: "text-primary",          icon: <CheckCircle className="w-4 h-4" /> },
      ready:                { label: "Ready",                         color: "text-emerald-600",      icon: <PackageCheck className="w-4 h-4" /> },
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
        <StatusStepper status={request.status} evidenceStatus={request.production_evidence_status} paymentVerified={paymentVerified} />
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
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}

            {["pending_bids", "assigned"].includes(request.status) && (
              <div className="pt-4 border-t border-border mt-4">
                {cancelError && (
                  <div className="p-3 mb-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cancelError}</span>
                  </div>
                )}
                {cancelSuccess && (
                  <div className="p-3 mb-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Order cancelled successfully.</span>
                  </div>
                )}
                
                {isCancelConfirmOpen ? (
                  <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-2xl space-y-3">
                    <p className="text-sm font-medium text-destructive">Are you sure you want to cancel this order?</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        className="flex-1 rounded-xl"
                        onClick={handleCancelOrder}
                        disabled={isCancelling}
                      >
                        {isCancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Cancel Order
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-xl"
                        onClick={() => setIsCancelConfirmOpen(false)}
                        disabled={isCancelling}
                      >
                        Keep Order
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 rounded-xl"
                    onClick={() => setIsCancelConfirmOpen(true)}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quotes or Active Order info */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── PENDING BIDS / ASSIGNED: show quotation comparison ── */}
          {["pending_bids", "assigned", "quoted"].includes(request.status) && (
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
                          {/* Accept & Pay (Demo Checkout) */}
                          <Button
                            className="flex-1 bg-primary text-primary-foreground font-semibold rounded-xl"
                            onClick={() => handleOpenCheckout(quote)}
                          >
                            Accept & Pay
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
                    <span>Your clothing is being crafted. You&apos;ll be notified when it ships.</span>
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

              {/* Production Updates — tailor progress photos */}
              <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Production Updates
                  </h3>
                  
                  {currentUserId === request.tailor_id && (
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/webp" 
                        onChange={handlePhotoUpload} 
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="gap-2 rounded-full"
                      >
                        {isUploadingPhoto ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                        ) : (
                          <><Camera className="w-4 h-4" /> Add Photo</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {uploadPhotoError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadPhotoError}</span>
                  </div>
                )}
                {uploadPhotoSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Photo uploaded successfully!</span>
                  </div>
                )}

                {progressPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {progressPhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-2xl overflow-hidden border border-border block group relative"
                        title={new Date(photo.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.image_url}
                          alt={`Production update ${photo.sort_order}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 rounded-2xl bg-muted/30 border border-border/50 border-dashed text-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No progress photos yet</p>
                    <p className="text-xs text-muted-foreground/70 max-w-xs">
                      Your tailor will post production updates here as your garment is crafted.
                    </p>
                  </div>
                )}

                {request.production_evidence_status === "waiting_for_customer_approval" && (
                  <div className="mt-6 p-5 border border-primary/20 bg-primary/5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-foreground">Action Required: Approve Stage</h4>
                    <p className="text-sm text-muted-foreground">Your tailor has uploaded new work photos. Please review the photos and approve to continue production.</p>
                    {approvalError && <p className="text-sm text-destructive">{approvalError}</p>}
                    
                    {!showFeedbackInput ? (
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={() => handleApproval("approve")} disabled={isApproving || isRejecting} className="bg-primary text-primary-foreground font-bold">
                          {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          Approve & Continue
                        </Button>
                        <Button onClick={() => setShowFeedbackInput(true)} variant="outline" disabled={isApproving || isRejecting}>
                          Request Changes
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          className="w-full min-h-[80px] p-3 text-sm rounded-xl border border-border bg-background"
                          placeholder="Describe the changes you'd like..."
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleApproval("request_changes")} disabled={isApproving || isRejecting || !feedbackComment.trim()} variant="destructive">
                            {isRejecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Submit Feedback
                          </Button>
                          <Button onClick={() => setShowFeedbackInput(false)} variant="ghost" disabled={isApproving || isRejecting}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {request.production_evidence_status === "changes_requested" && feedbackCommentDisplay && (
                  <div className="mt-6 p-5 border border-red-500/20 bg-red-500/5 rounded-2xl space-y-3">
                    <h4 className="font-bold text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Changes Requested
                    </h4>
                    <p className="text-sm text-foreground">You requested the following changes:</p>
                    <div className="p-3 bg-background border border-border rounded-xl text-sm italic text-muted-foreground">
                      &ldquo;{feedbackCommentDisplay}&rdquo;
                    </div>
                    <p className="text-xs text-muted-foreground">The tailor has been notified and will upload new photos once the changes are made.</p>
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

      <DemoCheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        quote={checkoutQuote ? {
          id: checkoutQuote.id,
          price: checkoutQuote.price,
          tailorName: checkoutQuote.tailor?.name || "Tailor"
        } : null}
        garmentName={request.ai_tags?.[0] || "Custom Design"}
        orderId={request.id}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  )
}
