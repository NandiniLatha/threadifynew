"use client"

import * as React from "react"
import { Loader2, CheckCircle, AlertCircle, CreditCard, Smartphone, Building, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatINR } from "@/lib/utils/currency"

export interface DemoCheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  quote: { id: string; price: number; tailorName: string } | null
  garmentName: string
  orderId: string
  onSuccess: () => void
}

type CheckoutStep = "selection" | "processing" | "success" | "error"

export function DemoCheckoutDialog({
  isOpen,
  onClose,
  quote,
  garmentName,
  orderId,
  onSuccess,
}: DemoCheckoutDialogProps) {
  const [step, setStep] = React.useState<CheckoutStep>("selection")
  const [paymentMethod, setPaymentMethod] = React.useState<"upi" | "card" | "netbanking">("upi")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [transactionId, setTransactionId] = React.useState<string | null>(null)

  // Reset state when opened
  React.useEffect(() => {
    if (isOpen) {
      setStep("selection")
      setErrorMsg(null)
      setTransactionId(null)
    }
  }, [isOpen])

  const handlePay = async () => {
    if (!quote) return
    
    setStep("processing")
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/orders/${orderId}/mock-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Payment failed. Please try again.")
      }
      
      // Simulate network delay for realism
      setTimeout(() => {
        setTransactionId(data.transactionId || `THR-DEMO-${Date.now()}`)
        setStep("success")
      }, 1500)
      
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.")
      setStep("error")
    }
  }

  const handleContinue = () => {
    onClose()
    onSuccess()
  }

  if (!quote || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
        {step === "selection" && (
          <div className="flex flex-col">
            <div className="bg-primary/5 p-6 border-b border-border/50">
              <div className="flex items-center gap-2 text-primary font-bold mb-4 text-sm">
                <ShieldCheck className="w-4 h-4" />
                Threadify Secure Checkout
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-1">Order Summary</h2>
              <p className="text-muted-foreground text-sm mb-4">Complete your payment to begin production.</p>
              
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{garmentName}</p>
                    <p className="text-xs text-muted-foreground">Tailor: {quote.tailorName}</p>
                  </div>
                  <p className="font-bold text-lg text-primary">{formatINR(quote.price)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-2 text-amber-700 dark:text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p><strong>DEMO PAYMENT</strong> — This is a portfolio demo. No real money will be charged.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">Select Demo Payment Method</h3>
                
                <div 
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === "upi" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                  onClick={() => setPaymentMethod("upi")}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "upi" ? "border-primary" : "border-muted-foreground"}`}>
                    {paymentMethod === "upi" && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">UPI (GPay, PhonePe, Paytm)</span>
                </div>

                <div 
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "card" ? "border-primary" : "border-muted-foreground"}`}>
                    {paymentMethod === "card" && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Credit / Debit Card</span>
                </div>

                <div 
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${paymentMethod === "netbanking" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                  onClick={() => setPaymentMethod("netbanking")}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "netbanking" ? "border-primary" : "border-muted-foreground"}`}>
                    {paymentMethod === "netbanking" && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Net Banking</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handlePay} className="flex-1 h-12 text-base font-bold rounded-xl shadow-sm">
                  Pay {formatINR(quote.price)}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Processing Payment...</h2>
              <p className="text-sm text-muted-foreground mt-1">Please do not close this window.</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Payment Successful!</h2>
              <p className="text-sm text-muted-foreground mt-1">Your order is now confirmed and paid.</p>
            </div>
            
            <div className="w-full bg-muted/50 border border-border rounded-2xl p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono font-medium">{transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{new Date().toLocaleDateString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(quote.price)}</span>
              </div>
            </div>

            <Button onClick={handleContinue} className="w-full h-12 font-bold rounded-xl">
              Continue to Order
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Payment Failed</h2>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setStep("selection")} className="flex-1 rounded-xl">
                Try Again
              </Button>
              <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
