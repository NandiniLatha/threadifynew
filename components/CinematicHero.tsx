"use client";

import React, { useCallback, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { ArrowRight, Sparkles, Scissors, ShieldCheck, CheckCircle2 } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useMouseTilt } from "@/hooks/useMouseTilt";
import "./CinematicHero.css";

/* ────────────────────────────────────────────────────────────────
   MagneticButton — CTA that subtly chases the cursor
   ──────────────────────────────────────────────────────────────── */
interface MagneticButtonProps {
  href: string;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

function MagneticButton({ href, variant = "primary", children, className = "", disabled }: MagneticButtonProps) {
  const btnRef = useRef<HTMLAnchorElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 200, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 200, damping: 18, mass: 0.6 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reducedMotion || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.28;
    const dy = (e.clientY - cy) * 0.28;
    x.set(dx);
    y.set(dy);
  }, [reducedMotion, x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const base = `
    relative inline-flex items-center justify-center gap-2.5 font-sans font-medium
    tracking-wide text-sm rounded-2xl select-none transition-all duration-300
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-background
  `;

  const variants = {
    primary: `
      h-13 px-8 py-3.5
      bg-primary text-primary-foreground
      shadow-[0_4px_24px_rgba(196,112,75,0.25)]
      hover:shadow-[0_8px_32px_rgba(196,112,75,0.4)]
      hover:bg-primary/95
    `,
    ghost: `
      h-13 px-8 py-3.5
      bg-card/60 backdrop-blur-md text-foreground
      border border-border/50
      hover:border-terracotta/50 hover:bg-card/90
      shadow-sm
    `,
  };

  return (
    <motion.a
      ref={btnRef}
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      className={`${base} ${variants[variant]} ${className}`}
      aria-disabled={disabled}
    >
      {children}
    </motion.a>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main Editorial Hero Component
   ──────────────────────────────────────────────────────────────── */
export function CinematicHero() {
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  /* Mouse Tilt hook for the central editorial card */
  const {
    rotateX,
    rotateY,
    glowX,
    glowY,
    handleMouseMove: handleCardMouseMove,
    handleMouseLeave: handleCardMouseLeave,
  } = useMouseTilt(cardRef, { maxRotateX: 6, maxRotateY: 6 });

  const spotlightBg = useMotionTemplate`radial-gradient(500px circle at ${glowX}px ${glowY}px, rgba(196, 112, 75, 0.15), transparent 60%)`;

  /* Mote positions (stable, no Math.random() during render) */
  const motes = [
    { w: 3, h: 3, top: "18%", left: "15%", delay: 0, dur: 14 },
    { w: 2, h: 2, top: "35%", left: "85%", delay: 2, dur: 18 },
    { w: 4, h: 4, top: "65%", left: "10%", delay: 1, dur: 16 },
    { w: 2, h: 2, top: "80%", left: "90%", delay: 3, dur: 20 },
  ];

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 md:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 z-10"
      aria-label="Threadify Bespoke Tailoring Hero"
    >
      {/* ── Ambient Background Layer: Light Rays ─────────────────── */}
      <div className="ch-rays" aria-hidden="true">
        <div className="ch-ray ch-ray--halo" />
        <div className="ch-ray ch-ray--2" />
        <div className="ch-ray ch-ray--4" />
        <div className="ch-ray ch-ray--5" />
        <div className="ch-ray ch-ray--6" />
        <div className="ch-ray ch-ray--8" />
      </div>

      {/* ── Ambient Background Layer: Drifting Ribbons ─────────── */}
      <div className="ch-ribbons" aria-hidden="true">
        <div className="ch-ribbon ch-ribbon--a" />
        <div className="ch-ribbon ch-ribbon--b" />
      </div>

      {/* ── Ambient Floating Particles ─────────────────────────── */}
      {!reducedMotion && (
        <div className="ch-motes" aria-hidden="true">
          {motes.map((m, i) => (
            <motion.div
              key={i}
              className="ch-mote"
              style={{
                width: m.w,
                height: m.h,
                top: m.top,
                left: m.left,
              }}
              animate={{ y: [0, -25, 0], opacity: [0, 0.6, 0] }}
              transition={{
                duration: m.dur,
                delay: m.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* ── 2-Column Luxury Editorial Layout ────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Narrative & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            {/* Flanked Eyebrow Badge */}
            <div className="inline-flex items-center gap-2.5 mb-6">
              <span className="h-px w-6 bg-terracotta/40" />
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-terracotta">
                BESPOKE COUTURE & AI ATELIER
              </span>
              <span className="h-px w-6 bg-terracotta/40" />
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-medium tracking-tight text-foreground leading-[1.08] mb-6">
              See It.{" "}
              <span className="italic font-normal text-terracotta">Stitch It.</span>
              <br />
              Wear It.
            </h1>

            {/* Editorial Rule */}
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6 w-full max-w-md">
              <span className="block h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-terracotta/30" />
              <span className="block w-1.5 h-1.5 rounded-full bg-terracotta" />
              <span className="block h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-terracotta/30" />
            </div>

            {/* Sub-headline */}
            <p className="font-sans text-base sm:text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-xl mb-9">
              Upload any outfit inspiration, receive instant AI garment analysis, and collaborate with verified master tailors to craft your custom fit — delivered directly to your doorstep.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12">
              <MagneticButton href="/dashboard" variant="primary" className="w-full sm:w-auto">
                <Sparkles className="w-4 h-4 mr-1 text-primary-foreground/90" aria-hidden="true" />
                <span>Start Designing</span>
                <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </MagneticButton>

              <MagneticButton href="/explore" variant="ghost" className="w-full sm:w-auto">
                <span>Browse Master Tailors</span>
              </MagneticButton>
            </div>

            {/* Trust Chips */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-xs text-muted-foreground font-light">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-terracotta" />
                <span>AI Vision Breakdown</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-terracotta" />
                <span>Verified Master Artisans</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-terracotta" />
                <span>Escrow Protected</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-terracotta" />
                <span>100% Fit Guarantee</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Editorial Visual Showcase Centerpiece */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center relative"
          >
            <motion.div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                rotateX: reducedMotion ? 0 : rotateX,
                rotateY: reducedMotion ? 0 : rotateY,
                transformStyle: "preserve-3d",
              }}
              className="relative w-full max-w-[380px] sm:max-w-[420px] lg:max-w-none aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-border/50 bg-card/40 backdrop-blur-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] group"
            >
              {/* Spotlight overlay */}
              {!reducedMotion && (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: spotlightBg }}
                />
              )}

              {/* Primary Editorial Image */}
              <Image
                src="/images/hero-editorial.png"
                alt="Threadify Bespoke Tailoring Editorial Showcase"
                fill
                priority
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 420px, 520px"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />

              {/* Editorial Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none z-10" />

              {/* Floating Glass Badge 1: AI Recognition (Top Right) */}
              <div
                style={{ transform: "translateZ(30px)" }}
                className="absolute top-5 right-5 z-20 px-3.5 py-2 rounded-xl bg-background/85 backdrop-blur-md border border-border/50 shadow-lg flex items-center gap-2.5 text-xs text-foreground"
              >
                <div className="w-6 h-6 rounded-lg bg-terracotta/15 text-terracotta flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-serif font-medium text-xs">AI Scan</span>
                  <span className="text-[10px] text-muted-foreground font-light">Garment Architecture</span>
                </div>
              </div>

              {/* Floating Glass Badge 2: Master Tailor Craft (Bottom Left) */}
              <div
                style={{ transform: "translateZ(35px)" }}
                className="absolute bottom-6 left-6 right-6 z-20 p-4 rounded-2xl bg-background/90 backdrop-blur-xl border border-border/60 shadow-xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-terracotta text-primary-foreground flex items-center justify-center flex-shrink-0 shadow-md">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-serif font-medium text-sm text-foreground">Verified Master Tailors</h4>
                    <p className="text-[11px] text-muted-foreground font-light">Custom drafted to your measurements</p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-semibold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full">
                  100% Bespoke
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

