// <!-- LEGAL REVIEW REQUIRED — Placeholder text. Have qualified legal counsel review before launch. -->
import Link from "next/link"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export const metadata = {
  title: "Refund Policy — Threadify",
  description: "How refunds, cancellations, and disputes are handled on Threadify.",
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3" aria-labelledby={`section-${title.toLowerCase().replace(/[\s.]+/g, "-")}`}>
      <h2
        id={`section-${title.toLowerCase().replace(/[\s.]+/g, "-")}`}
        className="font-serif text-xl font-bold text-foreground pt-6 border-t border-border"
      >
        {title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold text-foreground hover:text-primary transition-colors">
            Threadify
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="container mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-2 mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Legal</p>
          <h1 className="font-serif text-4xl font-bold text-foreground">Refund Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026 &nbsp;·&nbsp; Effective immediately upon publication.</p>
          {/* LEGAL REVIEW REQUIRED before launch */}
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-semibold">
            ⚠️ Placeholder text — pending legal review before public launch.
          </div>
        </div>

        <div className="space-y-8">
          <PolicySection title="1. Overview">
            <p>
              Threadify operates an escrow-based payment model. Your payment is held securely and only released to the tailor after you confirm receipt and satisfaction with the garment. This structure is designed to protect customers throughout the production process.
            </p>
          </PolicySection>

          <PolicySection title="2. Cancellations Before Production">
            <p>
              If you wish to cancel an order <strong className="text-foreground">before the tailor has commenced production</strong> (typically within 24 hours of payment), you are eligible for a full refund of the order amount. Threadify service fees may be non-refundable.
            </p>
            <p>
              To request a pre-production cancellation, contact our support team via the in-app dispute system or at <a href="mailto:support@threadify.in" className="text-primary hover:underline">support@threadify.in</a> immediately.
            </p>
          </PolicySection>

          <PolicySection title="3. Cancellations During Production">
            <p>
              Once a tailor has commenced cutting, stitching, or drafting work on your garment, a <strong className="text-foreground">partial refund</strong> may apply based on the percentage of work completed, as determined by our admin team in consultation with both parties.
            </p>
            <p>
              Refund amounts during production are issued at Threadify&apos;s discretion and will be communicated within 5 business days of a dispute being raised.
            </p>
          </PolicySection>

          <PolicySection title="4. Quality & Fit Issues">
            <p>
              If the delivered garment does not materially match the agreed specifications (fabric, design, measurements), you may:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Request up to <strong className="text-foreground">one free alteration round</strong> from the tailor within 7 days of delivery</li>
              <li>Raise a formal dispute via the platform if the issue is unresolved</li>
            </ul>
            <p>
              Disputes are reviewed by our admin team within 3–5 business days. Resolutions may include a partial refund, alteration facilitation, or escrow hold extension.
            </p>
          </PolicySection>

          <PolicySection title="5. Secure Payment Release">
            <p>
              Secure Payment funds are released to the tailor only after you click <strong className="text-foreground">Confirm Delivery</strong> in your order details page. Do not confirm delivery until you are satisfied. Once released, refunds are not possible.
            </p>
            <p>
              If you do not confirm delivery within <strong className="text-foreground">14 days</strong> of the tailor marking the order as shipped, and no dispute has been raised, escrow may be automatically released to the tailor.
            </p>
          </PolicySection>

          <PolicySection title="6. Non-Refundable Items">
            <p>The following are non-refundable:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Threadify platform service fees</li>
              <li>Orders cancelled after delivery confirmation</li>
              <li>Professional Tailor subscription fees (monthly)</li>
              <li>Custom fabric sourcing costs where fabric has already been purchased</li>
            </ul>
          </PolicySection>

          <PolicySection title="7. Refund Processing">
            <p>
              Approved refunds are processed back to the original payment method within <strong className="text-foreground">5–10 business days</strong> depending on your bank or card issuer. Razorpay may take additional processing time.
            </p>
          </PolicySection>

          <PolicySection title="8. Disputes">
            <p>
              To raise a dispute, use the <em>Report an Issue</em> button on your order details page, or contact us at <a href="mailto:disputes@threadify.in" className="text-primary hover:underline focus-visible:ring-1 focus-visible:ring-primary rounded">disputes@threadify.in</a> with your order ID and a description of the issue.
            </p>
          </PolicySection>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex gap-4 text-xs text-muted-foreground flex-wrap">
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Terms of Service</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Contact Us</Link>
        </div>
      </main>
    </div>
  )
}
