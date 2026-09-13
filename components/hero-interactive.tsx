"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { GuillocheWaves } from "@/components/guilloche-waves";
import Mockup from "@/components/mockup";

type HeroInteractiveProps = {
  strings: {
    heroTitle: string;
    heroSubtitle: string;
    ourSolution: string;
  };
};

// The mockup showcases a single demo portal (FundLok's own terminal).
const partner = {
  id: "terminal",
  name: "FundLok Terminal",
  category: "SME Lending",
};

export function HeroInteractive({ strings }: HeroInteractiveProps) {
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
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-between pt-10 pb-4 px-4">
        {/* Animated text content wrapper.
            The title and subtitle animate on TRANSFORM ONLY — no `opacity` in
            `initial`. An `initial={{ opacity: 0 }}` is serialised into the SSR
            HTML as `style="opacity:0"`, which made the hero invisible until
            framer-motion hydrated and disqualified it as an LCP candidate; the
            browser then fell back to the 113px header logo as the largest
            paint on the page. Text that is translated still counts as painted,
            so the slide-in survives and the hero is an LCP candidate from the
            first frame. Keep it that way. */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center px-4 flex flex-col items-center mb-6 max-w-3xl mx-auto"
        >
          <motion.h1
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="font-sans text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.15] mb-4 tracking-tight"
          >
            {strings.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="font-sans text-xs md:text-sm text-muted-foreground/85 leading-relaxed max-w-2xl"
          >
            {strings.heroSubtitle}
          </motion.p>
        </motion.div>

        {/* Interactive Mockup. Transform-only entrance for the same reason as
            the hero text above: on a wide viewport the MacBook frame inside is
            the LCP element, and an `initial` opacity would keep it out of the
            running until hydration. */}
        <motion.div
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
        </motion.div>

        {/* Bouncing Scroll Indicator Arrow */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.95 }}
          onClick={scrollToProcess}
          className="relative z-20 mt-2 mb-2 text-muted-foreground/60 hover:text-accent cursor-pointer flex flex-col items-center gap-0.5 text-[9px] font-mono tracking-widest font-bold uppercase transition-colors select-none outline-none border-none bg-transparent"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center gap-0.5"
          >
            <span>{strings.ourSolution}</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
