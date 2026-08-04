// Central animation tokens for Threadify
// Every component should import from here for base durations/easings.
// Reusable animation variants should be imported from "@/lib/variants"



export const easing = {
  smooth: [0.4, 0, 0.2, 1] as [number, number, number, number],
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeIn: [0.4, 0, 1, 1] as [number, number, number, number],
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
  softSpring: { type: "spring", stiffness: 200, damping: 25 } as const,
};

export const duration = {
  fast: 0.2,
  base: 0.4,
  slow: 0.6,
  loopFast: 1.5,
  loop: 2.5,
  ambient: 25, // for background loops (seconds)
};
