"use client";

import { useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { GuillocheWaves } from "@/components/guilloche-waves";
import Mockup from "@/components/mockup";
import { useTranslations } from "@/lib/i18n";

type HeroInteractiveProps = {
  strings: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaPrimary: string;
    heroCtaSecondary: string;
    ourSolution: string;
  };
};

export function HeroInteractive({ strings }: HeroInteractiveProps) {
  const { t, localize } = useTranslations();
  // The mockup showcases a single demo portal (FundLok's own terminal).
  // "Funding", not "Lending": FundLok arranges capital; it is not the lender.
  const partner = {
    id: "terminal",
    name: "FundLok Terminal",
    category: t("mockup.categorySme"),
  };

  // 3D Perspective Tilt States
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState(50);
  const [shineY, setShineY] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotateX(-y / (rect.height / 10)); // Max 10 deg tilt
    setRotateY(x / (rect.width / 10));
    setShineX(((e.clientX - rect.left) / rect.width) * 100);
    setShineY(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setShineX(50);
    setShineY(50);
  };

  const scrollToProcess = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("process");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Symmetrical Animated Waves Canvas */}
      <GuillocheWaves activeIndex={0} />

      {/* Centered Content Wrapper (Restricted max-w-4xl width) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-between pt-2 md:pt-3 pb-2 px-4">
        {/* Animated text content wrapper.
            The title and subtitle animate on TRANSFORM ONLY — no `opacity` in
            `initial`. An `initial={{ opacity: 0 }}` is serialised into the SSR
            HTML as `style="opacity:0"`, which made the hero invisible until
            framer-motion hydrated and disqualified it as an LCP candidate; the
            browser then fell back to the 113px header logo as the largest
            paint on the page. Text that is translated still counts as painted,
            so the slide-in survives and the hero is an LCP candidate from the
            first frame. Keep it that way. */}
        <m.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center px-4 flex flex-col items-center mb-2 md:mb-3 max-w-4xl mx-auto"
        >
          <m.h1
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="font-sans text-3xl sm:text-4xl md:text-[2.5rem] font-extrabold text-foreground leading-[1.15] mb-2.5 tracking-tight max-w-4xl"
          >
            {strings.heroTitle}
          </m.h1>
          <m.p
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="font-sans text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl"
          >
            {strings.heroSubtitle}
          </m.p>
          {/* The first screen's only action used to be "Enter app" in the
              header. Sign-up is a plain <a>, like the header's: /login renders
              per request, so a client-side transition buys nothing. */}
          <m.div
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
            className="mt-4 flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href={localize("/login?mode=register")}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-5 py-2.5 text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95"
            >
              {strings.heroCtaPrimary}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              href={localize("/rate")}
              className="inline-flex items-center rounded-full border border-border bg-background/60 backdrop-blur-sm hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-400 px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 active:scale-95"
            >
              {strings.heroCtaSecondary}
            </Link>
          </m.div>
        </m.div>

        {/* Interactive Mockup. Transform-only entrance for the same reason as
            the hero text above: on a wide viewport the MacBook frame inside is
            the LCP element, and an `initial` opacity would keep it out of the
            running until hydration. */}
        <m.div
          initial={{ scale: 0.96, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: "easeOut" }}
          className="w-full flex justify-center"
        >
          <Mockup
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            rotateX={rotateX}
            rotateY={rotateY}
            shineX={shineX}
            shineY={shineY}
            activePartner={partner}
          />
        </m.div>

        {/* Bouncing Scroll Indicator Arrow */}
        <m.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.95 }}
          onClick={scrollToProcess}
          className="relative z-20 mt-2 mb-2 text-muted-foreground hover:text-accent cursor-pointer flex flex-col items-center gap-1 text-[10px] md:text-xs tracking-wider font-bold uppercase transition-colors select-none outline-none border-none bg-transparent"
        >
          <m.div
            animate={{ y: [0, 6, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center gap-0.5"
          >
            <span>{strings.ourSolution}</span>
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
          </m.div>
        </m.button>
      </div>
    </>
  );
}
