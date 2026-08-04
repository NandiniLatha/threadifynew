import { useEffect } from "react";

/**
 * Attaches a scroll-driven parallax effect to the document root via CSS
 * custom properties. Layers read `--tf-scroll-y` to shift at different rates.
 *
 * Uses `requestAnimationFrame` for 60 FPS, `will-change: transform` on layers,
 * and respects `prefers-reduced-motion` by returning early.
 */
export function useLuxuryParallax(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    // Bail immediately if the user prefers reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let raf = 0;
    let lastY = 0;

    const onScroll = () => {
      lastY = window.scrollY;
    };

    const tick = () => {
      document.documentElement.style.setProperty(
        "--tf-scroll-y",
        String(lastY)
      );
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);

    const handleMQChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        document.documentElement.style.removeProperty("--tf-scroll-y");
      }
    };

    mq.addEventListener("change", handleMQChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", handleMQChange);
      document.documentElement.style.removeProperty("--tf-scroll-y");
    };
  }, [enabled]);
}
