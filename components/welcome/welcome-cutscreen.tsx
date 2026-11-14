"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, m } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import {
  loadMotionFeatures,
  useAppearance,
} from "@/components/appearance-provider";
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
 * FundLok works, modelled on Apple's "hello" setup screen. It moves one slide
 * at a time — arrows (buttons, keyboard or swipe) — because the daily
 * repayment mechanism is the one thing every user must understand before they
 * act, but it can always be skipped, first run included.
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
  /** The close button and Escape: skips the rest of the cutscreen. */
  onClose: () => void;
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

  // Arrow keys move between slides and Escape closes. Listened
  // for on the document, not the dialog: focus only moves inside one frame
  // after mount (see the effect below), and a key pressed before then landed
  // on <body> and was lost. The cutscreen covers the page and is modal, so
  // every key on the page is meant for it.
  const onDocumentKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (!isLast) next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      back();
    } else if (event.key === "Escape") {
      onClose();
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onDocumentKeyDown(event);
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);

  // Tab stays inside the cutscreen. Handled on the dialog: it is about where
  // focus goes next, so it only matters once focus is inside.
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") {
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

  // The animation features load lazily (AppearanceProvider's LazyMotion).
  // A slide change that lands in the same render as their arrival leaves the
  // outgoing slide's exit unstarted: framer-motion only starts an exit when it
  // sees the slide go from present to absent, and a feature attached mid-exit
  // never sees that. AnimatePresence (mode="wait") then waits on it for good,
  // and the next slide never mounts. Remounting AnimatePresence once the
  // features are in drops any such slide; every slide after that mounts with
  // them. LazyMotion subscribed to this promise first, so they are registered
  // by the time this runs.
  const [motionReady, setMotionReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    void loadMotionFeatures().then(() => {
      if (mounted) setMotionReady(true);
    });
    return () => {
      mounted = false;
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
  // An optional small print line under the bullets (e.g. "returns are
  // targets, not guarantees").
  const note = t(`${base}.note`);
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

        {/* Top bar: progress, and a close button. */}
        <div className="relative z-10 flex h-14 shrink-0 items-center justify-center px-4 sm:h-16">
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
                  "h-1.5 rounded-full transition-[width,background-color] duration-300",
                  dot === index
                    ? "w-6 bg-brand"
                    : dot <= furthest
                      ? "w-1.5 bg-foreground/50 hover:bg-foreground/80"
                      : "w-1.5 bg-foreground/20",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("welcome.common.close")}
            className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:right-5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* The slide, with its controls right under it, centred together.
            The slide scrolls on its own if a small phone cannot fit it, so
            nothing is cut off and the controls stay in view. */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center">
          <div className="min-h-0 overflow-y-auto overflow-x-hidden">
            <AnimatePresence
              key={motionReady ? "animated" : "loading"}
              mode="wait"
              custom={direction}
              initial={false}
            >
              <m.section
                key={slide.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: EASE_OUT }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -SWIPE_THRESHOLD && !isLast) next();
                  else if (info.offset.x > SWIPE_THRESHOLD) back();
                }}
                className="mx-auto flex w-full max-w-3xl touch-pan-y flex-col items-center justify-center gap-5 px-4 py-4 text-center sm:gap-7 sm:px-8"
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
                  <m.h2
                    id={titleId}
                    className="text-balance text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: slide.id === "hello" ? 1 : 0.15 }}
                  >
                    {t(`${base}.title`)}
                  </m.h2>
                  {body !== `${base}.body` && (
                    <m.p
                      className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      {body}
                    </m.p>
                  )}

                  {slide.items && (
                    <ul className="mt-1 flex w-full flex-col gap-2 text-left">
                      {Array.from({ length: slide.items }, (_, item) => (
                        <m.li
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
                        </m.li>
                      ))}
                    </ul>
                  )}

                  {note !== `${base}.note` && (
                    <m.p
                      className="text-xs text-muted-foreground sm:text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      {note}
                    </m.p>
                  )}

                  {slide.id === "hello" && (
                    <m.div
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
                    </m.div>
                  )}
                </div>
              </m.section>
            </AnimatePresence>
          </div>

          {/* Controls, centred under the slide: a labelled forward pill that
            fills up as the walkthrough progresses, with Back beside it. On a
            phone the pill takes the width beside Back (the longest label,
            "Vào bảng điều khiển", needs it); from `sm` a grid keeps it dead
            centre whether or not Back is shown. */}
          <div className="flex shrink-0 flex-col items-center gap-2.5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pb-8 sm:pt-6">
            <div className="flex w-full max-w-sm items-center gap-3 sm:grid sm:w-auto sm:max-w-none sm:grid-cols-[3.5rem_auto_3.5rem]">
              <button
                type="button"
                onClick={back}
                disabled={isFirst}
                aria-label={t("welcome.common.back")}
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-0",
                  // On a phone the first slide drops Back so the pill
                  // spans the row; from `sm` it keeps its grid cell.
                  isFirst && "max-sm:hidden",
                )}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <button
                ref={primaryRef}
                type="button"
                onClick={next}
                aria-label={primaryLabel}
                className="group relative flex h-14 min-w-0 flex-1 items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap rounded-full bg-brand px-5 text-base font-semibold text-primary-foreground shadow-lg shadow-brand/25 transition-transform hover:scale-[1.03] active:scale-[0.98] sm:min-w-[14rem] sm:flex-none sm:px-8 sm:text-lg"
              >
                {/* How far through the walkthrough: fills left to right. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-500 ease-out"
                  style={{ width: `${((index + 1) / slides.length) * 100}%` }}
                />
                <span className="relative">{primaryLabel}</span>
                {/* A gentle nudge on the first slide says "this way"; on hover
                  the arrow leans forward. */}
                <m.span
                  aria-hidden="true"
                  className="relative flex"
                  animate={isFirst ? { x: [0, 5, 0] } : { x: 0 }}
                  transition={
                    isFirst
                      ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.2 }
                  }
                >
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </m.span>
              </button>

              {/* Mirrors Back so the pill stays centred (from `sm`). */}
              <span aria-hidden="true" className="hidden sm:block" />
            </div>

            <p
              aria-live="polite"
              className="text-xs tabular-nums text-muted-foreground sm:text-sm"
            >
              {t("welcome.common.progress", {
                current: index + 1,
                total: slides.length,
              })}
            </p>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
