"use client";

import React, { useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

import { ArrowRight, Sparkles } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import "./CinematicHero.css";

/* ────────────────────────────────────────────────────────────────
   SVG Clothing Silhouettes — inline, no external assets required.
   Paths are simplified artful outlines inspired by haute couture.
   ──────────────────────────────────────────────────────────────── */

/** Floor-length gown silhouette */
const GownSVG = () => (
  <svg viewBox="0 0 120 280" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M60 0 C52 0 46 6 46 14 L46 28 C36 32 28 40 24 52 L8 110 C4 122 2 134 2 146 L2 270 C2 274 6 278 10 278 L110 278 C114 278 118 274 118 270 L118 146 C118 134 116 122 112 110 L96 52 C92 40 84 32 74 28 L74 14 C74 6 68 0 60 0 Z M60 6 C65 6 68 10 68 14 L68 26 C65 25 62 25 60 25 C58 25 55 25 52 26 L52 14 C52 10 55 6 60 6 Z M60 31 C66 31 72 32 77 34 L90 50 C96 60 100 72 102 84 L108 140 L12 140 L18 84 C20 72 24 60 30 50 L43 34 C48 32 54 31 60 31 Z M8 146 L112 146 L112 272 L8 272 Z" />
  </svg>
);

/** Structured blazer silhouette */
const BlazerSVG = () => (
  <svg viewBox="0 0 130 220" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M65 0 C55 0 48 5 46 12 L30 28 L10 20 L2 80 C2 90 6 100 14 106 L14 218 L116 218 L116 106 C124 100 128 90 128 80 L120 20 L100 28 L84 12 C82 5 75 0 65 0 Z M65 6 C72 6 76 10 78 16 L94 32 L80 60 L65 48 L50 60 L36 32 L52 16 C54 10 58 6 65 6 Z M110 26 L120 30 L128 80 C128 88 125 96 119 102 L116 104 L116 112 L14 112 L14 104 L11 102 C5 96 2 88 2 80 L10 30 L20 26 L36 34 L50 66 L65 54 L80 66 L94 34 Z M16 118 L114 118 L114 212 L16 212 Z" />
  </svg>
);

/** Wide-leg trousers silhouette */
const TrousersSVG = () => (
  <svg viewBox="0 0 100 260" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M15 0 L85 0 L85 12 C85 16 82 20 78 20 L78 22 L100 260 L56 260 L50 150 L44 260 L0 260 L22 22 L22 20 C18 20 15 16 15 12 Z M21 6 L79 6 L79 12 C79 14 77 16 75 16 L25 16 C23 16 21 14 21 12 Z" />
  </svg>
);

/** Oversized coat silhouette */
const CoatSVG = () => (
  <svg viewBox="0 0 140 270" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M70 0 C60 0 52 5 50 12 L32 24 L4 14 L4 90 C4 104 12 116 24 122 L24 268 L116 268 L116 122 C128 116 136 104 136 90 L136 14 L108 24 L90 12 C88 5 80 0 70 0 Z M70 6 C77 6 82 10 84 16 L100 28 L84 56 L70 44 L56 56 L40 28 L56 16 C58 10 63 6 70 6 Z M130 20 L130 90 C130 102 123 112 112 117 L110 118 L110 262 L30 262 L30 118 L28 117 C17 112 10 102 10 90 L10 20 L32 28 L48 62 L70 50 L92 62 L108 28 Z" />
  </svg>
);

/** Flared midi skirt silhouette */
const SkirtSVG = () => (
  <svg viewBox="0 0 120 220" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M35 0 L85 0 L85 8 L98 12 L118 220 L2 220 L22 12 Z M41 6 L79 6 L92 10 L110 214 L10 214 L28 10 Z" />
  </svg>
);

/** Handbag accent silhouette */
const HandbagSVG = () => (
  <svg viewBox="0 0 100 90" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M35 18 C35 10 42 4 50 4 C58 4 65 10 65 18 L80 18 C88 18 94 24 94 32 L94 80 C94 84 91 88 87 88 L13 88 C9 88 6 84 6 80 L6 32 C6 24 12 18 20 18 Z M50 10 C45 10 41 14 41 18 L59 18 C59 14 55 10 50 10 Z M12 24 L12 82 L88 82 L88 24 Z" />
  </svg>
);

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
    relative inline-flex items-center gap-2.5 font-sans font-semibold
    tracking-wide text-sm rounded-full select-none
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
    transition-shadow duration-200
  `;

  const variants = {
    primary: `
      h-13 px-8 py-4
      bg-foreground text-background
      shadow-[0_2px_20px_rgba(0,0,0,0.12)]
      hover:shadow-[0_6px_32px_rgba(0,0,0,0.22)]
      active:shadow-[0_1px_8px_rgba(0,0,0,0.10)]
    `,
    ghost: `
      h-13 px-8 py-4
      bg-transparent text-foreground
      border border-foreground/20
      hover:border-foreground/40
      hover:bg-foreground/5
    `,
  };

  return (
    <motion.a
      ref={btnRef}
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={reducedMotion ? {} : { scale: 0.97 }}
      className={`${base} ${variants[variant]} ${className}`}
      aria-disabled={disabled}
    >
      {children}
    </motion.a>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────────── */
export function CinematicHero() {
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  /* Mouse parallax — tracked at section level */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring followers
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 22, mass: 1 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 22, mass: 1 });

  // Parallax offsets at different depths
  const raysX    = useTransform(smoothX, [-1, 1], ["-12px", "12px"]);
  const raysY    = useTransform(smoothY, [-1, 1], ["-8px",  "8px" ]);
  const ribbonsX = useTransform(smoothX, [-1, 1], ["-18px", "18px"]);
  const ribbonsY = useTransform(smoothY, [-1, 1], ["-12px", "12px"]);
  const silsX    = useTransform(smoothX, [-1, 1], ["-24px", "24px"]);
  const silsY    = useTransform(smoothY, [-1, 1], ["-16px", "16px"]);
  const headlineX = useTransform(smoothX, [-1, 1], ["-5px",  "5px" ]);
  const headlineY = useTransform(smoothY, [-1, 1], ["-3px",  "3px" ]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    // Normalise to [-1, 1]
    const nx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    const ny = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
    mouseX.set(nx);
    mouseY.set(ny);
  }, [reducedMotion, mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  /* Entrance variants */
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.12,
        delayChildren:   reducedMotion ? 0 : 0.3,
      },
    },
  };

  const itemVariants = {
    hidden:   { opacity: 0, y: reducedMotion ? 0 : 32, filter: "blur(4px)" },
    visible:  {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  };

  const badgeVariants = {
    hidden:  { opacity: 0, scale: 0.85 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        delay: reducedMotion ? 0 : 0.15,
      },
    },
  };

  const ctaVariants = {
    hidden:  { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        delay: reducedMotion ? 0 : 0.65,
      },
    },
  };

  const dividerVariants = {
    hidden:  { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        delay: reducedMotion ? 0 : 0.9,
      },
    },
  };

  /* Mote positions (stable, no Math.random() during render) */
  const motes = [
    { w: 3,  h: 3,  top: "18%", left: "22%",  delay: 0,    dur: 14 },
    { w: 2,  h: 2,  top: "42%", left: "78%",  delay: 3,    dur: 18 },
    { w: 4,  h: 4,  top: "65%", left: "45%",  delay: 1.5,  dur: 12 },
    { w: 2,  h: 2,  top: "30%", left: "62%",  delay: 4,    dur: 20 },
    { w: 3,  h: 3,  top: "75%", left: "15%",  delay: 2,    dur: 16 },
    { w: 2,  h: 2,  top: "55%", left: "88%",  delay: 5,    dur: 22 },
    { w: 3,  h: 3,  top: "12%", left: "55%",  delay: 0.5,  dur: 15 },
    { w: 2,  h: 2,  top: "85%", left: "70%",  delay: 6,    dur: 19 },
  ];

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: "calc(100svh - 4rem)" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Hero section"
    >
      {/* ── Layer 1: Light Rays (deepest) ─────────────────── */}
      <motion.div
        className="ch-rays"
        style={reducedMotion ? {} : { x: raysX, y: raysY }}
        aria-hidden="true"
      >
        <div className="ch-ray ch-ray--halo" />
        <div className="ch-ray ch-ray--1" />
        <div className="ch-ray ch-ray--2" />
        <div className="ch-ray ch-ray--3" />
        <div className="ch-ray ch-ray--4" />
        <div className="ch-ray ch-ray--5" />
        <div className="ch-ray ch-ray--6" />
        <div className="ch-ray ch-ray--7" />
        <div className="ch-ray ch-ray--8" />
        <div className="ch-ray ch-ray--9" />
      </motion.div>

      {/* ── Layer 2: Clothing Silhouettes ─────────────────── */}
      <motion.div
        className="ch-silhouettes"
        style={reducedMotion ? {} : { x: silsX, y: silsY }}
        aria-hidden="true"
      >
        <div className="ch-silhouette ch-silhouette--a text-foreground">
          <GownSVG />
        </div>
        <div className="ch-silhouette ch-silhouette--b text-foreground">
          <BlazerSVG />
        </div>
        <div className="ch-silhouette ch-silhouette--c text-foreground">
          <TrousersSVG />
        </div>
        <div className="ch-silhouette ch-silhouette--d text-foreground">
          <CoatSVG />
        </div>
        <div className="ch-silhouette ch-silhouette--e text-foreground">
          <SkirtSVG />
        </div>
        <div className="ch-silhouette ch-silhouette--f text-foreground">
          <HandbagSVG />
        </div>
      </motion.div>

      {/* ── Layer 3: Fabric Ribbons ────────────────────────── */}
      <motion.div
        className="ch-ribbons"
        style={reducedMotion ? {} : { x: ribbonsX, y: ribbonsY }}
        aria-hidden="true"
      >
        <div className="ch-ribbon ch-ribbon--a" />
        <div className="ch-ribbon ch-ribbon--b" />
        <div className="ch-ribbon ch-ribbon--c" />
        <div className="ch-ribbon ch-ribbon--d" />
        <div className="ch-ribbon ch-ribbon--e" />
        <div className="ch-ribbon ch-ribbon--f" />
      </motion.div>

      {/* ── Layer 4: Floating Dust Motes ──────────────────── */}
      {!reducedMotion && (
        <div className="ch-motes" aria-hidden="true">
          {motes.map((m, i) => (
            <motion.div
              key={i}
              className="ch-mote"
              style={{
                width:  m.w,
                height: m.h,
                top:    m.top,
                left:   m.left,
              }}
              animate={{ y: [0, -20, 0], opacity: [0, 0.5, 0] }}
              transition={{
                duration:   m.dur,
                delay:      m.delay,
                repeat:     Infinity,
                ease:       "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Layer 5: Hero Content (top) ────────────────────── */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 text-center"
        style={reducedMotion ? {} : { x: headlineX, y: headlineY }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Eyebrow badge */}
        <motion.div variants={badgeVariants} className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-sans font-semibold tracking-[0.18em] uppercase border border-foreground/10 bg-foreground/5 text-foreground/70 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" />
            Next-Gen Custom Tailor
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="font-serif font-bold leading-[1.03] tracking-tight text-foreground mb-6"
          style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
        >
          See It.{" "}
          <em className="not-italic text-primary">Stitch It.</em>
          <br className="hidden sm:block" />
          Wear It.
        </motion.h1>

        {/* Horizontal rule — styled luxury line */}
        <motion.div
          variants={dividerVariants}
          className="flex items-center justify-center gap-4 mb-8 origin-center"
          aria-hidden="true"
        >
          <span className="block h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-foreground/15" />
          <span className="block w-1.5 h-1.5 rounded-full bg-primary/60" />
          <span className="block h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-foreground/15" />
        </motion.div>

        {/* Sub-headline */}
        <motion.p
          variants={itemVariants}
          className="font-sans text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Upload any outfit image, receive instant AI analysis, then connect
          with elite verified tailors who craft your perfect garment — delivered
          to your door.
        </motion.p>

        {/* CTA row */}
        <motion.div
          variants={ctaVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <MagneticButton href="/dashboard" variant="primary">
            Start Designing
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </MagneticButton>

          <MagneticButton href="/explore" variant="ghost">
            Browse Tailors
          </MagneticButton>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          variants={itemVariants}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] font-sans font-medium tracking-widest uppercase text-muted-foreground/50"
        >
          {["AI-Powered", "Verified Tailors", "Secure Payments", "Perfect Fit Guarantee"].map((tag) => (
            <span key={tag} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary/40 inline-block" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
