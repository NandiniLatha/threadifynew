"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { AlertCircle, Lock, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  // Show URL error param (e.g. from OAuth callback failure) as initial error
  const urlError = searchParams.get("error")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(
    urlError === "auth-failed"
      ? "Authentication failed. Please try signing in again."
      : urlError === "oauth-denied"
      ? "Google sign-in was cancelled."
      : urlError
      ? decodeURIComponent(urlError)
      : null
  )

  const [isForgotMode, setIsForgotMode] = React.useState(false)
  const [forgotSuccessMsg, setForgotSuccessMsg] = React.useState<string | null>(null)
  const [isForgotLoading, setIsForgotLoading] = React.useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setForgotSuccessMsg(null)

    if (!email) {
      setErrorMsg("Please enter your email address to reset your password.")
      return
    }

    setIsForgotLoading(true)
    try {
      const { forgotPassword } = await import("@/services/authService")
      const result = await forgotPassword(email)
      if (!result.error) {
        setForgotSuccessMsg("Password reset email sent! Check your inbox for instructions.")
      } else {
        setErrorMsg(result.error.message || "Failed to send reset email.")
      }
    } catch {
      setErrorMsg("Failed to process password reset request.")
    } finally {
      setIsForgotLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email || !password) {
      setErrorMsg("Please enter both your email address and password.")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_credentials")) {
          setErrorMsg("That email or password doesn't match our records. Please try again.")
        } else if (error.message.includes("Email not confirmed") || error.message.includes("email_not_confirmed")) {
          setErrorMsg("Please confirm your email address before signing in. Check your inbox for a verification link.")
        } else {
          setErrorMsg(error.message)
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        let profile = null
        for (let attempt = 0; attempt < 2; attempt++) {
          const { data: p } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .single()
          if (p) { profile = p; break }
          if (attempt === 0) await new Promise(res => setTimeout(res, 800))
        }

        router.refresh()

        const role = profile?.role
        if (role === "admin") {
          setIsLoading(false)
          router.push("/admin")
        } else if (role === "tailor") {
          setIsLoading(false)
          router.push("/tailor/requests")
        } else {
          setIsLoading(false)
          const nextUrl = searchParams.get("next")
          router.push(nextUrl || "/dashboard")
        }
      }
    } catch {
      setErrorMsg("We encountered an unexpected issue. Please check your network connection and try again.")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setErrorMsg(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) {
        setErrorMsg("Could not connect with Google. Please try again or use your email.")
      }
    } catch {
      setErrorMsg("Something went wrong initializing Google sign-in.")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Visual Accent Gradients matching landing page */}
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
            {isForgotMode ? "Reset your password" : "Sign in to your account"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isForgotMode ? (
              <button
                type="button"
                onClick={() => { setIsForgotMode(false); setErrorMsg(null); setForgotSuccessMsg(null); }}
                className="font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
              >
                Back to sign in
              </button>
            ) : (
              <>
                Or{" "}
                <a href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1">
                  create a new account
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card py-8 px-4 border border-border shadow-md rounded-3xl sm:px-10"
        >
          {isForgotMode ? (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              {errorMsg && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-3">
                  <span>{forgotSuccessMsg}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-border rounded-xl bg-background text-foreground shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    placeholder="name@example.com"
                  />
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full flex justify-center py-2 h-11 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-95 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {isForgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleLogin}>
              {errorMsg && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-border rounded-xl bg-background text-foreground shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    placeholder="name@example.com"
                  />
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-border rounded-xl bg-background text-foreground shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    placeholder="••••••••"
                  />
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => { setIsForgotMode(true); setErrorMsg(null); setForgotSuccessMsg(null); }}
                    className="font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline-none"
                  >
                    Forgot password?
                  </button>
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
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center h-11 border border-border hover:bg-muted text-sm font-medium rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  )
}
