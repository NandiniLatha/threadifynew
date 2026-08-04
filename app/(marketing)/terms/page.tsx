// <!-- LEGAL REVIEW REQUIRED — Placeholder text. Have qualified legal counsel review before launch. -->
import Link from "next/link"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export const metadata = {
  title: "Terms of Service — Threadify",
  description: "The terms and conditions governing your use of Threadify.",
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

export default function TermsPage() {
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
          <h1 className="font-serif text-4xl font-bold text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026 &nbsp;·&nbsp; Effective immediately upon publication.</p>
          {/* LEGAL REVIEW REQUIRED before launch */}
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-semibold">
            ⚠️ Placeholder text — pending legal review before public launch.
          </div>
        </div>

        <div className="space-y-8">
          <PolicySection title="1. Acceptance of Terms">
            <p>
              By accessing or using Threadify (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you must not access or use the Service.
            </p>
            <p>
              We reserve the right to update these Terms at any time. Continued use following notification of changes constitutes acceptance of the revised Terms.
            </p>
          </PolicySection>

          <PolicySection title="2. Description of Service">
            <p>
              Threadify is an online marketplace that connects customers seeking custom-tailored garments with verified professional tailors. Threadify acts as an intermediary platform and is not itself a tailoring service provider.
            </p>
            <p>
              We provide: AI garment analysis tools, a bidding/quotation marketplace, escrow payment processing, order tracking, and customer–tailor communication tools.
            </p>
          </PolicySection>

          <PolicySection title="3. Account Registration">
            <p>You must be at least 18 years of age to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</p>
            <p>You agree to provide accurate, current, and complete information during registration. Threadify reserves the right to suspend or terminate accounts providing false information.</p>
          </PolicySection>

          <PolicySection title="4. Customer Obligations">
            <p>Customers agree to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Provide accurate measurements, preferences, and design specifications</li>
              <li>Upload only images they own or have rights to use</li>
              <li>Not submit misleading, offensive, or unlawful content</li>
              <li>Confirm delivery accurately and in good faith</li>
              <li>Pay agreed amounts in full via the platform</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. Tailor Obligations">
            <p>Verified tailors agree to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Accurately represent their skills, portfolio, and capabilities</li>
              <li>Complete orders to the standard described in their quotation</li>
              <li>Communicate proactively through the workspace chat</li>
              <li>Deliver garments within the quoted timeframe</li>
              <li>Not engage in off-platform transactions with customers met through Threadify</li>
            </ul>
          </PolicySection>

          <PolicySection title="6. Payments and Secure Payment">
            <p>
              All payments are processed through Razorpay and held in escrow until the customer confirms delivery. Threadify charges a service fee deducted from the tailor&apos;s payout upon release. Fees are disclosed to tailors during onboarding.
            </p>
            <p>
              Customers must not dispute payments in bad faith. Fraudulent chargebacks may result in account termination and legal action.
            </p>
          </PolicySection>

          <PolicySection title="7. Prohibited Conduct">
            <p>Users must not:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Harass, threaten, or abuse other users</li>
              <li>Attempt to circumvent escrow by paying tailors directly after initial contact via Threadify</li>
              <li>Upload copyrighted images without permission</li>
              <li>Use the platform for any unlawful purpose</li>
              <li>Introduce malware or interfere with platform integrity</li>
            </ul>
          </PolicySection>

          <PolicySection title="8. Intellectual Property">
            <p>
              Threadify and its content (logos, design, text, software) are the intellectual property of Threadify Inc. You may not reproduce, distribute, or create derivative works without written permission.
            </p>
            <p>
              Images you upload remain your property, but you grant Threadify a non-exclusive licence to display them within the platform for order Order Completion purposes.
            </p>
          </PolicySection>

          <PolicySection title="9. Limitation of Liability">
            <p>
              Threadify is a marketplace platform. We are not liable for the quality of garments produced by tailors, disputes between users, delays caused by third parties, or losses arising from your use of the Service beyond the amount paid in the relevant transaction.
            </p>
          </PolicySection>

          <PolicySection title="10. Governing Law">
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra.
            </p>
          </PolicySection>

          <PolicySection title="11. Contact">
            <p>For questions regarding these Terms: <a href="mailto:legal@threadify.in" className="text-primary hover:underline focus-visible:ring-1 focus-visible:ring-primary rounded">legal@threadify.in</a></p>
          </PolicySection>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex gap-4 text-xs text-muted-foreground flex-wrap">
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Privacy Policy</Link>
          <Link href="/refund-policy" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Refund Policy</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Contact Us</Link>
        </div>
      </main>
    </div>
  )
}
