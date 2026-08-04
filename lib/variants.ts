import { Variants } from "framer-motion";
import { easing, duration } from "./motion";

// ---- Page / Section Entry ----
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.easeOut },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easing.easeOut } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: easing.smooth } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: easing.spring },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerItem = fadeUp;

// ---- Reduced Motion Fallbacks ----
export const reducedFadeInUp: Variants = {
  hidden: { opacity: 0, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.01 } },
};

export const reducedStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0 } },
};

// ---- Interaction states ----
export const hoverLift: Variants = {
  rest: { y: 0, boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" },
  hover: {
    y: -8,
    boxShadow: "0px 16px 32px rgba(0,0,0,0.12)",
    transition: { duration: duration.fast, ease: easing.smooth },
  },
};

export const hoverScale: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.03, transition: { duration: duration.fast } },
  tap: { scale: 0.97, transition: easing.spring },
};

// ---- Modal ----
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: easing.easeIn } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: easing.spring },
  exit: { opacity: 0, scale: 0.95, y: 4, transition: { duration: duration.fast } },
};

// ---- Dropdown ----
export const dropdownVariants: Variants = {
  hidden:  { opacity: 0, y: -8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.fast, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: { duration: duration.fast, ease: easing.easeIn },
  },
};

// ---- Mobile Drawer ----
export const drawerVariants: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: { duration: duration.fast, ease: easing.easeIn },
  },
};

// ---- Accordion ----
export const accordionContent: Variants = {
  hidden:  { opacity: 0, y: -4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: easing.easeOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: duration.fast, ease: easing.easeIn },
  },
};

// ---- Shared scroll-in viewport config ----
export const viewportOnce = { once: true, amount: 0.2 };
