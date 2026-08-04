"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toast } from "@/components/ui/toast"

export default function TailorSettings() {
  const supabase = createClient()

  // States
  const [razorpayAccountId, setRazorpayAccountId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isConnecting, setIsConnecting] = React.useState(false)
  
  // Form fields
  const [businessName, setBusinessName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [ifsc, setIfsc] = React.useState("")

  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showToast, setShowToast] = React.useState(false)

  React.useEffect(() => {
    async function loadAccountStatus() {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email || "")
          
          const { data: profile } = await supabase
            .from("tailor_profiles")
            .select("razorpay_account_id")
            .eq("user_id", user.id)
            .single()

          if (profile?.razorpay_account_id) {
            setRazorpayAccountId(profile.razorpay_account_id)
          }
        }
      } catch {
        console.error("Failed to query settings profile.")
      } finally {
        setIsLoading(false)
      }
    }
    loadAccountStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)

    if (!businessName || !accountNumber || !ifsc) {
      setStatusMsg({ type: "error", text: "Please enter all payout account parameters." })
      return
    }

    setIsConnecting(true)

    try {
      const res = await fetch("/api/tailor/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          email,
          accountNumber,
          ifsc,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setRazorpayAccountId(data.accountId)
        setStatusMsg({ type: "success", text: "Razorpay linked account created successfully!" })
      } else {
        setStatusMsg({ type: "error", text: data.error || "Onboarding failed." })
      }
    } catch {
      setStatusMsg({ type: "error", text: "Failed to connect to the onboarding service." })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your payout account configurations, billing details, and workspace parameters.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : razorpayAccountId ? (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm max-w-xl space-y-6">
          <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-450">
            <UserCheck className="w-6 h-6 shrink-0" />
            <h2 className="text-lg font-bold text-foreground">Payouts Connected</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your Razorpay Route Linked Account is active and configured. Customer order disbursements will be split and routed automatically to your registered bank account upon delivery confirmation.
          </p>
          <div className="p-3 bg-muted/40 border border-border/60 rounded-xl flex justify-between items-center text-xs">
            <span className="font-bold text-muted-foreground">Linked Account ID</span>
            <code className="bg-background px-2.5 py-1 border border-border rounded text-[11px] text-foreground font-mono">
              {razorpayAccountId}
            </code>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm max-w-xl space-y-6">
          <div className="flex items-center space-x-3 text-primary">
            <CreditCard className="w-6 h-6 shrink-0" />
            <h2 className="text-lg font-bold text-foreground">Onboard Payout Accounts</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fill in your legal business name and bank payout credentials. We hold client payments in escrow and split funds upon delivery confirmation.
          </p>

          <form onSubmit={handleOnboard} className="space-y-4">
            <div>
              <label htmlFor="bizName" className="block text-xs font-semibold text-foreground mb-1">
                Legal Business / Tailor Name
              </label>
              <input
                id="bizName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Nandini Couture Boutique"
                className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="bizEmail" className="block text-xs font-semibold text-foreground mb-1">
                Connected Contact Email
              </label>
              <input
                id="bizEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="payouts@atelier.com"
                className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bankAcc" className="block text-xs font-semibold text-foreground mb-1">
                  Bank Account Number
                </label>
                <input
                  id="bankAcc"
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 9180293810293"
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="bankIfsc" className="block text-xs font-semibold text-foreground mb-1">
                  IFSC Code
                </label>
                <input
                  id="bankIfsc"
                  type="text"
                  required
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  placeholder="e.g. HDFC0000240"
                  className="w-full h-10 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                type="button"
                onClick={() => setShowToast(true)}
                className="bg-primary text-primary-foreground font-semibold h-11 px-6 rounded-2xl shadow-sm opacity-75 cursor-not-allowed hover:opacity-75"
              >
                Coming Soon
              </Button>
            </div>
          </form>
        </div>
      )}
      <Toast 
        isOpen={showToast} 
        onClose={() => setShowToast(false)} 
        message="Payment feature is coming soon! We're working on enabling secure online payments. Stay tuned."
      />
    </div>
  )
}
