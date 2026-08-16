import type { Variants } from "framer-motion";

/**
 * Standard page-level open-up entrance animation props
 */
export const pageTransitionProps = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" },
} as const;

/**
 * Fade-in slide-up transition props for header / text elements
 */
export const fadeInUpProps = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" },
} as const;

/**
 * Staggered container variants for lists, grids, and card collections
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

/**
 * Spring-based entrance variants for cards, list items, and tiles
 */
export const springItemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    },
  },
};

/**
 * Tab panel content transition animation variants (for AnimatePresence)
 */
export const tabContentAnimation = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;
