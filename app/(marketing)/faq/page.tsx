"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { duration, easing } from "@/lib/motion"
import { ChevronDown, HelpCircle } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { fadeInUp, reducedFadeInUp } from "@/lib/variants"

interface FaqItem {
  q: string
  a: string
}

interface FaqSection {
  category: string
  items: FaqItem[]
}

const faqSections: FaqSection[] = [
  {
    category: "For Customers",
    items: [
      {
        q: "How does Threadify work?",
        a: "Upload an inspiration image of a garment you'd like replicated or customized. Our AI analyzes the fabric, cut, and details. Verified tailors then review your request and submit competitive quotes. You compare quotes, choose a tailor, and pay securely via escrow. Track your order through production and only release funds when you confirm delivery.",
      },
      {
        q: "Is my payment held securely?",
        a: "Yes. All customer payments are held in a secure Razorpay escrow account and are only disbursed to the tailor after you personally confirm delivery and satisfaction. If there is a dispute, our admin team mediates the resolution.",
      },
      {
        q: "What happens if I'm not satisfied with the garment?",
        a: "You can report an issue directly from your order details page. Our team reviews disputes and can facilitate alterations or partial refunds based on our Refund Policy. We encourage direct communication with your tailor first, as most issues are resolved quickly.",
      },
      {
        q: "How long does it typically take to receive my order?",
        a: "Delivery time depends on the tailor you choose and the complexity of the garment. Each tailor quotes an estimated delivery window in their quote. Most custom orders are completed within 7–21 days. You can track every stage from pattern drafting to final pressing.",
      },
      {
        q: "Can I save a design idea without submitting it?",
        a: "Absolutely. Use the 'Save as Draft' button in the Custom Design to save your inspiration image, tags, and notes to your Wishlist. You can revisit and finalize your request at any time.",
      },
    ],
  },
  {
    category: "For Tailors",
    items: [
      {
        q: "How do I join the Threadify tailor network?",
        a: "Visit the Tailor Application page and submit your professional bio, portfolio photos, and a verification document (certificate, license, or business registration). Our curation team reviews applications within 48 hours and notifies you via email.",
      },
      {
        q: "How and when do I receive payments?",
        a: "Payments are routed via Razorpay Route to your linked bank account. Funds are released from escrow once the customer confirms delivery of the finished garment. You'll receive the agreed quote price minus the Threadify service fee.",
      },
      {
        q: "What is the service fee for tailors?",
        a: "Threadify charges a competitive commission on each completed order. Exact rates are shared during the application approval process and displayed in your workspace settings. The Professional plan subscription (₹999/month) grants access to priority leads.",
      },
      {
        q: "Can I communicate with the customer before starting production?",
        a: "Yes. Once a customer selects your quotation, an integrated workspace chat opens on both sides. You can discuss fabric choices, sizing adjustments, and share progress photos directly.",
      },
    ],
  },
  {
    category: "Payments & Policies",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit/debit cards, UPI, net banking, and wallets via Razorpay. All transactions are encrypted and PCI-DSS compliant.",
      },
      {
        q: "Can I cancel an order after paying?",
        a: "Cancellations are subject to our Refund Policy. If production has not yet started, a full refund is typically issued within 5–7 business days. Once tailoring has begun, a partial refund may apply based on work completed. See our Refund Policy for full details.",
      },
    ],
  },
]

function AccordionItem({ q, a, id }: FaqItem & { id: string }) {
  const [open, setOpen] = React.useState(false)
  const shouldReduceMotion = usePrefersReducedMotion()

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        id={`faq-btn-${id}`}
        aria-expanded={open}
        aria-controls={`faq-content-${id}`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span className="pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-content-${id}`}
            role="region"
            aria-labelledby={`faq-btn-${id}`}
            initial={shouldReduceMotion ? false : { y: -4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? {} : { y: -4, opacity: 0 }}
            transition={{ duration: duration.base, ease: easing.easeOut }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqPage() {
  const shouldReduceMotion = usePrefersReducedMotion()
  const fadeUp = shouldReduceMotion ? reducedFadeInUp : fadeInUp
  let itemIdx = 0

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

      <main id="main-content" className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center mb-14 space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <HelpCircle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Everything you need to know about Threadify, orders, and tailor partnerships.
          </p>
        </motion.div>

        <div className="space-y-12">
          {faqSections.map((section) => (
            <section key={section.category} aria-labelledby={`faq-section-${section.category.replace(/\s+/g, "-")}`}>
              <h2
                id={`faq-section-${section.category.replace(/\s+/g, "-")}`}
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4"
              >
                {section.category}
              </h2>
              <div className="space-y-3">
                {section.items.map((item) => {
                  const id = String(++itemIdx)
                  return <AccordionItem key={item.q} {...item} id={id} />
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 text-center p-8 bg-card border border-border rounded-3xl space-y-4">
          <p className="font-serif text-lg font-bold text-foreground">Still have questions?</p>
          <p className="text-sm text-muted-foreground">Our team is happy to help — reach out anytime.</p>
          <Link href="/contact" className="inline-block">
            <button className="h-11 px-6 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-sm text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Contact Support
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
