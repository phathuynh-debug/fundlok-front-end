"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/* --------------------------------------------------------------------------
 * Result reveal
 *
 * Pressing Calculate is the one moment on this page worth marking: the visitor
 * has typed nine figures and is owed a payoff. The reveal is deliberately
 * DECORATIVE ONLY — nothing here adds or emphasises copy. A band is indicative
 * and provisional, so a flourish that read as "approved" would be a compliance
 * defect (see this file's header), which is why the celebration lives in motion
 * and never in words, and why the not-an-offer line keeps its place in the
 * stagger rather than being pushed below the fold.
 * ------------------------------------------------------------------------ */

export const resultVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const resultItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

/** The two headline figures overshoot slightly on the way in — the rest of the
 *  panel only rises. */
export const figureVariants: Variants = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 15 },
  },
};

/** Precomputed so the burst is identical on every run and costs nothing to
 *  render — a random spray would also re-randomise on every React re-render. */
const BURST_PIECES = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2;
  const distance = 52 + (index % 4) * 18;
  return {
    id: index,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance * 0.7,
    delay: (index % 5) * 0.025,
  };
});

const BURST_COLORS = [
  "bg-emerald-400",
  "bg-emerald-500/70",
  "bg-amber-400/80",
] as const;

/** One-shot confetti behind the result heading. Purely decorative: aria-hidden
 *  so a screen reader never meets it, and not rendered at all for a visitor who
 *  has asked for reduced motion. */
export function ResultBurst() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-6 z-0 h-0 w-0"
    >
      {BURST_PIECES.map((piece) => (
        <motion.span
          key={piece.id}
          className={cn(
            "absolute h-1.5 w-1.5 rounded-full",
            BURST_COLORS[piece.id % BURST_COLORS.length],
          )}
          // Single-value targets, not keyframe arrays: the piece starts visible
          // at the origin and flies outward as it fades. Same shape of animation
          // the rest of this page already uses.
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 0.4, x: piece.x, y: piece.y }}
          transition={{
            duration: 1,
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * What the result panel shows while the engine is thinking.
 *
 * Shaped like the answer it is waiting for: heading, two figure blocks, the
 * not-an-offer line, the assumptions list. A spinner would tell the visitor
 * that something is happening; this tells them what is about to arrive, and
 * the panel does not change height when it does.
 *
 * `bg-muted`, not the Skeleton default: `--accent` is the emerald brand colour
 * in light mode, so the stock component pulses bright green.
 */
