"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { fadeInUp, reducedFadeInUp } from "@/lib/variants"

const WHATSAPP_NUMBER = "+919876543210"
const WHATSAPP_DISPLAY = "+91 98765 43210"
const CONTACT_EMAIL = "hello@threadify.in"

export default function ContactPage() {
  const shouldReduceMotion = usePrefersReducedMotion()
  const fadeUp = shouldReduceMotion ? reducedFadeInUp : fadeInUp

  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setStatusMsg({ type: "success", text: data.message })
        setForm({ name: "", email: "", subject: "", message: "" })
      } else {
        setStatusMsg({ type: "error", text: data.error || "Something went wrong. Please try again." })
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error. Please check your connection." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold text-foreground hover:text-primary transition-colors">
            Threadify
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1">Login</Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        {/* Title */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center mb-16 space-y-3"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">Get in Touch</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Questions about orders, tailoring partnerships, or anything else? We&apos;re here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <motion.aside
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="lg:col-span-2 space-y-6"
            aria-label="Contact information"
          >
            <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-foreground">Contact Details</h2>

              <div className="space-y-4 text-sm">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Email</p>
                    <span className="font-semibold text-foreground">{CONTACT_EMAIL}</span>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=Hi%20Threadify%2C%20I%20have%20a%20question`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  <span className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">WhatsApp</p>
                    <span className="font-semibold text-foreground">{WHATSAPP_DISPLAY}</span>
                  </div>
                </a>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Office</p>
                    <span className="font-semibold text-foreground text-xs leading-snug">Threadify HQ<br />Mumbai, Maharashtra — 400001</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium">Business Hours</p>
                <p className="text-sm text-foreground font-semibold mt-1">Mon – Sat: 9:00 AM – 7:00 PM IST</p>
                <p className="text-xs text-muted-foreground mt-0.5">We respond to all emails within 24 hours.</p>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=Hi%20Threadify%2C%20I%20have%20a%20question`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                Chat on WhatsApp
              </a>
            </div>
          </motion.aside>

          {/* Contact Form */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="lg:col-span-3"
            aria-label="Send us a message"
          >
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-foreground mb-6">Send a Message</h2>

              {statusMsg && (
                <div
                  role="alert"
                  className={`mb-6 p-4 rounded-2xl border text-sm flex items-start gap-3 ${
                    statusMsg.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  {statusMsg.type === "success" ? (
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-foreground mb-1.5">
                      Full Name <span aria-hidden="true" className="text-destructive">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-foreground mb-1.5">
                      Email Address <span aria-hidden="true" className="text-destructive">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-semibold text-foreground mb-1.5">
                    Subject <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select a topic</option>
                    <option value="Order & Delivery">Order &amp; Delivery</option>
                    <option value="Tailor Partnership">Tailor Partnership</option>
                    <option value="Payment & Refund">Payment &amp; Refund</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-foreground mb-1.5">
                    Message <span aria-hidden="true" className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help you..."
                    rows={5}
                    className="w-full p-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-sm text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  )
}
