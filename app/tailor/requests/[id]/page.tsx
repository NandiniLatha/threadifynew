"use client"

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
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"

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

  // Form states
  const [price, setPrice] = React.useState("")
  const [days, setDays] = React.useState("")
  const [note, setNote] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Fetch request details — explicit columns only, not select(*)
        const { data: reqData, error: reqError } = await supabase
          .from("design_requests")
          .select(`
            id,
            status,
            budget_max,
            description,
            ai_tags,
            image_url,
            measurements,
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

        // Check if tailor already placed a quote — explicit columns only
        const { data: quoteData, error: quoteError } = await supabase
          .from("quotations")
          .select("id, price, delivery_days, note, status")
          .eq("request_id", id)
          .eq("tailor_id", user.id)
          .single()
        
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

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!price || !days) {
      setErrorMsg("Please provide a price and estimated days.")
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("quotations")
        .insert({
          request_id: id,
          tailor_id: user.id,
          price: parseFloat(price),
          estimated_days: parseInt(days, 10),
          note: note || "",
          status: "pending"
        })
        .select()
        .single()

      if (error) throw error

      setMyQuote(data)
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setErrorMsg(err.message || "Failed to submit quotation.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-10 h-10" />
          <p className="font-semibold">{errorMsg || "Request not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/tailor/requests")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {request.ai_tags[0] || "Custom Design Request"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Requested by <span className="font-semibold">{request.customer?.name || "Customer"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Request Details */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-border bg-muted relative shadow-sm">
            <img 
              src={request.image_url} 
              alt="Design inspiration" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-sm">
            <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <FileText className="w-4 h-4 text-primary" />
              Requirements
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Budget</p>
                <p className="text-sm font-bold text-primary">{formatINR(request.budget_min)} – {formatINR(request.budget_max)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Client Deadline</p>
                <p className="text-sm font-bold">{request.deadline}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Detected Elements</p>
              <div className="flex flex-wrap gap-1.5">
                {request.ai_tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 bg-muted border border-border rounded-md text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            {request.notes && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Client Notes</p>
                 <p className="text-sm text-foreground/90 bg-muted/50 p-4 rounded-xl leading-relaxed italic border border-border/50">&ldquo;{request.notes}&rdquo;</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quoting Form / Status */}
        <div className="space-y-6">
          {request.status !== "pending_bids" ? (
            <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Bidding Closed</h2>
              <p className="text-sm text-muted-foreground">
                This request is no longer accepting quotes. It has either been assigned to a tailor or cancelled.
              </p>
            </div>
          ) : myQuote ? (
            <div className="bg-card border border-primary/30 rounded-3xl p-6 space-y-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Your Quote is Submitted</h2>
                  <p className="text-xs text-muted-foreground">Waiting for the client to review.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-2xl border border-border">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Quoted Price</p>
                  <p className="text-lg font-bold text-primary">{formatINR(myQuote.price)}</p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">Timeline</p>
                  <p className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" /> {myQuote.estimated_days} days
                  </p>
                </div>
              </div>

              {myQuote.note && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Your Message</p>
                   <p className="text-sm bg-muted p-4 rounded-xl text-foreground/80 border border-border/50">&ldquo;{myQuote.note}&rdquo;</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-serif font-bold text-foreground mb-6">Submit Your Quote</h2>
              
              {errorMsg && (
                <div className="p-3 mb-6 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitQuote} className="space-y-5">
                <div>
                  <label htmlFor="price" className="block text-sm font-bold text-foreground mb-1.5">
                    Your Price Quote
                  </label>
                  <div className="relative">
                    <input
                      id="price"
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full h-11 px-3 pl-10 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <IndianRupee className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                     Keep it within the client&apos;s budget of {formatINR(request.budget_min)} - {formatINR(request.budget_max)} to increase your chances.
                  </p>
                </div>

                <div>
                  <label htmlFor="days" className="block text-sm font-bold text-foreground mb-1.5">
                    Estimated Time (Days)
                  </label>
                  <div className="relative">
                    <input
                      id="days"
                      type="number"
                      required
                      min={1}
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      placeholder="e.g. 14"
                      className="w-full h-11 px-3 pl-10 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label htmlFor="note" className="block text-sm font-bold text-foreground mb-1.5">
                    Message to Client (Optional)
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tell the client about your fabric choices, fitting adjustments, and expertise..."
                    className="w-full h-28 p-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl text-base shadow-sm hover:opacity-90 transition-opacity"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Price Quote"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
