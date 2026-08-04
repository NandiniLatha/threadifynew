"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import {
  Upload,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TailorApply() {
  const router = useRouter()
  const supabase = createClient()

  // States
  const [bio, setBio] = React.useState("")
  const [portfolioBase64, setPortfolioBase64] = React.useState<string[]>([])
  const [docBase64, setDocBase64] = React.useState<string | null>(null)
  const [docName, setDocName] = React.useState("")
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [onboardingSuccess, setOnboardingSuccess] = React.useState(false)

  // Previous Work image picker
  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPortfolioBase64((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  // Verification document picker
  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setDocName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocBase64(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Onboard Submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)

    if (!bio.trim()) {
      setStatusMsg({ type: "error", text: "Please share a brief professional biography first." })
      return
    }

    if (!docBase64) {
      setStatusMsg({ type: "error", text: "Please upload a verification document to prove your identity/credentials." })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatusMsg({ type: "error", text: "We couldn't authenticate your session. Please sign in again." })
        setIsSubmitting(false)
        return
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("tailor_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single()

      if (existingProfile) {
        setStatusMsg({ type: "error", text: "An application has already been submitted for this account." })
        setIsSubmitting(false)
        return
      }

      // Save to tailor_profiles
      const { error } = await supabase.from("tailor_profiles").insert({
        user_id: user.id,
        bio: bio,
        verification_status: "pending",
        verification_docs_url: docBase64 || "", // In production, upload to bucket/Cloudinary
        portfolio_images: portfolioBase64,
        stripe_account_id: `acct_mock_${Math.random().toString(36).substring(7)}`,
        avg_rating: 5.00,
      })

      if (error) {
        setStatusMsg({ type: "error", text: error.message })
      } else {
        setOnboardingSuccess(true)
      }
    } catch {
      setStatusMsg({ type: "error", text: "An unexpected error occurred. Please check your network and try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (onboardingSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-radial from-rust/30 to-transparent blur-3xl" />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Application Received</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Thank you for applying to the Threadify Master Tailor Network! Our curation team will review your credentials and verify your portfolio. We will notify you via email shortly.
          </p>
          <div className="pt-4">
            <Button onClick={() => router.push("/tailor/requests")} className="bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-xl">
              Go to Workspace
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-radial from-rust/30 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-radial from-terracotta/30 to-transparent blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="text-center">
          <span className="font-serif text-2xl font-bold text-foreground">Threadify</span>
          <h1 className="mt-4 text-3xl font-serif font-bold text-foreground">Apply to Tailor Network</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your profile to unlock custom design leads and client matching.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border shadow-md rounded-3xl py-8 px-6 sm:px-10 space-y-6"
        >
          {statusMsg && (
            <div
              className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-6">
            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-foreground mb-1">
                Tell us about your tailoring expertise
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Share your specialty (e.g. suits, gowns, embroidery), experience level, and studio location.
              </p>
              <textarea
                id="bio"
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="I have over 10 years of experience in bespoke suiting and bridal wear..."
                rows={4}
                className="w-full p-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              />
            </div>

            {/* Previous Work Grid Upload */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Previous Work Work (Optional)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload photos of outfits you have tailored or sketched.
              </p>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {portfolioBase64.map((src, idx) => (
                  <div key={idx} className="relative aspect-square border border-border rounded-xl overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Previous Work preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPortfolioBase64(portfolioBase64.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {portfolioBase64.length < 8 && (
                  <label className="aspect-square border border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                    <input type="file" accept="image/*" multiple onChange={handlePortfolioChange} className="hidden" />
                    <ImageIcon className="w-5 h-5 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground font-semibold">Upload</span>
                  </label>
                )}
              </div>
            </div>

            {/* Document Verification */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">
                Verification Document
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload a certificate, license, ID, or business registration to help verify your identity.
              </p>
              <div className="border border-border rounded-2xl p-4 bg-background">
                {docName ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-foreground font-semibold">
                      <FileCheck className="w-5 h-5 text-primary" />
                      <span className="truncate max-w-[200px]">{docName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDocName("")
                        setDocBase64(null)
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center p-4 border border-dashed border-border rounded-xl cursor-pointer hover:bg-muted transition-colors">
                    <input type="file" onChange={handleDocChange} className="hidden" />
                    <Upload className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className="text-xs font-semibold text-muted-foreground">Choose Document</span>
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between">
              <a href="/tailor/requests" className="text-xs font-semibold text-muted-foreground hover:underline">
                Skip for now
              </a>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl h-11 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
