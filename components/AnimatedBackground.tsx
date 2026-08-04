"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useLuxuryParallax } from "@/hooks/useLuxuryParallax";
import "./AnimatedBackground.css";

interface AnimatedBackgroundProps {
  /** Soft animated gradient mesh (beige/ivory/champagne nodes) */
  mesh?: boolean;
  /** Secondary animated colour-shift mesh layer */
  meshShift?: boolean;
  /** Slow fabric-like SVG waves */
  waves?: boolean;
  /** Large blurred floating blobs */
  blobs?: boolean;
  /** Tiny glowing particles floating upward */
  particles?: boolean;
  /** Number of standard dot particles (default 18) */
  particleCount?: number;
  /** Number of glow particles (default 8) */
  glowParticleCount?: number;
  /** Soft diagonal light-reflection streaks */
  sheens?: boolean;
  /** Film-grain noise texture */
  noise?: boolean;
  /** Scroll-driven parallax on supported layers */
  parallax?: boolean;
  /** Subtle floating fashion elements (spools, buttons, etc) */
  fashionElements?: boolean;
  /**
   * Fixed-position: sticks to the viewport even when scrolling.
   * Use `true` for the global root background.
   */
  fixed?: boolean;
}

/**
 * Premium ambient background layer for Threadify.
 *
 * Renders entirely behind page content (z-index: -1 when fixed).
 * Uses only CSS transforms & opacity for smooth 60 FPS GPU compositing.
 * Respects `prefers-reduced-motion` — layers are visible but static.
 *
 * Toggle individual layers via props. All default to `true` so the
 * GlobalAnimatedBackground gets the full effect out of the box.
 */
export function AnimatedBackground({
  mesh = true,
  meshShift = true,
  waves = true,
  blobs = true,
  particles = true,
  particleCount = 18,
  glowParticleCount = 8,
  sheens = true,
  noise = true,
  parallax = true,
  fashionElements = true,
  fixed = false,
}: AnimatedBackgroundProps) {
  const reducedMotion = usePrefersReducedMotion();

  // Attach rAF-based scroll listener that writes --tf-scroll-y to :root
  useLuxuryParallax(parallax && !reducedMotion);

  // SVG Definitions for floating fashion elements
  const ButtonSVG = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="9.5" cy="9.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="9.5" r="1" fill="currentColor" />
      <circle cx="9.5" cy="14.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="14.5" r="1" fill="currentColor" />
    </svg>
  );

  const NeedleSVG = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 3L3 21" strokeLinecap="round" />
      <path d="M19.5 4.5L16.5 7.5" strokeWidth="1" />
      <ellipse cx="20" cy="4" rx="2" ry="1" transform="rotate(-45 20 4)" />
    </svg>
  );

  const HangerSVG = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C10.8954 2 10 2.89543 10 4C10 5.10457 10.8954 6 12 6C13.1046 6 14 6.89543 14 8C14 9.10457 13.1046 10 12 10L2 18V20H22V18L12 10" />
    </svg>
  );

  const SpoolSVG = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4H18M6 20H18M8 4V20M16 4V20M8 8H16M8 12H16M8 16H16" />
    </svg>
  );

  const TapeSVG = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10C3 10 7 6 12 10C17 14 21 10 21 10M3 14C3 14 7 10 12 14C17 18 21 14 21 14" />
      <path d="M5 9V11M9 11V13M13 11V13M17 13V15" strokeWidth="1" />
    </svg>
  );

  const FabricSVG = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3H21L19 12L21 21H3L5 12L3 3Z" />
    </svg>
  );

  const PatternSVG = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 3">
      <path d="M7 3H17L20 10L16 21H8L4 10L7 3Z" />
    </svg>
  );

  const fashionIcons = [ButtonSVG, NeedleSVG, HangerSVG, SpoolSVG, TapeSVG, FabricSVG, PatternSVG];

  const containerClass = [
    "tf-bg",
    fixed ? "tf-bg--fixed" : "",
    reducedMotion ? "tf-bg--reduced" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass} aria-hidden="true" role="presentation">

      {/* ── Layer 1: Gradient Mesh ───────────────────────── */}
      {mesh && (
        <div className="tf-bg__mesh">
          <div className="tf-bg__mesh-inner" />
        </div>
      )}

      {meshShift && (
        <div className="tf-bg__mesh-shift" />
      )}

      {/* ── Layer 2: Fabric Waves ────────────────────────── */}
      {waves && (
        <svg
          className="tf-bg__waves"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Wave 1 — gentle upper swell */}
          <path
            className="tf-bg__wave tf-bg__wave--1"
            d="M-100,280
               C200,220 450,340 700,280
               C950,220 1200,310 1540,260
               L1540,900 L-100,900 Z"
          />

          {/* Wave 2 — mid-page drape */}
          <path
            className="tf-bg__wave tf-bg__wave--2"
            d="M-100,420
               C180,370 380,490 620,430
               C860,370 1100,460 1340,400
               C1420,380 1490,410 1540,420
               L1540,900 L-100,900 Z"
          />

          {/* Wave 3 — deep lower fabric */}
          <path
            className="tf-bg__wave tf-bg__wave--3"
            d="M-100,580
               C150,540 350,620 580,570
               C810,520 1060,600 1280,555
               C1380,535 1480,560 1540,570
               L1540,900 L-100,900 Z"
          />
        </svg>
      )}

      {/* ── Layer 3: Blurred Floating Blobs ─────────────── */}
      {blobs && (
        <div className="tf-bg__blobs">
          <div className="tf-bg__blob tf-bg__blob--a" />
          <div className="tf-bg__blob tf-bg__blob--b" />
          <div className="tf-bg__blob tf-bg__blob--c" />
          <div className="tf-bg__blob tf-bg__blob--d" />
        </div>
      )}

      {/* ── Layer 4: Glowing Particles ──────────────────── */}
      {particles && !reducedMotion && (
        <div className="tf-bg__particles">
          {/* Standard dot particles */}
          {Array.from({ length: particleCount }).map((_, i) => (
            <span
              key={`dot-${i}`}
              className="tf-bg__particle tf-bg__particle--dot"
              style={{
                bottom: `${(i % 5) * 4}%`,
                left: `${((i * 53 + 7) % 97)}%`,
                animationDelay: `${(i * 1.7) % 14}s`,
                animationDuration: `${10 + (i % 7) * 1.5}s`,
                width: `${1.5 + (i % 3) * 0.5}px`,
                height: `${1.5 + (i % 3) * 0.5}px`,
              }}
            />
          ))}

          {/* Larger glow particles */}
          {Array.from({ length: glowParticleCount }).map((_, i) => (
            <span
              key={`glow-${i}`}
              className="tf-bg__particle tf-bg__particle--glow"
              style={{
                bottom: `${(i % 3) * 6}%`,
                left: `${((i * 79 + 13) % 93)}%`,
                animationDelay: `${(i * 2.3 + 3) % 18}s`,
                animationDuration: `${13 + (i % 5) * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Layer 5: Light Reflections / Sheens ─────────── */}
      {sheens && (
        <div className="tf-bg__sheens">
          <div className="tf-bg__sheen tf-bg__sheen--a" />
          <div className="tf-bg__sheen tf-bg__sheen--b" />
          <div className="tf-bg__sheen tf-bg__sheen--c" />
        </div>
      )}

      {/* ── Layer 6: Floating Fashion Elements ────────────── */}
      {fashionElements && !reducedMotion && (
        <div className="tf-bg__fashion">
          {Array.from({ length: 14 }).map((_, i) => {
            const Icon = fashionIcons[i % fashionIcons.length];
            return (
              <div
                key={`fashion-${i}`}
                className="tf-bg__fashion-item"
                style={{
                  top: `${(i * 17) % 85 + 5}%`,
                  left: `${(i * 23) % 90 + 5}%`,
                  animationDelay: `${(i * 1.5) % 20}s`,
                  animationDuration: `${25 + (i % 15)}s`,
                  transform: `scale(${0.6 + (i % 3) * 0.2}) rotate(${(i * 45) % 360}deg)`,
                }}
              >
                <Icon />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Layer 7: Film Grain Noise ────────────────────── */}
      {noise && <div className="tf-bg__noise" />}

    </div>
  );
}
