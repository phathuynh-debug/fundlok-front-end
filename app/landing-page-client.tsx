"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Maximize2,
  X,
} from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { GuillocheWaves } from "@/components/guilloche-waves";
import SiteHeader from "@/components/site-header";
import Mockup from "@/components/mockup";
import { InteractiveFlow } from "@/components/interactive-flow";
import SiteFooter from "@/components/site-footer";

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

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    {...props}
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

// Multilingual dictionary for static landing page assets
const dict = {
  en: {
    heroTitle: "Flexible Capital for MSMEs",
    heroSubtitle:
      "FundLok helps MSMEs access financing with repayment aligned to actual revenue, supported by data, AI, and transparent on-chain investor infrastructure.",
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
    processSubtitle:
      "FundLok is designed to make funding more flexible for SMEs and more transparent for investors — combining a customer-friendly experience with automation, data-driven assessment, secure fund handling, and clear repayment tracking.",
    ourSolution: "Our Solution",
    achievementsTitle: "FundLok's Achievements",
    achievementsSubtitle:
      "Recognized locally and globally for innovation, impact, and technology in FinTech and investment facilitation.",
    teamTitle: "Meet Our Team",
    teamSubtitle:
      "The builders and visionaries behind FundLok's technology, financial structuring, and growth.",
    teamCfo: "Chief Financial Officer",
    teamCeo: "Founder & Chief Executive Officer",
    teamCto: "Chief Technological Officer",
  },
  vi: {
    heroTitle: "Sàn vốn linh hoạt cho doanh nghiệp vừa và nhỏ",
    heroSubtitle:
      "FundLok giúp các doanh nghiệp vừa và nhỏ tiếp cận vốn vay với việc trả nợ được điều chỉnh theo doanh thu thực tế, được hỗ trợ bởi dữ liệu, AI và hạ tầng nhà đầu tư minh bạch trên chuỗi.",
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
    processSubtitle:
      "FundLok được thiết kế để giúp việc gọi vốn linh hoạt hơn cho doanh nghiệp SME và minh bạch hơn cho nhà đầu tư — kết hợp trải nghiệm thân thiện với khách hàng cùng quy trình tự động hóa, thẩm định bằng dữ liệu, quản lý quỹ an toàn và theo dõi hoàn trả rõ ràng.",
    ourSolution: "Giải pháp của chúng tôi",
    achievementsTitle: "Thành tựu của FundLok",
    achievementsSubtitle:
      "Được ghi nhận trong nước và quốc tế vì sự đổi mới sáng tạo, tầm ảnh hưởng và công nghệ trong lĩnh vực FinTech và thúc đẩy đầu tư.",
    teamTitle: "Đội ngũ sáng lập",
    teamSubtitle:
      "Những người xây dựng và kiến tạo đằng sau công nghệ, cấu trúc tài chính và sự tăng trưởng của FundLok.",
    teamCfo: "Giám đốc Tài chính (CFO)",
    teamCeo: "Nhà sáng lập & Giám đốc Điều hành (CEO)",
    teamCto: "Giám đốc Công nghệ (CTO)",
  },
};

export function LandingPageClient() {
  const { t, locale } = useTranslations();
  const currentLocale = (locale === "vi" ? "vi" : "en") as "en" | "vi";
  const strings = dict[currentLocale];

  const [activeIndex, _setActiveIndex] = useState(2); // Defaults to Bastion Trading (index 2)
  const processRef = useRef<HTMLDivElement>(null);
  const achievementsRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  const [activeAchievement, setActiveAchievement] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const achievementsData = {
    en: [
      {
        title: "Top 3 Project to Facilitate Investments",
        subtitle: "Sustainability in Action 2024 - Australian Government",
        category: "Government Recognition",
        description:
          "FundLok was recognized as a top-3 fintech project by the Australian Government for facilitating sustainable cross-border investments and ESG-aligned SME funding.",
        images: ["/achivements/sustainability-action-2.png"],
      },
      {
        title: "Seed Stage Start-up Incubation in FinTech Industry 2025",
        subtitle: "Startup and Innovation Hub Ho Chi Minh City (SIHUB)",
        category: "Incubation & Acceleration",
        description:
          "Selected for the premium incubation program by SIHUB, receiving strategic mentorship, regulatory sandbox guidance, and network access to top regional venture capitals.",
        images: [
          "/achivements/sustainability-action-1.png",
          "/achivements/sihub-announcement.png",
          "/achivements/sihub-pitching-1.png",
          "/achivements/sihub-pitching-2.png",
        ],
      },
      {
        title: "Top 10 Potential Project Global",
        subtitle: "International Blockchain Olympiad 2023",
        category: "Global Innovation",
        description:
          "Representing Vietnam (under the project name LENDMI), FundLok won a top-10 global spot for pioneering blockchain-based credit scoring and secure liquidity pooling for emerging markets.",
        images: ["/achivements/ibcol-certificate.png"],
        pdf: "/achivements/ibcol-certificate.pdf",
      },
    ],
    vi: [
      {
        title: "Top 3 Dự án Thúc đẩy Đầu tư",
        subtitle: "Sustainability in Action 2024 - Chính phủ Úc",
        category: "Ghi nhận từ Chính phủ",
        description:
          "FundLok được ghi nhận là một trong 3 dự án FinTech xuất sắc nhất bởi Chính phủ Úc trong việc thúc đẩy đầu tư bền vững và hỗ trợ vốn SME theo tiêu chuẩn ESG.",
        images: ["/achivements/sustainability-action-2.png"],
      },
      {
        title: "Ươm tạo Khởi nghiệp Giai đoạn Hạt giống ngành FinTech 2025",
        subtitle: "Trung tâm Khởi nghiệp và Đổi mới sáng tạo TP.HCM (SIHUB)",
        category: "Ươm tạo & Tăng tốc",
        description:
          "Được lựa chọn tham gia chương trình ươm tạo cao cấp của SIHUB, nhận hỗ trợ tư vấn chiến lược, hướng dẫn thử nghiệm pháp lý (sandbox) và tiếp cận mạng lưới quỹ đầu tư mạo hiểm hàng đầu khu vực.",
        images: [
          "/achivements/sustainability-action-1.png",
          "/achivements/sihub-announcement.png",
          "/achivements/sihub-pitching-1.png",
          "/achivements/sihub-pitching-2.png",
        ],
      },
      {
        title: "Top 10 Dự án Tiềm năng Toàn cầu",
        subtitle: "Thế vận hội Blockchain Quốc tế 2023 (IBCOL)",
        category: "Sáng tạo Toàn cầu",
        description:
          "Đại diện cho Việt Nam (dưới tên dự án LENDMI), FundLok đã giành vị trí top 10 toàn cầu nhờ tiên phong trong việc chấm điểm tín dụng dựa trên blockchain và tối ưu hóa bể thanh khoản an toàn cho thị trường mới nổi.",
        images: ["/achivements/ibcol-certificate.png"],
        pdf: "/achivements/ibcol-certificate.pdf",
      },
    ],
  };

  // Auto-reset activeImageIndex when activeAchievement changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeAchievement]);

  // Handle keyboard events (Escape key) for the lightbox modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePrevAchievement = () => {
    setDirection("left");
    setActiveAchievement((prev) =>
      prev === 0 ? achievementsData[currentLocale].length - 1 : prev - 1,
    );
  };

  const handleNextAchievement = () => {
    setDirection("right");
    setActiveAchievement((prev) =>
      prev === achievementsData[currentLocale].length - 1 ? 0 : prev + 1,
    );
  };

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

  // Smooth scroll handlers
  const scrollToProcess = (e: React.MouseEvent) => {
    e.preventDefault();
    processRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToAchievements = (e: React.MouseEvent) => {
    e.preventDefault();
    achievementsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToTeam = (e: React.MouseEvent) => {
    e.preventDefault();
    teamRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden flex flex-col justify-between selection:bg-accent/20">
      <SiteHeader
        onProcess={scrollToProcess}
        onAchievements={scrollToAchievements}
        onTeam={scrollToTeam}
      />

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
            {/* <div className="flex flex-wrap justify-center gap-2 mb-4 relative z-20">
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
            </div> */}

            {/* Bouncing Scroll Indicator Arrow (To see our solution) */}
            <motion.button
              onClick={scrollToProcess}
              animate={{ y: [0, 6, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut",
              }}
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
          id="process"
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
        {/* Achievements Section */}
        <section
          ref={achievementsRef}
          id="achievements"
          className="w-full py-16 px-6 max-w-6xl mx-auto border-t border-border/10 relative z-20 scroll-mt-20"
        >
          <div className="text-center mb-10">
            <h2 className="font-mono text-xs tracking-widest text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-2">
              {currentLocale === "vi" ? "THÀNH TỰU NỔI BẬT" : "RECOGNITIONS"}
            </h2>
            <h3 className="font-sans text-3xl font-extrabold text-foreground tracking-tight">
              {strings.achievementsTitle}
            </h3>
            <p className="font-sans text-sm text-muted-foreground/80 max-w-2xl mx-auto mt-2">
              {strings.achievementsSubtitle}
            </p>
          </div>

          <div className="relative w-full flex items-center bg-white/40 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-3 md:p-4 shadow-xl backdrop-blur-md overflow-hidden min-h-96 sm:min-h-112 lg:h-88">
            {/* Left navigation arrow button */}
            <button
              onClick={handlePrevAchievement}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 z-30 invisible md:visible"
              aria-label="Previous Achievement"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* Main Content Area */}
            <div className="w-full px-2 md:px-6 py-1 md:py-2">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeAchievement}
                  custom={direction}
                  variants={{
                    initial: (dir: "left" | "right") => ({
                      opacity: 0,
                      x: dir === "right" ? 50 : -50,
                    }),
                    animate: {
                      opacity: 1,
                      x: 0,
                    },
                    exit: (dir: "left" | "right") => ({
                      opacity: 0,
                      x: dir === "right" ? -50 : 50,
                    }),
                  }}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                >
                  {/* Left Column: Image Showcase (lg:col-span-5) */}
                  <div className="lg:col-span-5 flex flex-col items-center gap-2 w-full">
                    {achievementsData[currentLocale][activeAchievement].images
                      .length > 0 ? (
                      <>
                        {/* Active Image Container */}
                        <div
                          className="relative w-full max-w-md mx-auto aspect-4/3 rounded-2xl overflow-hidden border border-border/10 shadow-md group cursor-zoom-in bg-slate-950/5 dark:bg-white/5 flex items-center justify-center"
                          onClick={() =>
                            setLightboxImage(
                              achievementsData[currentLocale][activeAchievement]
                                .images[activeImageIndex],
                            )
                          }
                        >
                          <Image
                            src={
                              achievementsData[currentLocale][activeAchievement]
                                .images[activeImageIndex]
                            }
                            alt={
                              achievementsData[currentLocale][activeAchievement]
                                .title
                            }
                            fill
                            className={`object-cover transition-transform duration-500 ${
                              achievementsData[currentLocale][
                                activeAchievement
                              ].images[activeImageIndex]?.includes(
                                "sustainability-action-2",
                              )
                                ? "rotate-270 scale-[1.33] group-hover:scale-[1.40]"
                                : "group-hover:scale-105"
                            }`}
                            sizes="(max-width: 1024px) 100vw, 400px"
                          />
                          {/* Zoom Indicator */}
                          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/25">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        {/* Thumbnail Indicators (only shown if there are multiple images) */}
                        {achievementsData[currentLocale][activeAchievement]
                          .images.length > 1 && (
                          <div className="flex gap-1.5">
                            {achievementsData[currentLocale][
                              activeAchievement
                            ].images.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                  activeImageIndex === idx
                                    ? "border-emerald-500 scale-105 shadow-sm"
                                    : "border-transparent opacity-60 hover:opacity-100 hover:scale-102"
                                }`}
                              >
                                <Image
                                  src={img}
                                  alt="Thumbnail"
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* Fallback Certificate Placeholder when no images are present */
                      <div className="w-full max-w-md mx-auto aspect-4/3 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center p-4 text-center group transition-colors duration-300 hover:bg-emerald-500/5 hover:border-emerald-500/30">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                          <FileText className="w-8 h-8" />
                        </div>
                        <h5 className="font-sans font-extrabold text-sm text-foreground mb-1">
                          {currentLocale === "vi"
                            ? "Chương trình Toàn cầu"
                            : "Global Program"}
                        </h5>
                        <p className="font-sans text-xs text-muted-foreground max-w-50 leading-relaxed mb-2">
                          {currentLocale === "vi"
                            ? "Xem tài liệu chứng nhận chính thức của thế vận hội"
                            : "View the official olympiad verification document"}
                        </p>
                        {achievementsData[currentLocale][activeAchievement]
                          .pdf && (
                          <a
                            href={
                              achievementsData[currentLocale][activeAchievement]
                                .pdf
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-500 hover:text-white transition-all duration-300 font-mono text-[10px] font-bold uppercase tracking-wider"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {currentLocale === "vi" ? "Mở PDF" : "Open PDF"}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Text & Metadata Content (lg:col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col justify-center text-left lg:pl-4">
                    {/* Category tag */}
                    <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase w-fit mb-3">
                      {
                        achievementsData[currentLocale][activeAchievement]
                          .category
                      }
                    </div>

                    {/* Title */}
                    <h4 className="font-sans text-xl md:text-2xl font-extrabold text-foreground leading-snug tracking-tight mb-1.5">
                      {achievementsData[currentLocale][activeAchievement].title}
                    </h4>

                    {/* Subtitle / Organisation */}
                    <p className="font-sans text-xs md:text-sm text-amber-600 dark:text-amber-500 font-bold tracking-wide mb-3">
                      {
                        achievementsData[currentLocale][activeAchievement]
                          .subtitle
                      }
                    </p>

                    {/* Paragraph Description */}
                    <p className="font-sans text-sm text-muted-foreground/90 leading-relaxed mb-4">
                      {
                        achievementsData[currentLocale][activeAchievement]
                          .description
                      }
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2.5">
                      {/* View PDF Certificate Button if available */}
                      {achievementsData[currentLocale][activeAchievement]
                        .pdf && (
                        <a
                          href={
                            achievementsData[currentLocale][activeAchievement]
                              .pdf
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-mono tracking-widest font-bold uppercase transition-all duration-300 shadow-md hover:shadow-emerald-500/15"
                        >
                          <FileText className="w-4 h-4" />
                          {currentLocale === "vi"
                            ? "XEM CHỨNG NHẬN"
                            : "VIEW CERTIFICATE"}
                        </a>
                      )}

                      {/* Enlarge Photo Button - Only render if images exist */}
                      {achievementsData[currentLocale][activeAchievement].images
                        .length > 0 && (
                        <button
                          onClick={() =>
                            setLightboxImage(
                              achievementsData[currentLocale][activeAchievement]
                                .images[activeImageIndex],
                            )
                          }
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-slate-900/50 hover:bg-zinc-100 dark:hover:bg-slate-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono tracking-widest font-bold uppercase transition-all duration-300"
                        >
                          <Maximize2 className="w-4 h-4" />
                          {currentLocale === "vi"
                            ? "PHÓNG TO ẢNH"
                            : "ENLARGE PHOTO"}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right navigation arrow button */}
            <button
              onClick={handleNextAchievement}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 z-30 invisible md:visible"
              aria-label="Next Achievement"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Mobile Navigation controls */}
          <div className="flex items-center justify-center gap-6 mt-6 md:hidden">
            <button
              onClick={handlePrevAchievement}
              className="w-10 h-10 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-all duration-300"
              aria-label="Previous Achievement"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <span className="font-mono text-xs font-bold text-zinc-500">
              {activeAchievement + 1} / {achievementsData[currentLocale].length}
            </span>
            <button
              onClick={handleNextAchievement}
              className="w-10 h-10 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-all duration-300"
              aria-label="Next Achievement"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Meet Our Team Section */}
        <section
          ref={teamRef}
          id="team"
          className="w-full py-16 px-6 max-w-6xl mx-auto border-t border-border/10 relative z-20 scroll-mt-20"
        >
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
                  : "Huy leads FundLok's financial discipline and strategic oversight, helping shape a platform built for sound structure, credibility, and sustainable growth. His perspective supports FundLok's commitment to strong financial foundations and long-term resilience."}
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
                  : "Loc grew up in an SME environment and understands firsthand the funding challenges many businesses face. He founded FundLok to build a more flexible and transparent capital platform designed around real business cash flow, growth pace, and repayment capacity so that everyone can access fundings, and anyone can be an investor."}
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
                  : "Edward leads FundLok's technology architecture, with deep knowledge of the fintech industry and a strong focus on automation, system design, and intelligent infrastructure. As an NVIDIA-certified Agentic AI Professional, he helps shape the technology layer that makes FundLok scalable, secure, and efficient."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />

      {/* Lightbox Modal for Enlarge Photo */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
            onClick={() => setLightboxImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all outline-none border border-white/15"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Image Wrapper */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full max-w-full max-h-full aspect-4/3 lg:aspect-auto">
                <Image
                  src={lightboxImage}
                  alt="Enlarged Achievement Photo"
                  fill
                  className={`object-contain transition-transform duration-300 ${
                    lightboxImage.includes("sustainability-action")
                      ? "rotate-270 scale-[0.75]"
                      : ""
                  }`}
                  sizes="100vw"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
