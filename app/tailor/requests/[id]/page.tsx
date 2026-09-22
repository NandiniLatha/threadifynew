"use client"
import Image from "next/image"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  IndianRupee,
  Clock,
  FileText,
  Tag,
  Scissors
} from "lucide-react"
import { Button } from "@/components/ui/button"

const STATUS_LABEL: Record<string, string> = {
  pending_bids:         "Waiting for Proposals",
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

export default function TailorRequestDetails() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [request, setRequest] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myQuote, setMyQuote] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const [priceError, setPriceError] = React.useState<string | null>(null)
  const [daysError, setDaysError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        const { data: reqData, error: reqError } = await supabase
          .from("design_requests")
          .select(`
            id,
            status,
            budget_max,
            budget_min,
            ai_tags,
            notes,
            image_url,
            customer:users!customer_id ( name )
          `)
          .eq("id", id)
          .single()

        if (reqError || !reqData) {
          setErrorMsg("Could not find this design request.")
          setIsLoading(false)
          return
        }
        setRequest(reqData)

        // Check if tailor already placed a quote
        const { data: quoteData, error: quoteError } = await supabase
          .from("quotations")
          .select("id, price, estimated_days, note, status")
          .eq("request_id", id)
          .eq("tailor_id", user.id)
          .maybeSingle()
        
        if (!quoteError && quoteData) {
          setMyQuote(quoteData)
        }

      } catch {
        setErrorMsg("An unexpected error occurred.")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) loadData()
  }, [id, router, supabase])

  const [price, setPrice] = React.useState("")
  const [days, setDays] = React.useState("")
  const [note, setNote] = React.useState("")


  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setPriceError(null)
    setDaysError(null)
    setErrorMsg(null)
    setSuccessMsg(null)

    let hasErrors = false
    if (!price || Number(price) <= 0) {
      setPriceError("Please enter a valid price quote.")
      hasErrors = true
    }

    if (!days || Number(days) < 1) {
      setDaysError("Please enter the estimated number of days.")
      hasErrors = true
    }

    if (hasErrors) return

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          price: price,
          estimatedDays: days,
          note: note,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccessMsg("Price Quote successfully submitted!")
        // Update local UI immediately
        setMyQuote({
          price: parseFloat(price),
          estimated_days: parseInt(days, 10),
          note: note,
          status: "pending"
        })
      } else {
        setErrorMsg(data.error || "Failed to submit quote.")
      }
    } catch {
      setErrorMsg("Could not submit quotation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const { customizations, regularNotes } = React.useMemo(() => {
    if (!request?.notes) return { customizations: [], regularNotes: "" }
    
    const customMatch = request.notes.match(/\[Customization:([\s\S]*?)\]/i)
    const items: { label: string; value: string }[] = []
    let regNotes = request.notes

    if (customMatch) {
      const rawPairs = customMatch[1].split('|').map((s: string) => s.trim())
      for (const pair of rawPairs) {
        const parts = pair.split(':')
        if (parts.length >= 2) {
          const label = parts[0].trim()
          const value = parts.slice(1).join(':').trim()
          const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
          if (value && value.toLowerCase() !== "none") {
            items.push({ label: formattedLabel, value })
          }
        }
      }
      regNotes = request.notes.replace(customMatch[0], '').trim()
    }

    return { customizations: items, regularNotes: regNotes }
  }, [request?.notes])

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  if (errorMsg && !request) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto mt-20">
          <AlertCircle className="w-10 h-10" />
          <p className="font-semibold">{errorMsg || "Request not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/tailor/requests")} className="rounded-full shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            {request.ai_tags?.[0] || "Custom Design Request"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            Requested by <span className="font-semibold text-foreground">{request.customer?.name || "Customer"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* ── Left Column: Request Details (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-8">
          {/* Inspiration Image */}
          <div className="aspect-[4/5] sm:aspect-video lg:aspect-[4/5] xl:aspect-video rounded-[2rem] overflow-hidden border border-border bg-muted relative shadow-sm group">
            <Image 
              src={request.image_url} 
              alt="Design inspiration" 
              fill
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-background/90 backdrop-blur-md text-foreground text-xs font-bold px-3 py-1.5 rounded-full border border-border flex items-center shadow-sm">
                <Scissors className="w-3 h-3 mr-1.5" /> Client Inspiration
              </span>
            </div>
          </div>
          
          {/* Detailed Breakdown */}
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-bold text-foreground border-b border-border pb-4">
              Requirements & Details
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Target Budget</p>
                <p className="text-lg font-bold text-foreground">{formatINR(request.budget_min)} – {formatINR(request.budget_max)}</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Required Deadline</p>
                <p className="text-lg font-bold text-foreground">{request.deadline}</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 col-span-2 sm:col-span-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Status</p>
                <p className="text-lg font-bold text-foreground capitalize">{STATUS_LABEL[request.status] ?? request.status.replace("_", " ")}</p>
              </div>
            </div>

            {request.ai_tags && request.ai_tags.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">AI Detected Attributes</p>
                <div className="flex flex-wrap gap-2">
                  {request.ai_tags.map((tag: string, i: number) => (
                    <span key={i} className="text-xs font-semibold px-3 py-1.5 bg-background border border-border rounded-lg text-foreground shadow-sm flex items-center">
                      <Tag className="w-3 h-3 mr-1.5 text-muted-foreground" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {(regularNotes || customizations.length > 0) && (
              <div className="pt-2">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Client Notes
                </p>
                <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 shadow-sm">
                  {customizations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                      {customizations.map((c, i) => (
                        <div key={i} className="flex border-b border-border/30 pb-2 sm:border-0 sm:pb-0 last:border-0">
                          <span className="text-sm text-muted-foreground w-28 shrink-0">{c.label}</span>
                          <span className="text-sm font-medium text-foreground">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {regularNotes && (
                    <div className={customizations.length > 0 ? "mt-5 pt-5 border-t border-border/50" : ""}>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap italic">
                        {regularNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Quoting Action (5 Cols) ── */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            {request.status !== "pending_bids" ? (
              <div className="bg-card border border-border rounded-[2rem] p-10 text-center space-y-5 shadow-sm">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                   <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Bidding Closed</h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto">
                    This request is no longer accepting quotes. It has either been assigned to a tailor or cancelled.
                  </p>
                </div>
              </div>
            ) : myQuote ? (
              <div className="bg-card border border-primary/30 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/5 rounded-full pointer-events-none" />
                
                <div className="flex flex-col items-center text-center pb-6 border-b border-border/50 mb-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-foreground">Quote Submitted</h2>
                  <p className="text-sm text-muted-foreground mt-1">Waiting for the client to review your proposal.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Offered Price</p>
                    <p className="text-xl font-bold text-primary">{formatINR(myQuote.price)}</p>
                  </div>
                  <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Timeline</p>
                    <p className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" /> {myQuote.estimated_days} days
                    </p>
                  </div>
                </div>

                {myQuote.note && (
                  <div className="mt-6">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Your Message</p>
                     <p className="text-sm bg-muted/50 p-4 rounded-2xl text-foreground/80 border border-border/40 italic">&ldquo;{myQuote.note}&rdquo;</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
                <h2 className="text-2xl font-serif font-bold text-foreground mb-1">Submit Proposal</h2>
                <p className="text-sm text-muted-foreground mb-8">Offer your pricing and timeline to win this client.</p>

                <form onSubmit={handleSubmitQuote} className="space-y-6">
                  <div>
                    <label htmlFor="price" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                      Total Price Quote
                    </label>
                    <div className="relative">
                      <input
                        id="price"
                        type="number"
                        min={0}
                        required
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value)
                          if (priceError) setPriceError(null)
                          if (errorMsg) setErrorMsg(null)
                        }}
                        placeholder="e.g. 15000"
                        className={`w-full h-12 px-4 pl-11 border rounded-2xl bg-background text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow ${
                          priceError
                            ? "border-destructive focus:ring-destructive"
                            : "border-border focus:ring-primary"
                        }`}
                      />
                      <IndianRupee className="w-4 h-4 absolute left-4 top-4 text-muted-foreground" />
                    </div>
                    {priceError && (
                      <div className="mt-1.5 p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{priceError}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5">
                       <AlertCircle className="w-3 h-3" />
                       Tip: The client&apos;s budget is {formatINR(request.budget_min)} - {formatINR(request.budget_max)}.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="days" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                      Estimated Delivery (Days)
                    </label>
                    <div className="relative">
                      <input
                        id="days"
                        type="number"
                        required
                        min={1}
                        value={days}
                        onChange={(e) => {
                          setDays(e.target.value)
                          if (daysError) setDaysError(null)
                          if (errorMsg) setErrorMsg(null)
                        }}
                        placeholder="e.g. 14"
                        className={`w-full h-12 px-4 pl-11 border rounded-2xl bg-background text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow ${
                          daysError
                            ? "border-destructive focus:ring-destructive"
                            : "border-border focus:ring-primary"
                        }`}
                      />
                      <Clock className="w-4 h-4 absolute left-4 top-4 text-muted-foreground" />
                    </div>
                    {daysError && (
                      <div className="mt-1.5 p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{daysError}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="note" className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                      Message to Client <span className="text-muted-foreground font-normal lowercase tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Why should the client choose you? Discuss your fabric choices, fitting process, or experience..."
                      className="w-full h-32 p-4 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-shadow"
                    />
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-2xl text-base shadow-sm hover:opacity-90 transition-opacity"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Send Proposal to Client"
                      )}
                    </Button>
                  </div>

                  {/* Submission status feedback placed directly below the button */}
                  {errorMsg && (
                    <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="font-medium">{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-xs sm:text-sm rounded-xl flex items-center gap-2.5 animate-in fade-in">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span className="font-medium">{successMsg}</span>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

