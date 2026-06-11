"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { GuillocheWaves } from "@/components/guilloche-waves";
import Mockup from "@/components/mockup";

// Symmetrical custom vector logos
const FasanaraLogo = () => (
  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0">
    <svg
      className="w-7 h-7 animate-pulse"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="24"
        cy="24"
        r="12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="3 3"
      />
      <circle cx="24" cy="24" r="5" fill="currentColor" />
    </svg>
  </div>
);

const FalconLogo = () => (
  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0">
    <svg
      className="w-7 h-7"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 14L24 28L38 14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 24L24 38L38 24"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.4"
      />
    </svg>
  </div>
);

const BastionLogo = () => (
  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0">
    <svg
      className="w-7 h-7"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
      <circle cx="32" cy="16" r="3.5" fill="currentColor" fillOpacity="0.5" />
      <circle cx="16" cy="32" r="3.5" fill="currentColor" fillOpacity="0.5" />
      <circle cx="32" cy="32" r="3.5" fill="currentColor" />
      <path d="M20 16H28" stroke="currentColor" strokeWidth="2" />
      <path d="M16 20V28" stroke="currentColor" strokeWidth="2" />
      <path d="M32 20V28" stroke="currentColor" strokeWidth="2" />
      <path d="M20 32H28" stroke="currentColor" strokeWidth="2" />
    </svg>
  </div>
);

type HeroInteractiveProps = {
  strings: {
    heroTitle: string;
    heroSubtitle: string;
    ourSolution: string;
    variableRate: string;
    fixedRate: string;
    weekly: string;
    daily: string;
    monthly: string;
    hidden: string;
  };
};

export function HeroInteractive({ strings }: HeroInteractiveProps) {
  const [activeIndex, setActiveIndex] = useState(2); // Defaults to Bastion Trading (index 2)

  // Interactive Phone Mockup States
  const [tvlValue, setTvlValue] = useState(45);
  const [drawdownPercent, setDrawdownPercent] = useState(70);
  const [allocationValue, setAllocationValue] = useState(30);

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

  const partners = [
    {
      id: "fasanara",
      name: "Fasanara Digital",
      logo: FasanaraLogo,
      category: "Asset Management",
      badges: ["USDC", strings.variableRate],
      description:
        "Receivables finance and liquidity provision for digital asset ecosystem and institutional players.",
      stats: {
        tvl: "$45m",
        apy: "11.2%",
        redemptions: strings.weekly,
      },
    },
    {
      id: "falconx",
      name: "FalconX",
      logo: FalconLogo,
      category: "Prime Brokerage",
      badges: ["USDC / USDT", strings.fixedRate],
      description:
        "Institutional credit lines for market making, arbitrage, and treasury management solutions.",
      stats: {
        tvl: "$60m",
        apy: strings.hidden,
        redemptions: strings.daily,
      },
    },
    {
      id: "bastion",
      name: "Bastion Trading",
      logo: BastionLogo,
      category: "Market Making",
      badges: ["USDT", strings.fixedRate],
      description:
        "Fixed rate loan channeling funds into derivatives trading and market-making strategies.",
      stats: {
        tvl: "$30m",
        apy: strings.hidden,
        redemptions: strings.monthly,
      },
    },
  ];

  const activePartner = partners[activeIndex];

  return (
    <>
      {/* Symmetrical Animated Waves Canvas */}
      <GuillocheWaves activeIndex={activeIndex} />

      {/* Centered Content Wrapper (Restricted max-w-4xl width) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-between pt-10 pb-4 px-4">
        {/* Animated text content wrapper */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center px-4 flex flex-col items-center mb-6 max-w-3xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="font-sans text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.15] mb-4 tracking-tight"
          >
            {strings.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="font-sans text-xs md:text-sm text-muted-foreground/85 leading-relaxed max-w-2xl"
          >
            {strings.heroSubtitle}
          </motion.p>
        </motion.div>

        {/* Interactive Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
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
            tvlValue={tvlValue}
            drawdownPercent={drawdownPercent}
            allocationValue={allocationValue}
            activePartner={activePartner}
            activeIndex={activeIndex}
            setTvlValue={setTvlValue}
            setDrawdownPercent={setDrawdownPercent}
            setAllocationValue={setAllocationValue}
          />
        </motion.div>

        {/* Tab Controls (Below the card) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="flex flex-wrap justify-center gap-2 mb-4 mt-6 relative z-20"
        >
          {partners.map((partner, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={partner.id}
                onClick={() => setActiveIndex(index)}
                className={`text-[9px] md:text-[10px] font-mono tracking-widest font-bold uppercase py-2 px-4 md:px-5 rounded-full border transition-all duration-300 ${
                  isActive
                    ? "bg-accent/15 border-accent/40 text-accent"
                    : "bg-transparent border-border/50 text-muted-foreground/80 hover:text-foreground hover:border-border"
                }`}
              >
                {partner.name}
              </button>
            );
          })}
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
