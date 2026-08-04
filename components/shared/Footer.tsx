"use client"

import * as React from "react"
import Link from "next/link"
import { Instagram, Facebook, Twitter, Mail } from "lucide-react"
import { motion } from "framer-motion"

const linkClass =
  "relative text-background/80 dark:text-muted-foreground hover:text-background dark:hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100 focus-visible:ring-1 focus-visible:ring-primary rounded"

function AmbientSparkle({ top, left, delay }: { top: string; left: string; delay: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.6)] pointer-events-none z-0"
      style={{ top, left }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: delay,
        ease: "easeInOut",
      }}
    />
  )
}

export function Footer() {
  return (
    <footer className="relative bg-foreground text-background dark:bg-card dark:text-foreground border-t border-border/10 py-16 px-4 md:px-8 overflow-hidden">
      {/* Subtle background mesh gradient for the footer */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background/10 via-transparent to-transparent dark:from-muted/5" />
      
      {/* Ambient Sparkles */}
      <AmbientSparkle top="20%" left="15%" delay={10} />
      <AmbientSparkle top="70%" left="80%" delay={14} />
      <AmbientSparkle top="40%" left="50%" delay={12} />

      <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 relative z-10">
        {/* Logo & Brand Note */}
        <div className="lg:col-span-2 space-y-6">
          <span className="font-serif text-2xl font-bold tracking-tight text-background dark:text-foreground flex items-center gap-2">
            Threadify
          </span>
          <p className="text-background/70 dark:text-muted-foreground text-sm max-w-xs leading-relaxed">
            Everyday fashion custom-made to fit you and only you. Powered by AI diagnostics and vetted master tailors.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="p-2 bg-background/10 dark:bg-muted/10 hover:bg-background/20 dark:hover:bg-muted/20 rounded-full transition-all text-background dark:text-foreground hover:scale-110" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-background/10 dark:bg-muted/10 hover:bg-background/20 dark:hover:bg-muted/20 rounded-full transition-all text-background dark:text-foreground hover:scale-110" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-background/10 dark:bg-muted/10 hover:bg-background/20 dark:hover:bg-muted/20 rounded-full transition-all text-background dark:text-foreground hover:scale-110" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Links Column 1 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-background/50 dark:text-muted-foreground/60 mb-4">Company</h4>
          <ul className="space-y-2 text-sm inline-flex flex-col items-start">
            <li><Link href="/about" className={linkClass}>About Us</Link></li>
            <li><Link href="/pricing" className={linkClass}>Pricing</Link></li>
            <li><Link href="/contact" className={linkClass}>Contact Us</Link></li>
            <li><Link href="/tailor/apply" className={linkClass}>Tailor Network</Link></li>
            <li><Link href="/faq" className={linkClass}>FAQ</Link></li>
          </ul>
        </div>

        {/* Quick Links Column 2 */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-background/50 dark:text-muted-foreground/60 mb-4">Support</h4>
          <ul className="space-y-2 text-sm inline-flex flex-col items-start">
            <li><Link href="/faq" className={linkClass}>Help Center</Link></li>
            <li><Link href="/faq" className={linkClass}>Sizing Guide</Link></li>
            <li><Link href="/refund-policy" className={linkClass}>Refund Policy</Link></li>
            <li><Link href="/faq#escrow" className={linkClass}>Secure Payment Protection</Link></li>
          </ul>
        </div>

        {/* Newsletter Signup Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-background/50 dark:text-muted-foreground/60">Newsletter</h4>
          <p className="text-xs text-background/70 dark:text-muted-foreground/80 leading-relaxed">
            Subscribe to get seasonal trend guides and curation highlights.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col space-y-2">
            <div className="relative group">
              <input
                type="email"
                placeholder="Enter email"
                required
                className="w-full h-10 px-3 pr-10 rounded border border-background/20 dark:border-border/50 bg-background/5 dark:bg-muted text-sm text-background dark:text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all group-hover:border-background/40 dark:group-hover:border-border/80"
              />
              <button type="submit" className="absolute right-2 top-2 text-background/60 dark:text-muted-foreground hover:text-background dark:hover:text-foreground transition-transform hover:scale-110" aria-label="Subscribe">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl mt-12 pt-8 border-t border-background/10 dark:border-border/10 flex flex-col md:flex-row items-center justify-between text-xs text-background/60 dark:text-muted-foreground relative z-10">
        <span>&copy; {new Date().getFullYear()} Threadify Inc. All rights reserved.</span>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link href="/terms" className={linkClass}>Terms of Service</Link>
          <Link href="/privacy-policy" className={linkClass}>Privacy Policy</Link>
          <Link href="/refund-policy" className={linkClass}>Refund Policy</Link>
        </div>
      </div>
    </footer>
  )
}
