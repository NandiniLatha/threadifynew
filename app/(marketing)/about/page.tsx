"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { viewportOnce } from "@/lib/variants"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import {
  ArrowRight,
  Menu,
  X,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/shared/Footer"
import { duration, easing } from "@/lib/motion"

export default function AboutPage() {
  const shouldReduceMotion = usePrefersReducedMotion()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Motion variants that respect prefers-reduced-motion
  const fadeIn = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, ease: easing.easeOut },
    },
  }



  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* 1. Sticky Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors duration-300">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
              Threadify
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1">How It Works</a>
            <a href="/#explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1">Browse Tailors</a>
            <a href="/about" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1">About Us</a>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <a href="/login" className="text-sm font-medium hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1">
              Login
            </a>
            <Button asChild className="font-medium bg-primary text-primary-foreground hover:opacity-90 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <a href="/dashboard">Start Designing</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-8 overflow-hidden bg-background">
        <div className="container mx-auto max-w-4xl text-center z-10 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wider uppercase">
              Our Vision
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Custom fashion, finally within reach
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Threadify was created to make personalized clothing a standard choice, not a rare luxury. By merging AI design tools with traditional craftsmanship, we connect consumers directly with vetted tailors.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 3. Founder Story Section */}
      <section className="py-20 px-4 md:px-8 bg-muted/30 border-y border-border/40 relative">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeIn}
            className="bg-background p-8 md:p-12 rounded-3xl border border-border shadow-sm space-y-8"
          >
            <div className="flex items-center space-x-4">
              {/* Initials Avatar Placeholder */}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-serif font-bold shrink-0">
                NN
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">Nandini Latha Nallamotu, Founder</h3>
              </div>
            </div>

            <blockquote className="font-sans text-base md:text-lg text-foreground/80 leading-relaxed italic border-l-4 border-primary pl-4 md:pl-6">
              &ldquo;I started Threadify after noticing a common problem in the fashion industry: people often save outfits they love from Pinterest, Instagram, or other platforms but struggle to find or buy the exact design. Even when similar options are available, they may be too expensive, unavailable, or not fit well. At the same time, many talented local tailors and boutiques have limited online visibility and rely on traditional methods to reach customers. Threadify aims to bridge this gap by creating a platform where users can upload fashion inspiration, customize their designs, and connect with skilled tailors who can bring those ideas to life.&rdquo;
            </blockquote>

            <div className="text-right text-xs tracking-widest text-muted-foreground uppercase">
              &mdash; Founder Story
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Our Mission Section */}
      <section className="py-24 px-4 md:px-8 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground">Our Mission</h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              We are on a mission to make custom fashion more accessible, affordable, and convenient while empowering local tailoring businesses through technology.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Closing CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-muted/20 border-t border-border/40">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeIn}
            className="space-y-6"
          >
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground">
              Ready to create your perfect fit?
            </h2>
            <p className="max-w-xl mx-auto text-muted-foreground">
              Whether you are looking to design your dream outfit or join our network of certified tailors, we are here to support you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild className="h-12 px-8 text-base bg-primary text-primary-foreground hover:opacity-90 shadow-md transition-all duration-200">
                <a href="/dashboard">Start Designing <ArrowRight className="w-4 h-4 ml-2 inline" /></a>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto h-12 px-8 text-base border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Become a Tailor Partner
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Footer */}
      <Footer />
    </div>
  )
}
