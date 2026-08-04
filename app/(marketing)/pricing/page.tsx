"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { Check, Sparkles, Scissors, Building2 } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { fadeInUp, staggerContainer, reducedFadeInUp, reducedStaggerContainer, viewportOnce } from "@/lib/variants"

const plans = [
  {
    name: "Customer",
    badge: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for individuals looking to bring their fashion ideas to life.",
    icon: Sparkles,
    iconBg: "bg-primary/10 text-primary",
    cta: "Start Designing",
    ctaHref: "/login",
    ctaVariant: "outline" as const,
    features: [
      "Upload unlimited inspiration images",
      "AI-powered garment analysis",
      "Receive quotes from verified tailors",
      "Secure escrow payments",
      "Real-time order tracking",
      "Direct messaging with tailors",
      "Star rating & review system",
      "Wishlist & draft saving",
    ],
  },
  {
    name: "Professional Tailor",
    badge: "Most Popular",
    price: "₹999",
    period: "per month",
    description: "For master tailors who want consistent design leads and premium visibility.",
    icon: Scissors,
    iconBg: "bg-primary text-primary-foreground",
    cta: "Apply to Network",
    ctaHref: "/tailor/apply",
    ctaVariant: "default" as const,
    highlighted: true,
    features: [
      "Access to all open design requests",
      "Submit unlimited quote quotations",
      "Featured profile placement",
      "Previous Work showcase (up to 50 images)",
      "Priority customer matching",
      "Razorpay Route payouts",
      "Order management workspace",
      "Dedicated support channel",
    ],
  },
  {
    name: "Enterprise",
    badge: "Custom",
    price: "Custom",
    period: "contact us",
    description: "For boutiques, fashion houses, and tailoring studios with multiple artisans.",
    icon: Building2,
    iconBg: "bg-thread-green/10 text-thread-green",
    cta: "Contact Sales",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    features: [
      "Unlimited tailor accounts",
      "White-label options available",
      "Custom API integrations",
      "Dedicated account manager",
      "Volume pricing on escrow",
      "Analytics & reporting dashboard",
      "Team management tools",
      "SLA-backed support",
    ],
  },
]

export default function PricingPage() {
  const shouldReduceMotion = usePrefersReducedMotion()
  const fadeUp = shouldReduceMotion ? reducedFadeInUp : fadeInUp
  const stagger = shouldReduceMotion ? reducedStaggerContainer : staggerContainer

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
            <Button asChild className="bg-primary text-primary-foreground font-medium"><a href="/dashboard">Start Designing</a></Button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="py-24 px-4 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="space-y-4 max-w-2xl mx-auto"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Simple Pricing
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground">Transparent Plans,<br />No Hidden Fees</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Customers pay only when they place orders. Tailors subscribe for access to a steady stream of high-quality leads.
            </p>
          </motion.div>
        </section>

        {/* Plans */}
        <section className="pb-24 px-4 md:px-8">
          <motion.div
            className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {plans.map((plan) => {
              const Icon = plan.icon
              return (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  className={`rounded-3xl border p-8 flex flex-col gap-6 transition-shadow hover:shadow-lg ${
                    plan.highlighted
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Plan header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        plan.highlighted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                    <h2 className="font-serif text-xl font-bold text-foreground">{plan.name}</h2>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-foreground font-serif">{plan.price}</span>
                      <span className="text-xs text-muted-foreground mb-1">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  </div>

                  {/* CTA */}
                  <Link href={plan.ctaHref} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                    <Button
                      variant={plan.ctaVariant}
                      className={`w-full h-11 rounded-2xl font-semibold text-sm ${
                        plan.highlighted
                          ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                          : "border-border"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  {/* Features */}
                  <ul className="space-y-3" aria-label={`${plan.name} features`}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </motion.div>
        </section>

        {/* FAQ teaser */}
        <section className="pb-24 px-4 text-center border-t border-border/40 pt-16">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Still have questions?</h2>
          <p className="text-muted-foreground text-sm mb-6">Check our FAQ or reach out to the team directly.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/faq">
              <Button variant="outline" className="border-border font-semibold h-10 rounded-2xl">Read the FAQ</Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-primary text-primary-foreground font-semibold h-10 rounded-2xl shadow-sm">Contact Us</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
