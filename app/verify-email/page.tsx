"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function VerifyEmailPage() {
  const supabase = createClient()
  const [email, setEmail] = React.useState("")
  const [isResending, setIsResending] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email)
      }
    })
  }, [supabase])

  const handleResend = async () => {
    if (!email) {
      setErrorMsg("Please sign in or enter your email address to resend confirmation.")
      return
    }

    setIsResending(true)
    setMessage(null)
    setErrorMsg(null)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setMessage("Verification email has been resent! Please check your inbox.")
      }
    } catch {
      setErrorMsg("Failed to resend verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-radial from-rust/30 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-radial from-terracotta/30 to-transparent blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center">
          <Link href="/" className="font-serif text-3xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
            Threadify
          </Link>
          <div className="mt-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">
            Verify your email address
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
            We sent a verification link to{" "}
            <span className="font-semibold text-foreground">{email || "your email address"}</span>. Please check your inbox to activate your account.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card py-8 px-4 border border-border shadow-md rounded-3xl sm:px-10 text-center space-y-6"
        >
          {message && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              onClick={handleResend}
              disabled={isResending}
              className="w-full flex justify-center py-2 h-11 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-95 shadow"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resending Email...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>

            <Link href="/login" className="block w-full">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center h-11 border border-border hover:bg-muted text-sm font-medium rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
