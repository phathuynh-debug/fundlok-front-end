"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Lock } from "lucide-react"

type MockupProps = {
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseLeave: () => void
  rotateX: number
  rotateY: number
  shineX: number
  shineY: number
  tvlValue: number
  drawdownPercent: number
  allocationValue: number
  activePartner: {
    id: string
    name: string
    category: string
    badges: string[]
    description: string
    stats: {
      tvl: string
      apy: string
      redemptions: string
    }
  }
  activeIndex: number
  setTvlValue: (v: number) => void
  setDrawdownPercent: (v: number) => void
  setAllocationValue: (v: number) => void
  setActiveIndex?: (index: number) => void
}

export default function Mockup(props: MockupProps) {
  const [device, setDevice] = useState<'phone' | 'laptop'>('phone')
  const [view, setView] = useState<'investor' | 'sme'>('sme')

  // SME Calculator states
  const [smeRevenue, setSmeRevenue] = useState<number>(50000)
  const [smeLoanSize, setSmeLoanSize] = useState<number>(100000)
  const [smeDuration, setSmeDuration] = useState<number>(12)

  // Investor Calculator states
  const [invSize, setInvSize] = useState<number>(150000)
  const [invRisk, setInvRisk] = useState<number>(5.0)
  const [invDuration, setInvDuration] = useState<number>(6)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setDevice((e as any).matches ? 'laptop' : 'phone')
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const partner = props.activePartner

  // SME Calculations
  const grade = smeLoanSize / (smeRevenue * smeDuration)
  const isSmeRejected = grade > 0.5
  const exponent = -(1.88656 * grade - 1.07237)
  const interestRate = 43.37647 / (1 + Math.exp(exponent))
  
  const gradeText = grade.toFixed(4)
  const interestRateText = interestRate.toFixed(2) + "%"
  const statusText = isSmeRejected ? "REJECTED" : "APPROVED"

  // Investor Calculations
  let roiTranslation = 13.5
  if (invRisk < 2) roiTranslation = 10.5
  else if (invRisk < 4) roiTranslation = 11.5
  else if (invRisk < 6) roiTranslation = 13.5
  else if (invRisk < 8) roiTranslation = 16.5
  else roiTranslation = 17.5

  let adjustment = 0.4
  if (invDuration <= 3) adjustment = 0
  else if (invDuration <= 6) adjustment = 0.2
  else if (invDuration <= 12) adjustment = 0.4
  else adjustment = 0.6

  const yearlyRoi = roiTranslation + adjustment
  const yearlyRoiText = yearlyRoi.toFixed(1) + "%"
  const roiProfit = invSize * (yearlyRoi / 100) / 12 * invDuration
  const roiProfitText = "$" + roiProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const matrixSme = (
    <table className="w-full text-left text-[10px] md:text-[11px]">
      <tbody>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Monthly Revenue</td>
          <td className="py-2 text-right font-mono font-bold text-white">${smeRevenue.toLocaleString()}</td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Desired Loan Size</td>
          <td className="py-2 text-right font-mono font-bold text-white">${smeLoanSize.toLocaleString()}</td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Loan Duration</td>
          <td className="py-2 text-right font-mono font-bold text-zinc-300">{smeDuration} Months</td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Indicative Grade</td>
          <td className={`py-2 text-right font-mono font-bold ${isSmeRejected ? "text-red-400" : "text-zinc-300"}`}>{gradeText}</td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Sigmoid Int. Rate</td>
          <td className="py-2 text-right font-mono font-bold text-emerald-400">{interestRateText}</td>
        </tr>
        <tr>
          <td className="py-2 font-semibold text-zinc-400">Credit Status</td>
          <td className="py-2 text-right font-sans font-extrabold uppercase tracking-wide">
            <span className={isSmeRejected ? "text-red-400" : "text-emerald-400"}>
              {statusText}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  )

  const matrixInvestor = (
    <table className="w-full text-left text-[10px] md:text-[11px]">
      <tbody>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Investment Size</td>
          <td className="py-2 text-right font-mono font-bold text-white">${invSize.toLocaleString()}</td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Risk Tolerance</td>
          <td className="py-2 text-right font-mono font-bold text-white">{invRisk.toFixed(1)} / 10</td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Duration Terms</td>
          <td className="py-2 text-right font-mono font-bold text-zinc-300">{invDuration} Months</td>
        </tr>
        <tr className="border-b border-zinc-900/40">
          <td className="py-2 font-semibold text-zinc-400">Yearly ROI Rate</td>
          <td className="py-2 text-right font-mono font-bold text-emerald-400">{yearlyRoiText}</td>
        </tr>
        <tr>
          <td className="py-2 font-semibold text-zinc-400">Est. Profit Return</td>
          <td className="py-2 text-right font-mono font-bold text-emerald-400">{roiProfitText}</td>
        </tr>
      </tbody>
    </table>
  )

  if (device === 'laptop') {
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
              borderRadius: "1rem 1rem 0.1rem 0.1rem"
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
                <span className="truncate">app.fundlok.com/portal/{partner.id}</span>
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
                  {props.setActiveIndex ? (
                    <select
                      value={props.activeIndex}
                      onChange={(e) => props.setActiveIndex?.(Number(e.target.value))}
                      className="bg-zinc-950/80 border border-zinc-800/80 text-zinc-200 text-[9px] font-sans font-bold uppercase tracking-wider rounded px-2 py-0.5 focus:outline-none cursor-pointer hover:border-zinc-700 transition-colors"
                    >
                      <option value={0}>Fasanara Digital</option>
                      <option value={1}>FalconX</option>
                      <option value={2}>Bastion Trading</option>
                    </select>
                  ) : (
                    <span className="font-sans font-bold text-[10px] uppercase tracking-widest text-zinc-300">
                      Fundlok Terminal
                    </span>
                  )}
                </div>

                {/* Portal Selectors */}
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setView('sme')} 
                    className={`text-[8.5px] font-mono tracking-wider px-4 py-1.5 rounded-md font-bold transition-all duration-300 cursor-pointer ${view === 'sme' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    SME PORTAL
                  </button>
                  <button 
                    onClick={() => setView('investor')} 
                    className={`text-[8.5px] font-mono tracking-wider px-4 py-1.5 rounded-md font-bold transition-all duration-300 cursor-pointer ${view === 'investor' ? 'bg-emerald-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    INVESTOR PORTAL
                  </button>
                </div>
              </div>

              {/* Dashboard grid */}
              <div className="grid grid-cols-12 gap-5 flex-1 pt-4 items-center">
                
                {/* Left Column: table parameters */}
                <div className="col-span-6 bg-zinc-950/45 border border-zinc-900/60 rounded-xl p-4 flex flex-col justify-between h-full max-h-[235px] shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2 mb-2">
                    <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-400 uppercase">
                      {view === 'sme' ? 'Borrower Specs' : 'Investment Specs'}
                    </span>
                    <span className="text-[9px] font-sans font-bold text-zinc-550 uppercase bg-zinc-900/60 px-2 py-0.5 rounded">
                      {partner.category}
                    </span>
                  </div>
                  {view === 'sme' ? matrixSme : matrixInvestor}
                </div>

                {/* Right Column: Visual Charts & Controls */}
                <div className="col-span-6 flex flex-col justify-between h-full max-h-[235px] gap-3">
                  {view === 'sme' ? (
                    <>
                      {/* SME Capacity Gauge */}
                      <div className="flex items-center gap-4 bg-zinc-950/45 border border-zinc-900/60 rounded-xl p-2 shrink-0 shadow-lg backdrop-blur-sm">
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          <svg className="absolute w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="18" stroke="rgba(39, 39, 42, 0.4)" strokeWidth="3" fill="transparent" />
                            <circle 
                              cx="24" 
                              cy="24" 
                              r="18" 
                              stroke={isSmeRejected ? "#f43f5e" : "#10b981"} 
                              strokeWidth="3" 
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 18} 
                              strokeDashoffset={2 * Math.PI * 18 - (2 * Math.PI * 18 * Math.min(1.0, grade))} 
                              strokeLinecap="round" 
                              className="transition-all duration-300"
                            />
                          </svg>
                          <span className="text-[9px] font-mono font-bold text-zinc-100">{grade.toFixed(2)}</span>
                        </div>
                        <div className="flex-1 font-mono leading-tight text-[9px]">
                          <span className="block text-[7px] text-zinc-550 uppercase font-bold tracking-wider mb-0.5">Indicative Grade</span>
                          <span className={`text-xs font-bold ${isSmeRejected ? "text-red-400" : "text-white"}`}>{gradeText}</span>
                          <span className="block text-[6.5px] text-zinc-500 mt-0.5">
                            Limit: 0.50 (Max Risk)
                          </span>
                        </div>
                      </div>

                      {/* SME Sliders controls */}
                      <div className="bg-zinc-950/45 border border-zinc-900/50 rounded-xl p-2.5 flex flex-col gap-2.5 shadow-lg backdrop-blur-sm flex-1 justify-center">
                        {/* Slider 1: Loan Size */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>Desired Loan Size</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">${(smeLoanSize / 1000).toFixed(0)}k</span>
                          </div>
                          <input 
                            type="range" 
                            min="10000" 
                            max="500000" 
                            step="5000"
                            value={smeLoanSize} 
                            onChange={(e) => setSmeLoanSize(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Slider 2: Monthly Revenue */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>Monthly Revenue</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">${(smeRevenue / 1000).toFixed(0)}k</span>
                          </div>
                          <input 
                            type="range" 
                            min="10000" 
                            max="200000" 
                            step="5000"
                            value={smeRevenue} 
                            onChange={(e) => setSmeRevenue(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Slider 3: Duration */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>Loan Duration</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">{smeDuration} Months</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="24" 
                            step="1"
                            value={smeDuration} 
                            onChange={(e) => setSmeDuration(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Investor MM Activity Chart */}
                      <div className="bg-zinc-950/45 border border-zinc-900/60 rounded-xl p-2 shrink-0 flex flex-col justify-between shadow-lg backdrop-blur-sm">
                        <div className="flex justify-between items-center text-[7px] text-zinc-550 font-bold uppercase tracking-wider mb-1">
                          <span>Yield Return Projection</span>
                          <span className="text-emerald-400 font-bold font-mono">APY: {yearlyRoiText}</span>
                        </div>

                        {/* Chart bars */}
                        <div className="h-8 flex items-end justify-between gap-1 px-1">
                          {[3, 6, 12, 18, 24].map((dur) => {
                            let rTranslation = 13.5
                            if (invRisk < 2) rTranslation = 10.5
                            else if (invRisk < 4) rTranslation = 11.5
                            else if (invRisk < 6) rTranslation = 13.5
                            else if (invRisk < 8) rTranslation = 16.5
                            else rTranslation = 17.5

                            let adj = 0.4
                            if (dur <= 3) adj = 0
                            else if (dur <= 6) adj = 0.2
                            else if (dur <= 12) adj = 0.4
                            else adj = 0.6

                            const roi = rTranslation + adj
                            const profit = invSize * (roi / 100) / 12 * dur
                            const maxProfit = 1000000 * (18.1 / 100) / 12 * 24
                            const heightPct = Math.min(100, Math.max(15, (profit / maxProfit) * 200))
                            
                            const isHighlighted = 
                              (dur === 3 && invDuration <= 3) ||
                              (dur === 6 && invDuration > 3 && invDuration <= 6) ||
                              (dur === 12 && invDuration > 6 && invDuration <= 12) ||
                              (dur === 18 && invDuration > 12 && invDuration <= 18) ||
                              (dur === 24 && invDuration > 18)

                            return (
                              <div key={dur} className="flex-1 h-full flex flex-col items-center justify-end">
                                <div 
                                  className={`w-full rounded-t-sm transition-all duration-300 ${isHighlighted ? 'bg-emerald-400 shadow-[0_0_5px_#10b981]' : 'bg-emerald-500/25'}`} 
                                  style={{ height: `${heightPct}%` }}
                                />
                                <span className="text-[6px] font-mono text-zinc-500 mt-0.5">{dur}M</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Investor Sliders controls */}
                      <div className="bg-zinc-950/45 border border-zinc-900/50 rounded-xl p-2.5 flex flex-col gap-2.5 shadow-lg backdrop-blur-sm flex-1 justify-center">
                        {/* Slider 1: Investment Size */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>Desired Investment</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">${(invSize / 1000).toFixed(0)}k</span>
                          </div>
                          <input 
                            type="range" 
                            min="10000" 
                            max="1000000" 
                            step="10000"
                            value={invSize} 
                            onChange={(e) => setInvSize(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Slider 2: Risk Tolerance */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>Risk Tolerance</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">{invRisk.toFixed(1)} / 10</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="0.5"
                            value={invRisk} 
                            onChange={(e) => setInvRisk(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Slider 3: Duration */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>Investment Duration</span>
                            <span className="text-emerald-400 font-mono font-semibold text-[9px]">{invDuration} Months</span>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="24" 
                            step="1"
                            value={invDuration} 
                            onChange={(e) => setInvDuration(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
        style={{ rotateX: props.rotateX, rotateY: props.rotateY, transformStyle: 'preserve-3d' }} 
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
              <span className="text-[9px] font-bold tracking-wider text-zinc-300">FundLok</span>
            </div>
            <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
              <button 
                onClick={() => setView('sme')} 
                className={`text-[9px] px-2.5 py-1 rounded-md transition-all duration-200 ${view === 'sme' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-500'}`}
              >
                SME
              </button>
              <button 
                onClick={() => setView('investor')} 
                className={`text-[9px] px-2.5 py-1 rounded-md transition-all duration-200 ${view === 'investor' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-500'}`}
              >
                INV
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-3 flex-1 mb-3">
              <div className="text-[8px] font-mono text-emerald-400 font-bold mb-2 uppercase tracking-wide border-b border-zinc-900 pb-1">
                {view === 'sme' ? 'Borrowing Specs' : 'Investment Specs'}
              </div>
              {view === 'sme' ? matrixSme : matrixInvestor}
            </div>

            <div className="grid grid-cols-2 gap-2 text-center font-mono border-t border-zinc-900/60 pt-2.5">
              <div className="bg-zinc-900/20 rounded-lg p-1.5">
                <span className="block text-[6px] tracking-wider text-zinc-550 uppercase mb-0.5">
                  {view === 'sme' ? 'EST. APY' : 'YEARLY ROI'}
                </span>
                <span className="text-[9px] font-bold text-white">
                  {view === 'sme' ? interestRateText : yearlyRoiText}
                </span>
              </div>
              <div className="bg-zinc-900/20 rounded-lg p-1.5">
                <span className="block text-[6px] tracking-wider text-zinc-550 uppercase mb-0.5">
                  {view === 'sme' ? 'STATUS' : 'EST. PROFIT'}
                </span>
                <span className={`text-[9px] font-bold truncate block max-w-[80px] mx-auto ${view === 'sme' ? (isSmeRejected ? 'text-red-400' : 'text-emerald-400') : 'text-white'}`}>
                  {view === 'sme' ? statusText : roiProfitText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
