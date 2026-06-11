import type { Metadata } from "next";
import { cookies } from "next/headers";
import SiteHeader from "@/components/site-header";
import { SectionLocator } from "@/components/section-locator";
import SiteFooter from "@/components/site-footer";
import { HeroInteractive } from "@/components/hero-interactive";
import { InteractiveFlow } from "@/components/interactive-flow";
import { AchievementsCarousel } from "@/components/achievements-carousel";

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

export const metadata: Metadata = {
  title: "FundLok | Flexible Capital Platform for SMEs",
  description:
    "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
  keywords: [
    "FundLok",
    "SME funding",
    "private credit",
    "flexible capital",
    "on-chain credit",
    "investor portal",
    "flexible funding",
    "AI credit scoring",
    "Loc Vuong",
    "Huy Pham",
    "Edward Wong",
    "FundLok CEO",
    "FundLok CFO",
    "FundLok CTO",
    "FundLok founding team",
    "FundLok founders",
    "Sustainability in Action 2024",
    "Australian Government",
    "SIHUB 2025",
    "Startup and Innovation Hub Ho Chi Minh City",
    "International Blockchain Olympiad 2023",
    "IBCOL 2023",
    "LENDMI",
  ],
  openGraph: {
    title: "FundLok | Flexible Capital Platform for SMEs",
    description:
      "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
    type: "website",
    siteName: "FundLok",
  },
  twitter: {
    card: "summary_large_image",
    title: "FundLok | Flexible Capital Platform for SMEs",
    description:
      "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
  },
};

export default async function Page() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = cookieValue === "vi" ? "vi" : "en";
  const currentLocale = locale;
  const strings = dict[currentLocale];

  return (
    <>
      <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden flex flex-col justify-between selection:bg-accent/20">
        <SiteHeader />

        {/* Right-edge scroll-spy rail showing the section currently in view */}
        <SectionLocator />

        {/* Main Container */}
        <div className="w-full flex-1 flex flex-col">
          {/* Hero Section Container */}
          <section
            id="hero"
            className="relative w-full min-h-[calc(100vh-76px)] flex flex-col items-center overflow-hidden scroll-mt-20"
          >
            {/* Client interactive GUI logic (waves + mockup + animated headers) */}
            <HeroInteractive strings={strings} />
          </section>

          {/* Process Flow Section */}
          <section
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

            <InteractiveFlow />
          </section>

          {/* Achievements Section */}
          <section
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

            <AchievementsCarousel
              achievements={achievementsData[currentLocale]}
              currentLocale={currentLocale}
            />
          </section>

          {/* Meet Our Team Section */}
          <section
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
      </div>
    </>
  );
}
