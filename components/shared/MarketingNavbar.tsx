"use client"

import * as React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { duration, easing } from "@/lib/motion"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"

const navLinks = [
  { name: "How It Works", href: "#how-it-works" },
  { name: "Browse Tailors", href: "#explore" },
  { name: "Features", href: "#features" },
  { name: "About Us", href: "/about" },
  { name: "Customer Reviews", href: "#testimonials" },
]

export function MarketingNavbar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("")

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
      
      // Simple scroll spy logic
      const sections = navLinks.map(link => link.href.replace('#', '')).filter(id => id && !id.includes('/'))
      let current = ""
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element && window.scrollY >= (element.offsetTop - 100)) {
          current = section
        }
      }
      if (current) {
        setActiveSection(`#${current}`)
      } else if (window.location.pathname === '/about') {
         setActiveSection('/about')
      }
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <motion.header 
        initial={{ backgroundColor: "rgba(var(--background), 0)", borderBottomColor: "rgba(var(--border), 0)" }}
        animate={{ 
          backgroundColor: isScrolled ? "rgba(var(--background), 0.8)" : "rgba(var(--background), 0)",
          borderBottomColor: isScrolled ? "rgba(var(--border), 0.4)" : "rgba(var(--border), 0)",
          boxShadow: isScrolled ? "0 4px 20px -2px rgba(0, 0, 0, 0.05)" : "0 0 0 0 rgba(0,0,0,0)"
        }}
        transition={{ duration: duration.base, ease: easing.smooth }}
        className="fixed top-0 z-50 w-full backdrop-blur-md"
      >
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
            <motion.div
              animate={{ scale: isScrolled ? 0.9 : 1 }}
              transition={{ duration: duration.base, ...easing.spring }}
              className="origin-left"
            >
              <Image
                src="/brand/threadify-logo.svg"
                alt="Threadify — Your Style, Our Stitch"
                width={180}
                height={45}
                priority
                className="h-9 w-auto dark:invert"
              />
            </motion.div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href
              return (
                <motion.a 
                  key={link.name}
                  href={link.href}
                  whileHover={{ y: -2 }}
                  transition={{ duration: duration.fast }}
                  className={`relative text-sm font-medium transition-colors px-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveSection(link.href)}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary rounded-full"
                      initial={false}
                      transition={{ duration: duration.base, ...easing.spring }}
                    />
                  )}
                </motion.a>
              )
            })}
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
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: duration.fast, ease: easing.easeOut }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden border-b border-border bg-background shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                >
                  {link.name}
                </a>
              ))}
              <hr className="border-border" />
              <div className="flex flex-col space-y-3 pt-2">
                <a
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center font-medium py-2 rounded border border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Login
                </a>
                <Button
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-primary text-primary-foreground font-medium py-3 rounded"
                >
                  <a href="/dashboard">Start Designing</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
