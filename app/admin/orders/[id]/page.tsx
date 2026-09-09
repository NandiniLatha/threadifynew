"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatINR } from "@/lib/utils/currency"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  Calendar,
  User,
  Scissors,
  CheckCircle2,
  CreditCard,
  History,
  FileText,
  MessageSquare
} from "lucide-react"

export default function AdminOrderDetail() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [order, setOrder] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchOrderData() {
      setIsLoading(true)
      try {
        // Fetch central design_request and joins
        const { data: requestData, error: reqErr } = await supabase
          .from("design_requests")
          .select(`
            *,
            customer:users!customer_id (id, name, email),
            accepted_quote:quotations!accepted_quotation_id (
              id, price, status, tailor_id, created_at,
              tailor:users!tailor_id (
                id, name,
                profile:tailor_profiles (boutique_name, verification_status)
              )
            ),
            payments (*),
            order_status_history (id, status, created_at, notes)
          `)
          .eq("id", orderId)
          .single()

        if (reqErr || !requestData) {
          throw new Error("Order not found or inaccessible.")
        }

        // Fetch disputes
        const { data: disputeData } = await supabase
          .from("disputes")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })
          .limit(1)

        setOrder({
          ...requestData,
          dispute: disputeData && disputeData.length > 0 ? disputeData[0] : null
        })



      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      fetchOrderData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (errorMsg || !order) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.push("/admin/orders")} className="flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </button>
        <div className="p-6 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-3xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg || "An error occurred."}</span>
        </div>
      </div>
    )
  }

  const quote = Array.isArray(order.accepted_quote) ? order.accepted_quote[0] : order.accepted_quote
  const tailor = quote?.tailor
  const tailorProfile = tailor ? (Array.isArray(tailor.profile) ? tailor.profile[0] : tailor.profile) : null
  const payments = Array.isArray(order.payments) ? order.payments : (order.payments ? [order.payments] : [])
  const history = Array.isArray(order.order_status_history) ? order.order_status_history : (order.order_status_history ? [order.order_status_history] : [])
  const sortedHistory = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  
  // Payment Fallback Logic
  const paymentRecord = payments.length > 0 ? payments[0] : null
  const fallbackPaymentId = order.razorpay_payment_id || null
  const hasPaymentInfo = paymentRecord || fallbackPaymentId

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Navigation */}
      <button onClick={() => router.push("/admin/orders")} className="flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders List
      </button>

      {/* Header */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="font-mono text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Order {order.id.split('-')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{order.id}</p>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">
              {quote ? formatINR(Number(quote.price)) : "—"}
            </span>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-muted border border-border text-foreground uppercase tracking-wider">
            Status: {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Parties Involved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer */}
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" /> Customer Details
              </h3>
              {order.customer ? (
                <div className="space-y-1">
                  <p className="font-bold text-foreground">{order.customer.name}</p>
                  <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Customer information unavailable.</p>
              )}
            </div>

            {/* Tailor */}
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-4 relative group">
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <Scissors className="w-5 h-5 text-muted-foreground" /> Assigned Tailor
              </h3>
              {tailor ? (
                <div className="space-y-1">
                  <p className="font-bold text-foreground flex items-center gap-2">
                    {tailor.name}
                    {tailorProfile?.verification_status === "approved" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{tailorProfile?.boutique_name || "Independent Tailor"}</p>
                  <Link href={`/admin/tailors/${tailor.id}`} className="inline-block mt-3 text-xs font-bold text-primary hover:underline">
                    View Tailor Profile &rarr;
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No tailor assigned yet.</p>
              )}
            </div>

          </div>

          {/* Design & Request Info */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
              <FileText className="w-5 h-5 text-muted-foreground" /> Request Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title</span>
                <p className="text-foreground mt-1 font-semibold">{order.title}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Created</span>
                <p className="text-foreground mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {new Date(order.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</span>
                <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed p-4 bg-muted/40 rounded-2xl border border-border/50">
                  {order.description || "No description provided."}
                </div>
              </div>
              {order.reference_image_url && (
                <div className="sm:col-span-2 space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reference Image</span>
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-border">
                    <Image 
                      src={order.reference_image_url} 
                      alt="Design Reference" 
                      fill 
                      className="object-cover hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
              <CreditCard className="w-5 h-5 text-muted-foreground" /> Payment Information
            </h3>
            
            {!hasPaymentInfo ? (
              <div className="text-center py-6 border border-dashed border-border rounded-2xl">
                <p className="text-sm text-muted-foreground">No payment records found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/40 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Status</span>
                  <p className="text-sm font-mono mt-1 text-foreground">
                    {paymentRecord?.status || (order.status !== "pending_bids" && order.status !== "draft" ? "Paid" : "Pending")}
                  </p>
                </div>
                <div className="p-4 bg-muted/40 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount Paid</span>
                  <p className="text-sm font-bold mt-1 text-foreground">
                    {paymentRecord?.amount ? formatINR(Number(paymentRecord.amount)) : (order.amount_paid ? formatINR(Number(order.amount_paid)) : "—")}
                  </p>
                </div>
                <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 sm:col-span-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transaction ID</span>
                  <p className="text-xs font-mono mt-1 text-muted-foreground">
                    {paymentRecord?.razorpay_payment_id || fallbackPaymentId || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Dispute Box */}
          {order.dispute ? (
            <div className="bg-destructive/10 border border-destructive/30 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-destructive flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Open Dispute
              </h3>
              <p className="text-sm text-destructive/80 font-bold uppercase tracking-wider">{order.dispute.status}</p>
              <div className="p-3 bg-background rounded-xl border border-destructive/20 text-xs text-foreground leading-relaxed">
                {order.dispute.reason}
              </div>
              <Link href="/admin/disputes" className="inline-block text-xs font-bold text-destructive hover:underline">
                Manage in Disputes &rarr;
              </Link>
            </div>
          ) : (
            <div className="bg-card border border-border p-6 rounded-3xl shadow-sm text-center">
              <p className="text-sm text-muted-foreground font-semibold">No dispute raised.</p>
            </div>
          )}

          {/* Timeline History */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
              <History className="w-5 h-5 text-muted-foreground" /> Order Timeline
            </h3>

            {sortedHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">Timeline history unavailable.</p>
            ) : (
              <div className="relative pl-6 space-y-6 border-l-2 border-muted">
                {sortedHistory.map((item: any, i: number) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                    <div>
                      <p className="text-sm font-bold text-foreground capitalize">{item.status.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(item.created_at).toLocaleString("en-IN", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded-xl border border-border">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Internal Messaging Note */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm text-center space-y-2">
             <MessageSquare className="w-6 h-6 text-muted-foreground mx-auto" />
             <p className="text-sm font-semibold text-foreground">Message Records</p>
             <p className="text-xs text-muted-foreground">Admin viewing of customer-tailor messages is currently restricted by privacy rules.</p>
          </div>

        </div>
      </div>
    </div>
  )
}
