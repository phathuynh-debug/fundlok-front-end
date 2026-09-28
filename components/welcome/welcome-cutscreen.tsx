"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useAppearance } from "@/components/appearance-provider";
import { WelcomeVisual } from "@/components/welcome/welcome-visuals";
import {
  welcomeSlideKey,
  welcomeSlidesForRole,
} from "@/lib/constants/welcome-slides";
import { supportedLocales, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SelectableRole } from "@/services/authentication.service";

/**
 * The first-run welcome: a full-screen, slide-by-slide walk through how
 * FundLok works, modelled on Apple's "hello" setup screen. It is deliberately
 * slow — arrows (buttons, keyboard or swipe) and no skip on a first run —
 * because the daily repayment mechanism is the one thing every user must
 * understand before they act.
 *
 * Always the dark brand stage (`dark brand-stage`), whatever the app theme:
 * Handbook §7.3 puts the brand on dark grounds.
 */

/** Horizontal drag, in px, that counts as a swipe to the next/previous slide. */
const SWIPE_THRESHOLD = 60;

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -48 }),
};

export function WelcomeCutscreen({
  role,
  onFinish,
  onClose,
}: {
  role: SelectableRole;
  /** The last slide's call to action. */
  onFinish: () => void;
  /**
   * Offered only on a replay. A first run has no way out but through: the
   * user asked for that, so the explanation is actually read.
   */
  onClose?: () => void;
}) {
  const { t, locale, setLocale } = useTranslations();
  const { reduceMotion } = useAppearance();
  const slides = welcomeSlidesForRole(role);

  const [[index, direction], setPosition] = useState<[number, number]>([0, 0]);
  const [furthest, setFurthest] = useState(0);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const slide = slides[index];
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;

  // Plain functions: the React Compiler memoises them.
  const goTo = (target: number) => {
    if (target < 0 || target >= slides.length) return;
    setPosition(([current]) => [target, target > current ? 1 : -1]);
    setFurthest((value) => Math.max(value, target));
  };
  const next = () => {
    if (isLast) onFinish();
    else goTo(index + 1);
  };
  const back = () => goTo(index - 1);

  // Arrow keys move between slides; Tab stays inside the cutscreen, which
  // covers the whole page and is modal. Escape closes only a replay. Handled
  // on the dialog itself: focus is always inside it (see the effect below).
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (!isLast) next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      back();
    } else if (event.key === "Escape" && onClose) {
      onClose();
    } else if (event.key === "Tab") {
      const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not([disabled])",
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  // The page behind must not scroll under a full-screen overlay.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Keep focus on the forward control as slides change, so Enter/Space keeps
  // moving and a screen reader lands on the new slide's action.
  useEffect(() => {
    const frame = requestAnimationFrame(() => primaryRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [index]);

  if (!slide) return null;

  const base = welcomeSlideKey(role, slide.id);
  // Not every slide has a body (the greeting, the list slides): `t` returns
  // the key itself for a missing entry.
  const body = t(`${base}.body`);
  const titleId = `welcome-${slide.id}-title`;
  const primaryLabel = isFirst
    ? t("welcome.common.getStarted")
    : isLast
      ? t("welcome.common.ready.cta")
      : t("welcome.common.next");

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="dark brand-stage fixed inset-0 z-[70] flex flex-col overflow-hidden bg-background text-foreground"
      >
        {/* Ambient light, behind everything. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-blue/10 blur-3xl" />
        </div>

        {/* Top bar: progress, and a close button on a replay only. */}
        <div className="relative z-10 flex h-14 shrink-0 items-center justify-center px-4 sm:h-16">
          <p className="sr-only" aria-live="polite">
            {t("welcome.common.progress", {
              current: index + 1,
              total: slides.length,
            })}
          </p>
          <div className="flex items-center gap-1.5">
            {slides.map((item, dot) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(dot)}
                // No skipping ahead on the dots either: only slides already
                // reached can be revisited.
                disabled={dot > furthest}
                aria-label={t("welcome.common.goToSlide", { n: dot + 1 })}
                aria-current={dot === index ? "step" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  dot === index
                    ? "w-6 bg-brand"
                    : dot <= furthest
                      ? "w-1.5 bg-foreground/50 hover:bg-foreground/80"
                      : "w-1.5 bg-foreground/20",
                )}
              />
            ))}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t("welcome.common.close")}
              className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:right-5"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* The slide. Scrolls on its own if a small phone cannot fit it, so
            nothing is ever cut off. */}
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.section
              key={slide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD && !isLast) next();
                else if (info.offset.x > SWIPE_THRESHOLD) back();
              }}
              className="mx-auto flex min-h-full w-full max-w-3xl touch-pan-y flex-col items-center justify-center gap-5 px-4 py-4 text-center sm:gap-7 sm:px-8"
            >
              <div
                className={cn(
                  "flex w-full shrink-0 items-center justify-center",
                  // The listing card is the tallest visual; list slides get
                  // less room so their bullets fit a phone screen.
                  slide.id === "disclosure"
                    ? "h-[clamp(16rem,42vh,21rem)]"
                    : slide.items
                      ? "h-[clamp(9rem,26vh,14rem)]"
                      : "h-[clamp(11rem,34vh,18rem)]",
                )}
              >
                <WelcomeVisual id={slide.id} />
              </div>

              <div className="flex w-full max-w-2xl flex-col items-center gap-3">
                <motion.h2
                  id={titleId}
                  className="text-balance text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: slide.id === "hello" ? 1 : 0.15 }}
                >
                  {t(`${base}.title`)}
                </motion.h2>
                {body !== `${base}.body` && (
                  <motion.p
                    className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    {body}
                  </motion.p>
                )}

                {slide.items && (
                  <ul className="mt-1 flex w-full flex-col gap-2 text-left">
                    {Array.from({ length: slide.items }, (_, item) => (
                      <motion.li
                        key={item}
                        className="flex gap-3 rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-sm leading-relaxed text-foreground sm:text-[15px]"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + item * 0.12 }}
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span className="min-w-0">
                          {t(`${base}.items.${item + 1}`)}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                )}

                {slide.id === "hello" && (
                  <motion.div
                    role="group"
                    aria-label={t("welcome.common.language")}
                    className="mt-2 inline-flex rounded-full border border-border bg-card p-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    {supportedLocales
                      .slice()
                      .reverse()
                      .map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setLocale(option)}
                          aria-pressed={locale === option}
                          className={cn(
                            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                            locale === option
                              ? "bg-brand text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {t(`welcome.common.languages.${option}`)}
                        </button>
                      ))}
                  </motion.div>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>

        {/* Controls. */}
        <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-8">
          <button
            type="button"
            onClick={back}
            disabled={isFirst}
            aria-label={t("welcome.common.back")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            ref={primaryRef}
            type="button"
            onClick={next}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-full bg-brand font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]",
              isFirst || isLast ? "px-7" : "w-12",
            )}
            aria-label={primaryLabel}
          >
            {(isFirst || isLast) && <span>{primaryLabel}</span>}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </MotionConfig>
  );
}
