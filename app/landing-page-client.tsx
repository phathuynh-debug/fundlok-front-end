"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TrendingUp, 
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import { GuillocheWaves } from "@/components/guilloche-waves"
import SiteHeader from "@/components/site-header"
import Mockup from "@/components/mockup"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { InteractiveFlow } from "@/components/interactive-flow"
import { ThemeToggle } from "@/components/theme-toggle"

// Symmetrical custom vector logos
const FasanaraLogo = () => (
  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0">
    <svg className="w-7 h-7 animate-pulse" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" />
      <circle cx="24" cy="24" r="5" fill="currentColor" />
    </svg>
  </div>
)

const FalconLogo = () => (
  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0">
    <svg className="w-7 h-7" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 14L24 28L38 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 24L24 38L38 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" />
    </svg>
  </div>
)

const BastionLogo = () => (
  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0">
    <svg className="w-7 h-7" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
)

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

// Multilingual dictionary for static landing page assets
const dict = {
  en: {
    heroTitle: "Radically transforming credit, on-chain",
    heroSubtitle: "Building a marketplace of scaled on-chain credit facilities that displace legacy lending infrastructure and loan origination processes.",
    navProduct: "PRODUCT",
    navProcess: "HOW IT WORKS",
    navContact: "CONTACT",
    navPartners: "PARTNERS",
    navAchievements: "ACHIEVEMENTS",
    navTeam: "TEAM",
    enterApp: "ENTER APP",
    tvl: "TVL",
    netApy: "Net APY",
    redemptions: "Redemptions",
    hidden: "Hidden",
    monthly: "Monthly",
    weekly: "Weekly",
    daily: "Daily",
    fixedRate: "Fixed rate",
    variableRate: "Variable rate",
    processTitle: "A clearer, technology-enabled funding journey",
    processSubtitle: "FundLok is designed to make funding more flexible for SMEs and more transparent for investors — combining a customer-friendly experience with automation, data-driven assessment, secure fund handling, and clear repayment tracking.",
    ourSolution: "Our Solution",
    achievementsTitle: "FundLok's Achievements",
    achievementsSubtitle: "Recognized locally and globally for innovation, impact, and technology in FinTech and investment facilitation.",
    teamTitle: "Meet Our Team",
    teamSubtitle: "The builders and visionaries behind FundLok's technology, financial structuring, and growth.",
    teamCfo: "Chief Financial Officer",
    teamCeo: "Founder & Chief Executive Officer",
    teamCto: "Chief Technological Officer"
  },
  vi: {
    heroTitle: "Cách mạng hóa tín dụng hoàn toàn trên chuỗi",
    heroSubtitle: "Kiến tạo thị trường cho các cơ sở tín dụng on-chain quy mô lớn, thay thế cơ sở hạ tầng tài chính truyền thống và quy trình khởi tạo khoản vay ở từng giai đoạn.",
    navProduct: "SẢN PHẨM",
    navProcess: "QUY TRÌNH",
    navContact: "LIÊN HỆ",
    navAchievements: "THÀNH TỰU",
    navTeam: "ĐỘI NGŨ",
    enterApp: "VÀO ỨNG DỤNG",
    tvl: "Tổng tài sản khóa (TVL)",
    netApy: "Lợi nhuận ròng APY",
    redemptions: "Kỳ hạn rút vốn",
    hidden: "Ẩn",
    monthly: "Hàng tháng",
    weekly: "Hàng tuần",
    daily: "Hàng ngày",
    fixedRate: "Lãi suất cố định",
    variableRate: "Lãi suất thả nổi",
    processTitle: "Hành trình gọi vốn rõ ràng hơn, hỗ trợ bởi công nghệ",
    processSubtitle: "FundLok được thiết kế để giúp việc gọi vốn linh hoạt hơn cho doanh nghiệp SME và minh bạch hơn cho nhà đầu tư — kết hợp trải nghiệm thân thiện với khách hàng cùng quy trình tự động hóa, thẩm định bằng dữ liệu, quản lý quỹ an toàn và theo dõi hoàn trả rõ ràng.",
    ourSolution: "Giải pháp của chúng tôi",
    achievementsTitle: "Thành tựu của FundLok",
    achievementsSubtitle: "Được ghi nhận trong nước và quốc tế vì sự đổi mới sáng tạo, tầm ảnh hưởng và công nghệ trong lĩnh vực FinTech và thúc đẩy đầu tư.",
    teamTitle: "Đội ngũ sáng lập",
    teamSubtitle: "Những người xây dựng và kiến tạo đằng sau công nghệ, cấu trúc tài chính và sự tăng trưởng của FundLok.",
    teamCfo: "Giám đốc Tài chính (CFO)",
    teamCeo: "Nhà sáng lập & Giám đốc Điều hành (CEO)",
    teamCto: "Giám đốc Công nghệ (CTO)"
  }
}

export function LandingPageClient() {
  const { t, locale } = useTranslations()
  const currentLocale = (locale === "vi" ? "vi" : "en") as "en" | "vi"
  const strings = dict[currentLocale]

  const [activeIndex, setActiveIndex] = useState(2) // Defaults to Bastion Trading (index 2)
  const processRef = useRef<HTMLDivElement>(null)
  const achievementsRef = useRef<HTMLDivElement>(null)
  const teamRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  const [activeAchievement, setActiveAchievement] = useState(0)
  const [direction, setDirection] = useState<"left" | "right">("right")

  const achievementsData = {
    en: [
      {
        title: "Top 3 Project to Facilitate Investments",
        subtitle: "Sustainability in Action 2024 - Australian Government"
      },
      {
        title: "Seed Stage Start-up Incubation in FinTech Industry 2025",
        subtitle: "Startup and Innovation Hub Ho Chi Minh City (SIHUB)"
      },
      {
        title: "Top 10 Potential Project Global",
        subtitle: "International Blockchain Olympiad 2023"
      }
    ],
    vi: [
      {
        title: "Top 3 Dự án Thúc đẩy Đầu tư",
        subtitle: "Sustainability in Action 2024 - Chính phủ Úc"
      },
      {
        title: "Ươm tạo Khởi nghiệp Giai đoạn Hạt giống ngành FinTech 2025",
        subtitle: "Trung tâm Khởi nghiệp và Đổi mới sáng tạo TP.HCM (SIHUB)"
      },
      {
        title: "Top 10 Dự án Tiềm năng Toàn cầu",
        subtitle: "Thế vận hội Blockchain Quốc tế 2023 (IBCOL)"
      }
    ]
  }

  const handlePrevAchievement = () => {
    setDirection("left")
    setActiveAchievement((prev) => (prev === 0 ? achievementsData[currentLocale].length - 1 : prev - 1))
  }

  const handleNextAchievement = () => {
    setDirection("right")
    setActiveAchievement((prev) => (prev === achievementsData[currentLocale].length - 1 ? 0 : prev + 1))
  }

  // Interactive Phone Mockup States
  const [tvlValue, setTvlValue] = useState(45)
  const [drawdownPercent, setDrawdownPercent] = useState(70)
  const [allocationValue, setAllocationValue] = useState(30)
  
  // 3D Perspective Tilt States
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [shineX, setShineX] = useState(50)
  const [shineY, setShineY] = useState(50)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setRotateX(-y / (rect.height / 10)) // Max 10 deg tilt
    setRotateY(x / (rect.width / 10))
    setShineX(((e.clientX - rect.left) / rect.width) * 100)
    setShineY(((e.clientY - rect.top) / rect.height) * 100)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setShineX(50)
    setShineY(50)
  }

  // Smooth scroll handlers
  const scrollToProcess = (e: React.MouseEvent) => {
    e.preventDefault()
    processRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const scrollToAchievements = (e: React.MouseEvent) => {
    e.preventDefault()
    achievementsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const scrollToTeam = (e: React.MouseEvent) => {
    e.preventDefault()
    teamRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const scrollToFooter = (e?: React.MouseEvent) => {
    e?.preventDefault()
    footerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Contact dropdown control (hover + focus friendly)
  

  // Footer contact form state
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [contactSubmitted, setContactSubmitted] = useState(false)

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: integrate real API endpoint
    setContactSubmitted(true)
    setContactName("")
    setContactEmail("")
    setContactMessage("")
    setTimeout(() => setContactSubmitted(false), 6000)
  }

  const partners = [
    {
      id: "fasanara",
      name: "Fasanara Digital",
      logo: FasanaraLogo,
      category: "Asset Management",
      badges: ["USDC", strings.variableRate],
      description: "Receivables finance and liquidity provision for digital asset ecosystem and institutional players.",
      stats: {
        tvl: "$45m",
        apy: "11.2%",
        redemptions: strings.weekly
      }
    },
    {
      id: "falconx",
      name: "FalconX",
      logo: FalconLogo,
      category: "Prime Brokerage",
      badges: ["USDC / USDT", strings.fixedRate],
      description: "Institutional credit lines for market making, arbitrage, and treasury management solutions.",
      stats: {
        tvl: "$60m",
        apy: strings.hidden,
        redemptions: strings.daily
      }
    },
    {
      id: "bastion",
      name: "Bastion Trading",
      logo: BastionLogo,
      category: "Market Making",
      badges: ["USDT", strings.fixedRate],
      description: "Fixed rate loan channeling funds into derivatives trading and market-making strategies.",
      stats: {
        tvl: "$30m",
        apy: strings.hidden,
        redemptions: strings.monthly
      }
    }
  ]

  const activePartner = partners[activeIndex]

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden flex flex-col justify-between selection:bg-accent/20">
      
      <SiteHeader onProcess={scrollToProcess} onAchievements={scrollToAchievements} onTeam={scrollToTeam} onContact={scrollToFooter} />

      {/* Main Container */}
      <div className="w-full flex-1 flex flex-col">
        
        {/* Hero Section Container (Spans full screen width to allow waves to go 100vw, height is restricted to hero only) */}
        <section className="relative w-full min-h-[calc(100vh-76px)] flex flex-col items-center overflow-hidden">
          {/* Symmetrical Animated Waves Canvas (Full screen width, absolute inside hero) */}
          <GuillocheWaves activeIndex={activeIndex} />

          {/* Centered Content Wrapper (Restricted max-w-4xl width) */}
          <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-between pt-10 pb-4 px-4">
            
            {/* Title and Description */}
            <div className="text-center px-4 flex flex-col items-center mb-6 max-w-3xl">
              <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.15] mb-4 tracking-tight">
                {strings.heroTitle}
              </h1>
              <p className="font-sans text-xs md:text-sm text-muted-foreground/85 leading-relaxed max-w-2xl">
                {strings.heroSubtitle}
              </p>
            </div>

            {/* Interactive Mockup: phone on small screens, laptop on large screens */}
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

            {/* Tab Controls (Below the card) */}
            <div className="flex flex-wrap justify-center gap-2 mb-4 relative z-20">
              {partners.map((partner, index) => {
                const isActive = index === activeIndex
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
                )
              })}
            </div>

            {/* Bouncing Scroll Indicator Arrow (To see our solution) */}
            <motion.button
              onClick={scrollToProcess}
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="relative z-20 mt-2 mb-2 text-muted-foreground/60 hover:text-accent cursor-pointer flex flex-col items-center gap-0.5 text-[9px] font-mono tracking-widest font-bold uppercase transition-colors select-none outline-none border-none bg-transparent"
            >
              <span>{strings.ourSolution}</span>
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>
        </section>

        {/* Process Flow Section (How it works - waves do not cover this section) */}
        <section 
          ref={processRef}
          className="w-full py-16 px-6 max-w-6xl mx-auto border-t border-border/10 relative z-20 scroll-mt-20"
        >
          <div className="text-center mb-12">
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              {strings.processTitle}
            </h2>
            <p className="font-sans text-sm md:text-base text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed">
              {strings.processSubtitle}
            </p>
          </div>

          {/* Interactive 4-step workflow */}
          <InteractiveFlow />
        </section>

        {/* Achievements Section */}
        <section ref={achievementsRef} className="w-full py-16 px-6 max-w-5xl mx-auto border-t border-border/10 relative z-20 scroll-mt-20">
          <div className="text-center mb-8">
            <h2 className="font-mono text-xs tracking-widest text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-2">
              {currentLocale === "vi" ? "THÀNH TỰU NỔI BẬT" : "RECOGNITIONS"}
            </h2>
            <h3 className="font-sans text-3xl font-extrabold text-foreground tracking-tight">
              {strings.achievementsTitle}
            </h3>
          </div>

          <div className="relative w-full flex items-center justify-between min-h-[220px] md:min-h-[260px] bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-lg overflow-hidden backdrop-blur-md">
            
            {/* Laurel Wreath SVG Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
              <svg viewBox="0 0 600 300" className="w-full max-w-[550px] h-auto text-amber-500/10 dark:text-amber-500/5 transition-colors duration-300" fill="currentColor">
                {/* Left Side */}
                <g transform="translate(190, 150)">
                  <path d="M 0,80 C -50,70 -80,20 -60,-40" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M -60,-40 C -70,-50 -65,-65 -50,-60 C -45,-45 -50,-35 -60,-40" />
                  <path d="M -50,-20 C -65,-28 -70,-42 -55,-45 C -45,-35 -40,-25 -50,-20" />
                  <path d="M -62,-15 C -75,-12 -80,-25 -68,-32 C -58,-28 -55,-18 -62,-15" />
                  <path d="M -38,5 C -52,-3 -55,-18 -42,-20 C -32,-12 -28,-2 -38,5" />
                  <path d="M -54,12 C -68,18 -70,2 -58,-2 C -48,0 -45,10 -54,12" />
                  <path d="M -23,30 C -35,25 -38,10 -26,8 C -16,15 -13,25 -23,30" />
                  <path d="M -40,40 C -52,50 -55,35 -42,30 C -32,32 -30,42 -40,40" />
                  <path d="M -6,52 C -16,50 -18,35 -6,30 C 3,35 5,48 -6,52" />
                  <path d="M -20,62 C -30,75 -35,60 -22,52 C -12,52 -10,62 -20,62" />
                </g>
                {/* Right Side */}
                <g transform="translate(410, 150) scale(-1, 1)">
                  <path d="M 0,80 C -50,70 -80,20 -60,-40" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M -60,-40 C -70,-50 -65,-65 -50,-60 C -45,-45 -50,-35 -60,-40" />
                  <path d="M -50,-20 C -65,-28 -70,-42 -55,-45 C -45,-35 -40,-25 -50,-20" />
                  <path d="M -62,-15 C -75,-12 -80,-25 -68,-32 C -58,-28 -55,-18 -62,-15" />
                  <path d="M -38,5 C -52,-3 -55,-18 -42,-20 C -32,-12 -28,-2 -38,5" />
                  <path d="M -54,12 C -68,18 -70,2 -58,-2 C -48,0 -45,10 -54,12" />
                  <path d="M -23,30 C -35,25 -38,10 -26,8 C -16,15 -13,25 -23,30" />
                  <path d="M -40,40 C -52,50 -55,35 -42,30 C -32,32 -30,42 -40,40" />
                  <path d="M -6,52 C -16,50 -18,35 -6,30 C 3,35 5,48 -6,52" />
                  <path d="M -20,62 C -30,75 -35,60 -22,52 C -12,52 -10,62 -20,62" />
                </g>
              </svg>
            </div>

            {/* Left navigation arrow button */}
            <button
              onClick={handlePrevAchievement}
              className="w-10 h-10 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105 active:scale-95 z-20 shrink-0 mr-2 md:mr-4"
              aria-label="Previous Achievement"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* Centered Achievement Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center z-10 px-2 md:px-12">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeAchievement}
                  custom={direction}
                  variants={{
                    initial: (dir: "left" | "right") => ({
                      opacity: 0,
                      x: dir === "right" ? 60 : -60
                    }),
                    animate: {
                      opacity: 1,
                      x: 0
                    },
                    exit: (dir: "left" | "right") => ({
                      opacity: 0,
                      x: dir === "right" ? -60 : 60
                    })
                  }}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="flex flex-col items-center"
                >
                  <h4 className="font-sans text-base md:text-2xl font-extrabold text-foreground leading-snug max-w-2xl mb-2 md:mb-4">
                    {achievementsData[currentLocale][activeAchievement].title}
                  </h4>
                  <p className="font-sans text-[10px] md:text-sm text-muted-foreground/80 leading-relaxed font-semibold max-w-xl">
                    {achievementsData[currentLocale][activeAchievement].subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right navigation arrow button */}
            <button
              onClick={handleNextAchievement}
              className="w-10 h-10 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105 active:scale-95 z-20 shrink-0 ml-2 md:ml-4"
              aria-label="Next Achievement"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Meet Our Team Section */}
        <section ref={teamRef} className="w-full py-16 px-6 max-w-6xl mx-auto border-t border-border/10 relative z-20 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="font-mono text-xs tracking-widest text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-2">
              {currentLocale === "vi" ? "ĐỘI NGŨ SÁNG LẬP" : "LEADERSHIP"}
            </h2>
            <h3 className="font-sans text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              {strings.teamTitle}
            </h3>
            <p className="font-sans text-sm md:text-base text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed">
              {strings.teamSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Team Member 1: Huy Pham */}
            <div className="flex flex-col bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-lg backdrop-blur-md hover:scale-[1.01] transition-transform duration-300">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                <img 
                  src="/images/huy.png" 
                  alt="Huy Pham" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-sans font-bold text-lg text-foreground">
                  Huy Pham
                </h4>
                <a 
                  href="https://www.linkedin.com/in/huy-pham-5646bb49/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-emerald-600 transition-colors"
                  aria-label="Huy Pham's LinkedIn"
                >
                  <LinkedInIcon className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wider">
                {strings.teamCfo}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans font-medium">
                {currentLocale === "vi" 
                  ? "Huy dẫn dắt kỷ luật tài chính và giám sát chiến lược của FundLok, giúp định hình một nền tảng được xây dựng trên cấu trúc vững chắc, uy tín và tăng trưởng bền vững. Tầm nhìn của anh hỗ trợ cam kết của FundLok đối với nền tảng tài chính mạnh mẽ và khả năng phục hồi dài hạn."
                  : "Huy leads FundLok's financial discipline and strategic oversight, helping shape a platform built for sound structure, credibility, and sustainable growth. His perspective supports FundLok's commitment to strong financial foundations and long-term resilience."
                }
              </p>
            </div>

            {/* Team Member 2: Loc Vuong */}
            <div className="flex flex-col bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-lg backdrop-blur-md hover:scale-[1.01] transition-transform duration-300">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                <img 
                  src="/images/loc.png" 
                  alt="Loc Vuong" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-sans font-bold text-lg text-foreground">
                  Loc Vuong
                </h4>
                <a 
                  href="https://www.linkedin.com/in/lok-vuong/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-emerald-600 transition-colors"
                  aria-label="Loc Vuong's LinkedIn"
                >
                  <LinkedInIcon className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wider">
                {strings.teamCeo}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans font-medium">
                {currentLocale === "vi"
                  ? "Lộc lớn lên trong môi trường doanh nghiệp vừa và nhỏ và hiểu rõ những thách thức tài chính mà nhiều doanh nghiệp phải đối mặt. Anh thành lập FundLok để xây dựng nền tảng vốn linh hoạt và minh bạch hơn, được thiết kế xoay quanh dòng tiền thực tế, tốc độ tăng trưởng và khả năng hoàn trả của doanh nghiệp để mọi doanh nghiệp đều có thể tiếp cận vốn và bất kỳ ai cũng có thể là nhà đầu tư."
                  : "Loc grew up in an SME environment and understands firsthand the funding challenges many businesses face. He founded FundLok to build a more flexible and transparent capital platform designed around real business cash flow, growth pace, and repayment capacity so that everyone can access fundings, and anyone can be an investor."
                }
              </p>
            </div>

            {/* Team Member 3: Edward Wong */}
            <div className="flex flex-col bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-lg backdrop-blur-md hover:scale-[1.01] transition-transform duration-300">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                <img 
                  src="/images/edward.png" 
                  alt="Edward Wong" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-sans font-bold text-lg text-foreground">
                  Edward Wong
                </h4>
                <a 
                  href="https://www.linkedin.com/in/eywong8/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-emerald-600 transition-colors"
                  aria-label="Edward Wong's LinkedIn"
                >
                  <LinkedInIcon className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wider">
                {strings.teamCto}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans font-medium">
                {currentLocale === "vi"
                  ? "Edward dẫn dắt kiến trúc công nghệ của FundLok, với kiến thức sâu rộng về ngành fintech và tập trung mạnh mẽ vào tự động hóa, thiết kế hệ thống và cơ sở hạ tầng thông minh. Là một Chuyên gia Trí tuệ Nhân tạo Tác nhân (Agentic AI) được chứng nhận bởi NVIDIA, anh giúp định hình lớp công nghệ giúp FundLok có quy mô lớn, an toàn và hiệu quả."
                  : "Edward leads FundLok's technology architecture, with deep knowledge of the fintech industry and a strong focus on automation, system design, and intelligent infrastructure. As an NVIDIA-certified Agentic AI Professional, he helps shape the technology layer that makes FundLok scalable, secure, and efficient."
                }
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer ref={footerRef} className="w-full bg-background/30 border-t border-border/10 py-12 relative z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold mb-2">Contact Us</h4>
              <form onSubmit={handleContactSubmit} className="space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-md border border-border/40 px-3 py-2 text-sm bg-transparent"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-md border border-border/40 px-3 py-2 text-sm bg-transparent"
                  required
                />
                <textarea
                  placeholder="Message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full rounded-md border border-border/40 px-3 py-2 text-sm bg-transparent resize-none h-24"
                  required
                />
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-semibold"
                  >
                    Send
                  </button>
                  {contactSubmitted && (
                    <span className="text-sm text-emerald-500">Thanks — we'll get back to you soon.</span>
                  )}
                </div>
              </form>
            </div>

            <div>
              <h4 className="font-bold mb-2">FAQ</h4>
              <p className="text-sm text-muted-foreground">Visit our FAQ page for common questions.</p>
              <Link href="/faq" className="text-sm text-emerald-600 hover:underline mt-2 inline-block">Open FAQ</Link>
            </div>

            <div>
              <h4 className="font-bold mb-2">Address</h4>
              <p className="text-sm text-muted-foreground">Trương Định / 123 Võ Thị Sáu, Xuân Hòa, Hồ Chí Minh</p>
              <div className="mt-3 w-full h-48 rounded-md overflow-hidden border border-border/40">
                <iframe
                  title="FundLok Location"
                  src={`https://www.google.com/maps?q=${encodeURIComponent("Trương Định/123 Võ Thị Sáu, Xuân Hòa, Hồ Chí Minh")}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="py-6 text-center text-[10px] text-muted-foreground/50 font-sans">
            {t("common.copyright")}
          </div>
        </div>
      </footer>
    </div>
  )
}
