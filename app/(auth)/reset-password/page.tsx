"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { AlertCircle, Lock, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

function ResetPasswordForm() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(true)
  const [hasRecoverySession, setHasRecoverySession] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Check if recovery session or active user exists
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setHasRecoverySession(true)
        }
      } catch (err) {
        console.error("Error checking session:", err)
      } finally {
        setIsVerifying(false)
      }
    }

    // Also listen for auth state changes (e.g. PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(true)
        setIsVerifying(false)
      }
    })

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!password || !confirmPassword) {
      setErrorMsg("Please enter and confirm your new password.")
      return
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setErrorMsg(error.message || "Failed to update password. Link may have expired.")
        setIsLoading(false)
        return
      }

      setSuccessMsg("Your password has been successfully updated! Redirecting to login...")
      setIsLoading(false)

      setTimeout(() => {
        router.push("/login")
      }, 2500)
    } catch {
      setErrorMsg("An unexpected error occurred. Please try requesting a new reset link.")
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Verifying password reset link...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Visual Accent Gradients matching landing/auth pages */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-radial from-rust/30 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-radial from-terracotta/30 to-transparent blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center">
          <a href="/" className="font-serif text-3xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
            Threadify
          </a>
          <h2 className="mt-6 text-2xl font-serif font-bold text-foreground">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below to secure your account.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card py-8 px-4 border border-border shadow-md rounded-3xl sm:px-10"
        >
          {!hasRecoverySession && !successMsg ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Invalid or Expired Link</p>
                  <p className="mt-1 text-xs opacity-90">
                    This password reset link is invalid or has expired. Please request a new password reset email.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-95 shadow transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </a>
              </div>
            </div>
          ) : successMsg ? (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>

              <a
                href="/login"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-95 shadow transition-colors"
              >
                Go to Sign In Now
              </a>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              {errorMsg && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-border rounded-xl bg-background text-foreground shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    placeholder="Min. 6 characters"
                  />
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-border rounded-xl bg-background text-foreground shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    placeholder="Re-enter password"
                  />
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 h-11 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-95 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordForm />
    </React.Suspense>
  )
}
