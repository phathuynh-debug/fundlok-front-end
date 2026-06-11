"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Lock } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

type MockupProps = {
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  rotateX: number;
  rotateY: number;
  shineX: number;
  shineY: number;
  activePartner: {
    id: string;
    name: string;
    category: string;
  };
};

export default function Mockup(props: MockupProps) {
  const { t } = useTranslations();
  const [device, setDevice] = useState<"phone" | "laptop">("phone");
  const [view, setView] = useState<"investor" | "sme">("sme");

  // SME Calculator states
  const [smeRevenue, setSmeRevenue] = useState<number>(50000);
  const [smeLoanSize, setSmeLoanSize] = useState<number>(100000);
  const [smeDuration, setSmeDuration] = useState<number>(12);

  // Investor Calculator states
  const [invSize, setInvSize] = useState<number>(150000);
  const [invRisk, setInvRisk] = useState<number>(5.0);
  const [invDuration, setInvDuration] = useState<number>(6);

  // Show results calculation states
  const [smeShowResults, setSmeShowResults] = useState(false);
  const [invShowResults, setInvShowResults] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setDevice(e.matches ? "laptop" : "phone");
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const partner = props.activePartner;

  // SME Calculations
  const grade = smeLoanSize / (smeRevenue * smeDuration);
  const isSmeRejected = grade > 0.5;
  const exponent = -(1.88656 * grade - 1.07237);
  const interestRate = 43.37647 / (1 + Math.exp(exponent));

  const gradeText = grade.toFixed(4);
  const interestRateText = interestRate.toFixed(2) + "%";

  // Investor Calculations
  let roiTranslation = 13.5;
  if (invRisk < 2) roiTranslation = 10.5;
  else if (invRisk < 4) roiTranslation = 11.5;
  else if (invRisk < 6) roiTranslation = 13.5;
  else if (invRisk < 8) roiTranslation = 16.5;
  else roiTranslation = 17.5;

  let adjustment = 0.4;
  if (invDuration <= 3) adjustment = 0;
  else if (invDuration <= 6) adjustment = 0.2;
  else if (invDuration <= 12) adjustment = 0.4;
  else adjustment = 0.6;

  const yearlyRoi = roiTranslation + adjustment;
  const yearlyRoiText = yearlyRoi.toFixed(1) + "%";
  const roiProfit = ((invSize * (yearlyRoi / 100)) / 12) * invDuration;
  const roiProfitText =
    "$" +
    roiProfit.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const matrixSme = (showResults: boolean) => (
    <table className="w-full text-left text-[10px] md:text-[11px] matrix-table">
      <tbody>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.monthlyRevenue")}
          </td>
          <td className="py-2 text-right font-mono font-bold text-white">
            ${smeRevenue.toLocaleString()}
          </td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.desiredLoanSize")}
          </td>
          <td className="py-2 text-right font-mono font-bold text-white">
            ${smeLoanSize.toLocaleString()}
          </td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.loanDuration")}
          </td>
          <td className="py-2 text-right font-mono font-bold text-zinc-300">
            {t("mockup.durationMonths", { months: smeDuration })}
          </td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.sigmoidIntRate")}
          </td>
          <td className="py-2 text-right font-mono font-bold">
            {showResults ? (
              <span className="text-emerald-400">{interestRateText}</span>
            ) : (
              <span className="text-zinc-650 font-sans text-[8.5px] flex items-center justify-end gap-1">
                <Lock className="w-2.5 h-2.5 text-zinc-650" />{" "}
                {t("mockup.pending")}
              </span>
            )}
          </td>
        </tr>
        <tr>
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.creditStatus")}
          </td>
          <td className="py-2 text-right font-sans font-extrabold uppercase tracking-wide">
            {showResults ? (
              <span
                className={isSmeRejected ? "text-red-400" : "text-emerald-400"}
              >
                {isSmeRejected ? t("mockup.rejected") : t("mockup.approved")}
              </span>
            ) : (
              <span className="text-zinc-650 font-mono text-[8.5px] font-bold">
                {t("mockup.locked")}
              </span>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );

  const matrixInvestor = (showResults: boolean) => (
    <table className="w-full text-left text-[10px] md:text-[11px] matrix-table">
      <tbody>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.investmentSize")}
          </td>
          <td className="py-2 text-right font-mono font-bold text-white">
            ${invSize.toLocaleString()}
          </td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.riskTolerance")}
          </td>
          <td className="py-2 text-right font-mono font-bold text-white">
            {invRisk.toFixed(1)} / 10
          </td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.durationTerms")}
          </td>
          <td className="py-2 text-right font-mono font-bold text-zinc-300">
            {t("mockup.durationMonths", { months: invDuration })}
          </td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.yearlyRoiRate")}
          </td>
          <td className="py-2 text-right font-mono font-bold">
            {showResults ? (
              <span className="text-emerald-400">{yearlyRoiText}</span>
            ) : (
              <span className="text-zinc-650 font-sans text-[8.5px] flex items-center justify-end gap-1">
                <Lock className="w-2.5 h-2.5 text-zinc-650" />{" "}
                {t("mockup.pending")}
              </span>
            )}
          </td>
        </tr>
        <tr>
          <td className="py-2 font-semibold text-zinc-400">
            {t("mockup.estProfitReturn")}
          </td>
          <td className="py-2 text-right font-mono font-bold">
            {showResults ? (
              <span className="text-emerald-400">{roiProfitText}</span>
            ) : (
              <span className="text-zinc-650 font-mono text-[8.5px] font-bold">
                {t("mockup.locked")}
              </span>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );

  if (device === "laptop") {
    return (
      <div className="w-full flex justify-center mb-6 z-20 select-none">
        <div className="relative w-[800px] aspect-[2528/1684] shrink-0">
          {/* MacBook Pro Model Image */}
          <img
            src="/images/macbook.png"
            alt="MacBook Pro Mockup"
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Screen Glass Inner Box */}
          <div
            className="absolute overflow-hidden bg-slate-950 border border-black/30 shadow-inner flex flex-col justify-between"
            style={{
              top: "10.7%",
              left: "14.5%",
              width: "71.6%",
              height: "73.3%",
              borderRadius: "1rem 1rem 0.1rem 0.1rem",
            }}
          >
            {/* Web Browser Header */}
            <div className="bg-[#141517] border-b border-zinc-950 px-4 py-2 flex items-center justify-between shrink-0 select-none">
              {/* macOS Dot Window Controls */}
              <div className="flex items-center gap-1.5 w-1/4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e] opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123] opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29] opacity-80" />
              </div>

              {/* URL Search bar */}
              <div className="w-2/4 max-w-sm flex items-center justify-center gap-1.5 bg-black/40 border border-zinc-800/80 px-4 py-1.5 rounded-lg text-[10px] text-zinc-400 font-mono tracking-wide">
                <Lock className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                <span className="truncate">
                  app.fundlok.com/portal/{partner.id}
                </span>
              </div>

              {/* Secure Badge */}
              <div className="w-1/4 flex justify-end items-center gap-2 text-[9px] text-zinc-500 font-mono font-bold tracking-wider">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest scale-90">
                  Active
                </span>
              </div>
            </div>

            {/* Portal Dashboard App */}
            <div className="bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 flex-1 text-white p-5 overflow-hidden flex flex-col justify-between">
              {/* Nav & Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5.5 h-5.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span className="font-sans font-bold text-[10px] uppercase tracking-widest text-zinc-300">
                    {partner.name}
                  </span>
                </div>

                {/* Portal Selectors */}
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 p-0.5 rounded-lg">
                  <button
                    onClick={() => setView("sme")}
                    className={`text-[8.5px] font-mono tracking-wider px-4 py-1.5 rounded-md font-bold transition-all duration-300 cursor-pointer ${view === "sme" ? "bg-emerald-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    {t("mockup.smePortal")}
                  </button>
                  <button
                    onClick={() => setView("investor")}
                    className={`text-[8.5px] font-mono tracking-wider px-4 py-1.5 rounded-md font-bold transition-all duration-300 cursor-pointer ${view === "investor" ? "bg-emerald-600 text-white shadow-md" : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    {t("mockup.investorPortal")}
                  </button>
                </div>
              </div>

              {/* Dashboard grid */}
              <div className="grid grid-cols-12 gap-5 flex-1 pt-4 items-center">
                {/* Left Column: table parameters */}
                <div className="col-span-6 bg-zinc-950/45 border border-zinc-900/60 rounded-xl p-4 flex flex-col justify-between h-full max-h-[235px] shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2 mb-2">
                    <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-400 uppercase">
                      {view === "sme"
                        ? t("mockup.borrowerSpecs")
                        : t("mockup.investmentSpecs")}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-zinc-550 uppercase bg-zinc-900/60 px-2 py-0.5 rounded">
                      {partner.category}
                    </span>
                  </div>
                  {view === "sme"
                    ? matrixSme(smeShowResults)
                    : matrixInvestor(invShowResults)}
                </div>

                {/* Right Column: Visual Charts & Controls */}
                <div className="col-span-6 flex flex-col justify-between h-full max-h-[235px] gap-3">
                  {view === "sme" ? (
                    !smeShowResults ? (
                      <>
                        {/* SME Sliders controls */}
                        <div className="bg-zinc-950/45 border border-zinc-900/50 rounded-xl p-2.5 flex flex-col gap-2 shadow-lg backdrop-blur-sm flex-1 justify-center">
                          {/* Slider 1: Loan Size */}
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                              <span>{t("mockup.desiredLoanSize")}</span>
                              <span className="text-emerald-400 font-mono font-semibold text-[9px]">
                                ${(smeLoanSize / 1000).toFixed(0)}k
                              </span>
                            </div>
                            <input
                              type="range"
                              min="10000"
                              max="500000"
                              step="5000"
                              value={smeLoanSize}
                              onChange={(e) =>
                                setSmeLoanSize(Number(e.target.value))
                              }
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                            />
                          </div>

                          {/* Slider 2: Monthly Revenue */}
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                              <span>{t("mockup.monthlyRevenue")}</span>
                              <span className="text-emerald-400 font-mono font-semibold text-[9px]">
                                ${(smeRevenue / 1000).toFixed(0)}k
                              </span>
                            </div>
                            <input
                              type="range"
                              min="10000"
                              max="200000"
                              step="5000"
                              value={smeRevenue}
                              onChange={(e) =>
                                setSmeRevenue(Number(e.target.value))
                              }
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                            />
                          </div>

                          {/* Slider 3: Duration */}
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                              <span>{t("mockup.loanDuration")}</span>
                              <span className="text-emerald-400 font-mono font-semibold text-[9px]">
                                {t("mockup.durationMonths", {
                                  months: smeDuration,
                                })}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="24"
                              step="1"
                              value={smeDuration}
                              onChange={(e) =>
                                setSmeDuration(Number(e.target.value))
                              }
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => setSmeShowResults(true)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all text-[8.5px] font-sans font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-900/20 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {t("mockup.calculateSme")}
                        </button>
                      </>
                    ) : (
                      <div className="bg-zinc-950/45 border border-zinc-900/50 rounded-xl p-3 flex flex-col justify-between shadow-lg backdrop-blur-sm flex-1 h-full">
                        <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-900/40 pb-1.5">
                          <span>{t("mockup.creditAssessment")}</span>
                          <span
                            className={
                              isSmeRejected
                                ? "text-red-400"
                                : "text-emerald-400"
                            }
                          >
                            {isSmeRejected
                              ? t("mockup.rejected")
                              : t("mockup.approved")}
                          </span>
                        </div>

                        <div className="flex items-center justify-around flex-1 py-1">
                          {/* SVG Gauges */}
                          <div className="relative w-18 h-18">
                            <svg className="w-full h-full transform -rotate-90">
                              {/* Track circle */}
                              <circle
                                cx="36"
                                cy="36"
                                r="30"
                                className="stroke-zinc-800"
                                strokeWidth="5"
                                fill="transparent"
                              />
                              {/* Progress circle */}
                              <circle
                                cx="36"
                                cy="36"
                                r="30"
                                className={`transition-all duration-500 ${
                                  isSmeRejected
                                    ? "stroke-red-500"
                                    : 1 - grade >= 0.7
                                      ? "stroke-emerald-500"
                                      : "stroke-amber-500"
                                }`}
                                strokeWidth="5"
                                fill="transparent"
                                strokeDasharray={188.4}
                                strokeDashoffset={
                                  188.4 -
                                  (Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      Math.round((1 - grade) * 100),
                                    ),
                                  ) /
                                    100) *
                                    188.4
                                }
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-0.5">
                              <span className="text-sm font-mono font-bold text-white leading-none">
                                {Math.max(
                                  0,
                                  Math.min(100, Math.round((1 - grade) * 100)),
                                )}
                              </span>
                              <span className="text-[5px] text-zinc-500 font-sans font-bold uppercase tracking-wider mt-0.5">
                                {t("mockup.scoreLabel")}
                              </span>
                            </div>
                          </div>

                          {/* Metric readout */}
                          <div className="flex flex-col gap-1.5 text-[9px]">
                            <div className="flex flex-col">
                              <span className="text-zinc-550 text-[6px] font-sans font-bold uppercase tracking-wider">
                                {t("mockup.leverageRatio")}
                              </span>
                              <span className="font-mono text-white font-bold">
                                {gradeText}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-zinc-550 text-[6px] font-sans font-bold uppercase tracking-wider">
                                {t("mockup.assignedApr")}
                              </span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {interestRateText}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSmeShowResults(false)}
                          className="w-full py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[8px] font-sans font-bold uppercase tracking-wider hover:bg-zinc-850 hover:border-zinc-700 active:scale-98 transition-all text-zinc-300 cursor-pointer"
                        >
                          {t("mockup.adjustSme")}
                        </button>
                      </div>
                    )
                  ) : !invShowResults ? (
                    <>
                      {/* Investor Sliders controls */}
                      <div className="bg-zinc-950/45 border border-zinc-900/50 rounded-xl p-2.5 flex flex-col gap-2 shadow-lg backdrop-blur-sm flex-1 justify-center">
                        {/* Slider 1: Investment Size */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>{t("mockup.investmentShort")}</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">
                              ${(invSize / 1000).toFixed(0)}k
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10000"
                            max="1000000"
                            step="10000"
                            value={invSize}
                            onChange={(e) => setInvSize(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                          />
                        </div>

                        {/* Slider 2: Risk Tolerance */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>{t("mockup.riskTolerance")}</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">
                              {invRisk.toFixed(1)} / 10
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={invRisk}
                            onChange={(e) => setInvRisk(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                          />
                        </div>

                        {/* Slider 3: Duration */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>{t("mockup.durationTerms")}</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">
                              {t("mockup.durationMonths", {
                                months: invDuration,
                              })}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="24"
                            step="1"
                            value={invDuration}
                            onChange={(e) =>
                              setInvDuration(Number(e.target.value))
                            }
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setInvShowResults(true)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all text-[8.5px] font-sans font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-900/20 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {t("mockup.calculateInv")}
                      </button>
                    </>
                  ) : (
                    <div className="bg-zinc-950/45 border border-zinc-900/50 rounded-xl p-3 flex flex-col justify-between shadow-lg backdrop-blur-sm flex-1 h-full">
                      <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-900/40 pb-1.5">
                        <span>{t("mockup.yieldReturnProjection")}</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          APY: {yearlyRoiText}
                        </span>
                      </div>

                      {/* Chart bars */}
                      <div className="h-20 flex items-end justify-between gap-1.5 px-1 py-1">
                        {[3, 6, 12, 18, 24].map((dur) => {
                          let rTranslation = 13.5;
                          if (invRisk < 2) rTranslation = 10.5;
                          else if (invRisk < 4) rTranslation = 11.5;
                          else if (invRisk < 6) rTranslation = 13.5;
                          else if (invRisk < 8) rTranslation = 16.5;
                          else rTranslation = 17.5;

                          let adj = 0.4;
                          if (dur <= 3) adj = 0;
                          else if (dur <= 6) adj = 0.2;
                          else if (dur <= 12) adj = 0.4;
                          else adj = 0.6;

                          const roi = rTranslation + adj;
                          const profit = ((invSize * (roi / 100)) / 12) * dur;
                          const maxProfit =
                            ((1000000 * (18.1 / 100)) / 12) * 24;
                          const heightPct = Math.min(
                            100,
                            Math.max(15, (profit / maxProfit) * 150),
                          );

                          const isHighlighted =
                            (dur === 3 && invDuration <= 3) ||
                            (dur === 6 &&
                              invDuration > 3 &&
                              invDuration <= 6) ||
                            (dur === 12 &&
                              invDuration > 6 &&
                              invDuration <= 12) ||
                            (dur === 18 &&
                              invDuration > 12 &&
                              invDuration <= 18) ||
                            (dur === 24 && invDuration > 18);

                          return (
                            <div
                              key={dur}
                              className="flex-1 h-full flex flex-col items-center justify-end"
                            >
                              <span
                                className={`text-[6px] font-mono mb-0.5 ${isHighlighted ? "text-emerald-400 font-bold" : "text-zinc-500"}`}
                              >
                                ${Math.round(profit).toLocaleString()}
                              </span>
                              <div
                                className={`w-full rounded-t-sm transition-all duration-300 ${isHighlighted ? "bg-emerald-400 shadow-[0_0_5px_#10b981]" : "bg-emerald-500/25"}`}
                                style={{ height: `${heightPct}%` }}
                              />
                              <span
                                className={`text-[6px] font-mono mt-1 ${isHighlighted ? "text-emerald-400 font-bold" : "text-zinc-500"}`}
                              >
                                {t("mockup.durationMos", { months: dur })}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setInvShowResults(false)}
                        className="w-full py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[8px] font-sans font-bold uppercase tracking-wider hover:bg-zinc-850 hover:border-zinc-700 active:scale-98 transition-all text-zinc-300 cursor-pointer"
                      >
                        {t("mockup.adjustInv")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile / Tablet: Tactile Phone Mockup
  return (
    <div
      onMouseMove={props.onMouseMove}
      onMouseLeave={props.onMouseLeave}
      style={{ perspective: 1000 }}
      className="w-[300px] h-[550px] relative mb-6 shrink-0 z-20 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="absolute inset-0 bg-emerald-500/15 rounded-[3rem] blur-3xl pointer-events-none animate-pulse" />

      <motion.div
        style={{
          rotateX: props.rotateX,
          rotateY: props.rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full rounded-[2.8rem] border-8 border-zinc-800 dark:border-zinc-800 bg-zinc-950 p-2 relative flex flex-col justify-between overflow-hidden shadow-2xl ring-1 ring-zinc-700/50"
      >
        {/* Phone Notch */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-40 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <span className="w-0.5 h-0.5 rounded-full bg-blue-500" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
        </div>

        {/* Inner Screen Content */}
        <div className="w-full h-full rounded-[2.2rem] bg-zinc-950 overflow-hidden relative flex flex-col justify-between p-3.5 pt-12.5 border border-zinc-900">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
              </div>
              <span className="text-[9px] font-bold tracking-wider text-zinc-300">
                FundLok
              </span>
            </div>
            <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
              <button
                onClick={() => setView("sme")}
                className={`text-[9px] px-2.5 py-1 rounded-md transition-all duration-200 ${view === "sme" ? "bg-emerald-600 text-white font-bold" : "text-zinc-500"}`}
              >
                {t("mockup.smeShort")}
              </button>
              <button
                onClick={() => setView("investor")}
                className={`text-[9px] px-2.5 py-1 rounded-md transition-all duration-200 ${view === "investor" ? "bg-emerald-600 text-white font-bold" : "text-zinc-500"}`}
              >
                {t("mockup.invShort")}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Top: specs table */}
            <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-2.5 mb-2">
              <div className="text-[7.5px] font-mono text-emerald-400 font-bold mb-1.5 uppercase tracking-wide border-b border-zinc-900 pb-1 flex justify-between">
                <span>
                  {view === "sme"
                    ? t("mockup.borrowerSpecs")
                    : t("mockup.investmentSpecs")}
                </span>
                {view === "sme"
                  ? smeShowResults && (
                      <span
                        className={
                          isSmeRejected ? "text-red-400" : "text-emerald-400"
                        }
                      >
                        {isSmeRejected
                          ? t("mockup.rejected")
                          : t("mockup.approved")}
                      </span>
                    )
                  : invShowResults && (
                      <span className="text-emerald-400">{yearlyRoiText}</span>
                    )}
              </div>
              {view === "sme"
                ? matrixSme(smeShowResults)
                : matrixInvestor(invShowResults)}
            </div>

            {/* Bottom: sliders / charts / CTAs */}
            <div className="flex-1 flex flex-col justify-between gap-2 overflow-hidden">
              {view === "sme" ? (
                !smeShowResults ? (
                  <>
                    <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-2 flex flex-col gap-2 justify-center flex-1">
                      {/* Slider 1: Loan Size */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-[7px] text-zinc-400 font-bold uppercase tracking-wider">
                          <span>{t("mockup.desiredLoanShort")}</span>
                          <span className="text-emerald-400 font-mono font-semibold text-[8px]">
                            ${(smeLoanSize / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="500000"
                          step="5000"
                          value={smeLoanSize}
                          onChange={(e) =>
                            setSmeLoanSize(Number(e.target.value))
                          }
                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                        />
                      </div>

                      {/* Slider 2: Monthly Revenue */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-[7px] text-zinc-400 font-bold uppercase tracking-wider">
                          <span>{t("mockup.monthlyRevShort")}</span>
                          <span className="text-emerald-400 font-mono font-semibold text-[8px]">
                            ${(smeRevenue / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10000"
                          max="200000"
                          step="5000"
                          value={smeRevenue}
                          onChange={(e) =>
                            setSmeRevenue(Number(e.target.value))
                          }
                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                        />
                      </div>

                      {/* Slider 3: Duration */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-[7px] text-zinc-400 font-bold uppercase tracking-wider">
                          <span>{t("mockup.loanDurationShort")}</span>
                          <span className="text-emerald-400 font-mono font-semibold text-[8px]">
                            {t("mockup.durationMos", { months: smeDuration })}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="24"
                          step="1"
                          value={smeDuration}
                          onChange={(e) =>
                            setSmeDuration(Number(e.target.value))
                          }
                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setSmeShowResults(true)}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all text-[8px] font-sans font-bold uppercase tracking-widest text-white shadow-lg cursor-pointer flex items-center justify-center"
                    >
                      {t("mockup.calculateSme")}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-2.5 flex items-center justify-around flex-1">
                      {/* SVG Gauge */}
                      <div className="relative w-14 h-14 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="23"
                            className="stroke-zinc-800"
                            strokeWidth="4"
                            fill="transparent"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="23"
                            className={`transition-all duration-500 ${isSmeRejected ? "stroke-red-500" : 1 - grade >= 0.7 ? "stroke-emerald-500" : "stroke-amber-500"}`}
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={144.4}
                            strokeDashoffset={
                              144.4 -
                              (Math.max(
                                0,
                                Math.min(100, Math.round((1 - grade) * 100)),
                              ) /
                                100) *
                                144.4
                            }
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center -translate-y-0.5">
                          <span className="text-xs font-mono font-bold text-white leading-none">
                            {Math.max(
                              0,
                              Math.min(100, Math.round((1 - grade) * 100)),
                            )}
                          </span>
                          <span className="text-[4px] text-zinc-550 font-sans font-bold uppercase tracking-wider mt-0.5">
                            {t("mockup.scoreLabel")}
                          </span>
                        </div>
                      </div>
                      {/* Metrics */}
                      <div className="flex flex-col gap-1 text-[8px]">
                        <div className="flex flex-col">
                          <span className="text-zinc-555 text-[6px] font-sans font-bold uppercase tracking-wider">
                            {t("mockup.leverageRatio")}
                          </span>
                          <span className="font-mono text-white font-bold">
                            {gradeText}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-555 text-[6px] font-sans font-bold uppercase tracking-wider">
                            {t("mockup.assignedApr")}
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {interestRateText}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSmeShowResults(false)}
                      className="w-full py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[8px] font-sans font-bold uppercase tracking-wider hover:bg-zinc-850 hover:border-zinc-700 active:scale-98 transition-all text-zinc-300 cursor-pointer"
                    >
                      {t("mockup.adjustShort")}
                    </button>
                  </>
                )
              ) : !invShowResults ? (
                <>
                  <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-2 flex flex-col gap-2 justify-center flex-1">
                    {/* Slider 1: Investment Size */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[7px] text-zinc-400 font-bold uppercase tracking-wider">
                        <span>{t("mockup.investmentShort")}</span>
                        <span className="text-emerald-400 font-mono font-semibold text-[8px]">
                          ${(invSize / 1000).toFixed(0)}k
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max="1000000"
                        step="10000"
                        value={invSize}
                        onChange={(e) => setInvSize(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                      />
                    </div>

                    {/* Slider 2: Risk */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[7px] text-zinc-400 font-bold uppercase tracking-wider">
                        <span>{t("mockup.riskTolerance")}</span>
                        <span className="text-emerald-400 font-mono font-semibold text-[8px]">
                          {invRisk.toFixed(1)}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={invRisk}
                        onChange={(e) => setInvRisk(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                      />
                    </div>

                    {/* Slider 3: Duration */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[7px] text-zinc-400 font-bold uppercase tracking-wider">
                        <span>{t("mockup.loanDurationShort")}</span>
                        <span className="text-emerald-400 font-mono font-semibold text-[8px]">
                          {t("mockup.durationMos", { months: invDuration })}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        step="1"
                        value={invDuration}
                        onChange={(e) => setInvDuration(Number(e.target.value))}
                        className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none thumb-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setInvShowResults(true)}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all text-[8px] font-sans font-bold uppercase tracking-widest text-white shadow-lg cursor-pointer flex items-center justify-center"
                  >
                    {t("mockup.calculateInv")}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-2 flex flex-col justify-between flex-1 overflow-hidden">
                    {/* Chart bars */}
                    <div className="h-14 flex items-end justify-between gap-1 px-0.5 pt-2">
                      {[3, 6, 12, 18, 24].map((dur) => {
                        let rTranslation = 13.5;
                        if (invRisk < 2) rTranslation = 10.5;
                        else if (invRisk < 4) rTranslation = 11.5;
                        else if (invRisk < 6) rTranslation = 13.5;
                        else if (invRisk < 8) rTranslation = 16.5;
                        else rTranslation = 17.5;

                        let adj = 0.4;
                        if (dur <= 3) adj = 0;
                        else if (dur <= 6) adj = 0.2;
                        else if (dur <= 12) adj = 0.4;
                        else adj = 0.6;

                        const roi = rTranslation + adj;
                        const profit = ((invSize * (roi / 100)) / 12) * dur;
                        const maxProfit = ((1000000 * (18.1 / 100)) / 12) * 24;
                        const heightPct = Math.min(
                          100,
                          Math.max(15, (profit / maxProfit) * 150),
                        );

                        const isHighlighted =
                          (dur === 3 && invDuration <= 3) ||
                          (dur === 6 && invDuration > 3 && invDuration <= 6) ||
                          (dur === 12 &&
                            invDuration > 6 &&
                            invDuration <= 12) ||
                          (dur === 18 &&
                            invDuration > 12 &&
                            invDuration <= 18) ||
                          (dur === 24 && invDuration > 18);

                        return (
                          <div
                            key={dur}
                            className="flex-1 h-full flex flex-col items-center justify-end"
                          >
                            <span
                              className={`text-[5px] font-mono mb-0.5 ${isHighlighted ? "text-emerald-400 font-bold" : "text-zinc-555"}`}
                            >
                              ${Math.round(profit).toLocaleString()}
                            </span>
                            <div
                              className={`w-full rounded-t-sm transition-all duration-300 ${isHighlighted ? "bg-emerald-400 shadow-[0_0_3px_#10b981]" : "bg-emerald-500/20"}`}
                              style={{ height: `${heightPct}%` }}
                            />
                            <span
                              className={`text-[5px] font-mono mt-0.5 ${isHighlighted ? "text-emerald-400 font-bold" : "text-zinc-500"}`}
                            >
                              {t("mockup.durationMos", { months: dur })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setInvShowResults(false)}
                    className="w-full py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[8px] font-sans font-bold uppercase tracking-wider hover:bg-zinc-850 hover:border-zinc-700 active:scale-98 transition-all text-zinc-300 cursor-pointer"
                  >
                    {t("mockup.adjustShort")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
