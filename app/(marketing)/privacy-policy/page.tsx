// LEGAL REVIEW REQUIRED — This is placeholder text only.
// Have qualified legal counsel review and replace all sections before launching this page publicly.
import Link from "next/link"
import { ThemeToggle } from "@/components/shared/theme-toggle"

export const metadata = {
  title: "Privacy Policy — Threadify",
  description: "How Threadify collects, uses, and protects your personal information.",
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3" aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <h2
        id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className="font-serif text-xl font-bold text-foreground pt-6 border-t border-border"
      >
        {title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
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
          <h1 className="font-serif text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026 &nbsp;·&nbsp; Effective immediately upon publication.</p>
          {/* LEGAL REVIEW REQUIRED before launch */}
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-semibold">
            ⚠️ Placeholder text — pending legal review before public launch.
          </div>
        </div>

        <div className="space-y-8">
          <PolicySection title="1. Introduction">
            <p>
              Threadify (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting the privacy of all users who access our platform at threadify.in (the &ldquo;Service&rdquo;). This Privacy Policy explains what information we collect, how we use it, and the choices you have.
            </p>
            <p>
              By using Threadify, you agree to the collection and use of information described in this policy. If you do not agree, please discontinue use of the Service.
            </p>
          </PolicySection>

          <PolicySection title="2. Information We Collect">
            <p><strong className="text-foreground">Account Information:</strong> When you register, we collect your name, email address, and role (customer or tailor).</p>
            <p><strong className="text-foreground">Design Requests:</strong> Images you upload, AI-generated tags, budget ranges, notes, and deadlines are stored and shared with tailors to facilitate your order.</p>
            <p><strong className="text-foreground">Payment Information:</strong> Payment processing is handled by Razorpay. We do not store full card numbers or bank details. We store only order amounts and transaction references.</p>
            <p><strong className="text-foreground">Communications:</strong> Messages sent between customers and tailors through our chat system are stored to maintain order records.</p>
            <p><strong className="text-foreground">Usage Data:</strong> We collect anonymized usage data (pages visited, feature interactions) via Google Analytics to improve the platform.</p>
          </PolicySection>

          <PolicySection title="3. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Provide and improve the Threadify marketplace services</li>
              <li>Match customers with verified tailors</li>
              <li>Process payments and manage escrow accounts</li>
              <li>Send transactional notifications (order updates, quotations, delivery alerts)</li>
              <li>Detect and prevent fraudulent or abusive activity</li>
              <li>Comply with applicable legal obligations</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. Data Sharing">
            <p>We do not sell your personal data. We share your information only:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>With tailors, to the extent necessary to fulfill your design order</li>
              <li>With Razorpay for payment processing</li>
              <li>With Supabase as our database infrastructure provider</li>
              <li>With Google Analytics (anonymized usage statistics)</li>
              <li>When required by law or to protect our legal rights</li>
            </ul>
          </PolicySection>

          <PolicySection title="5. Data Retention">
            <p>We retain account data for the duration of your account and for up to 3 years after deletion to comply with legal obligations. Order records and reviews are retained for 5 years for dispute resolution purposes.</p>
          </PolicySection>

          <PolicySection title="6. Your Rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
            </ul>
            <p>To exercise any right, contact us at <a href="mailto:privacy@threadify.in" className="text-primary hover:underline focus-visible:ring-1 focus-visible:ring-primary rounded">privacy@threadify.in</a>.</p>
          </PolicySection>

          <PolicySection title="7. Cookies">
            <p>We use strictly necessary cookies for authentication sessions and optional analytics cookies (Google Analytics). You may control analytics cookies through your browser settings. We do not use advertising or third-party tracking cookies.</p>
          </PolicySection>

          <PolicySection title="8. Security">
            <p>We implement industry-standard security measures including HTTPS encryption, row-level security on our database, and regular access audits. However, no internet transmission is 100% secure and we cannot guarantee absolute security.</p>
          </PolicySection>

          <PolicySection title="9. Children's Privacy">
            <p>Threadify is not directed at individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a child has provided us data, contact us immediately.</p>
          </PolicySection>

          <PolicySection title="10. Contact Us">
            <p>For privacy inquiries: <a href="mailto:privacy@threadify.in" className="text-primary hover:underline">privacy@threadify.in</a></p>
            <p>Threadify Inc., Mumbai, Maharashtra — 400001, India</p>
          </PolicySection>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex gap-4 text-xs text-muted-foreground flex-wrap">
          <Link href="/terms" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Terms of Service</Link>
          <Link href="/refund-policy" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Refund Policy</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded">Contact Us</Link>
        </div>
      </main>
    </div>
  )
}
