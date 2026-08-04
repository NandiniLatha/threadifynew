"use client";

import React, { useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

/**
 * Mounts the premium luxury background globally.
 * Deferred to client-side only (after first paint) so it never
 * blocks server rendering or LCP.
 */
export function GlobalAnimatedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatedBackground
      fixed
      mesh
      meshShift
      waves
      blobs
      particles
      particleCount={22}
      glowParticleCount={10}
      sheens
      noise
      parallax
    />
  );
}
