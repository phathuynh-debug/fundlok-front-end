import type { Metadata } from "next";

import { getSeoStrings, OG_LOCALE } from "@/lib/seo";
import { cookies } from "next/headers";
import SiteHeader from "@/components/site-header";
import { SectionLocator } from "@/components/section-locator";
import SiteFooter from "@/components/site-footer";
import { HeroInteractive } from "@/components/hero-interactive";
import { InteractiveFlow } from "@/components/interactive-flow";

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
    heroTitle: "Flexible capital for MSMEs in Vietnam",
    heroSubtitle:
      "FundLok is a flexible funding platform connecting SMEs in Vietnam with investors. Businesses repay a fixed amount each working day. If verified revenue dips, the term can be extended to lower the daily payment, with interest on the extra time at the rate agreed at signing.",
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
    processTitle: "A clearer, technology-enabled way to get funded",
    processSubtitle:
      "FundLok makes funding more flexible for SMEs and more transparent for investors. Automation, data-driven assessment, secure fund handling and clear repayment tracking do the heavy lifting, so the experience stays simple.",
    ourSolution: "Our Solution",
    partnersEyebrow: "BACKED BY",
    partnersTitle: "Partners & programs",
    partnersSubtitle:
      "FundLok is supported by leading startup programs providing cloud infrastructure, mentorship, and ecosystem access.",
    partnersStrategic: "Strategic partner",
    partnersInfra: "Cloud infrastructure partners",
    achievementsTitle: "FundLok's Achievements",
    achievementsSubtitle:
      "Recognized locally and globally for innovation, impact, and technology in FinTech and investment facilitation.",
    teamTitle: "Meet the team",
    teamSubtitle:
      "The builders and visionaries behind FundLok's technology, financial structuring, and growth.",
    teamCfo: "Chief Financial Officer",
    linkedInOf: "{name} on LinkedIn",
    teamCeo: "Founder & Chief Executive Officer",
    teamCto: "Chief Technological Officer",
  },
  vi: {
    heroTitle: "Sàn vốn linh hoạt cho doanh nghiệp vừa và nhỏ tại Việt Nam",
    heroSubtitle:
      "FundLok là nền tảng vốn linh hoạt kết nối doanh nghiệp vừa và nhỏ tại Việt Nam với nhà đầu tư. Doanh nghiệp trả một khoản cố định mỗi ngày làm việc. Nếu doanh thu đã xác minh giảm, thời hạn có thể được kéo dài để giảm khoản trả hằng ngày, và lãi được tính cho phần thời gian kéo dài theo lãi suất đã thỏa thuận khi ký.",
    navProduct: "SẢN PHẨM",
    navProcess: "QUY TRÌNH",
    navContact: "LIÊN HỆ",
    navPartners: "ĐỐI TÁC",
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
    processTitle: "Vay vốn minh bạch hơn nhờ công nghệ",
    processSubtitle:
      "FundLok giúp doanh nghiệp SME gọi vốn linh hoạt hơn và giúp nhà đầu tư theo dõi minh bạch hơn. Tự động hóa, thẩm định dựa trên dữ liệu, quản lý dòng vốn an toàn và theo dõi hoàn trả rõ ràng lo phần phức tạp, để trải nghiệm luôn đơn giản.",
    ourSolution: "Giải pháp của chúng tôi",
    partnersEyebrow: "ĐỒNG HÀNH CÙNG",
    partnersTitle: "Đối tác & chương trình",
    partnersSubtitle:
      "FundLok được đồng hành bởi các chương trình khởi nghiệp hàng đầu, cung cấp hạ tầng đám mây, cố vấn và kết nối hệ sinh thái.",
    partnersStrategic: "Đối tác chiến lược",
    partnersInfra: "Đối tác hạ tầng đám mây",
    achievementsTitle: "Thành tựu của FundLok",
    achievementsSubtitle:
      "Được ghi nhận trong nước và quốc tế vì sự đổi mới sáng tạo, tầm ảnh hưởng và công nghệ trong lĩnh vực FinTech và thúc đẩy đầu tư.",
    teamTitle: "Đội ngũ sáng lập",
    teamSubtitle:
      "Những người xây dựng và kiến tạo đằng sau công nghệ, cấu trúc tài chính và sự tăng trưởng của FundLok.",
    teamCfo: "Giám đốc Tài chính (CFO)",
    linkedInOf: "LinkedIn của {name}",
    teamCeo: "Nhà sáng lập & Giám đốc Điều hành (CEO)",
    teamCto: "Giám đốc Công nghệ (CTO)",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const { locale, seo } = await getSeoStrings();

  return {
    alternates: { canonical: "/" },
    title: seo.homeTitle,
    description: seo.homeDescription,
    keywords: [
      "FundLok",
      "funding for SMEs in Vietnam",
      "SME funding Vietnam",
      "MSME funding Vietnam",
      "business funding Vietnam",
      "SME funding",
      "private credit",
      "flexible capital",
      "on-chain credit",
      "investor portal",
      "flexible funding",
      "Loc Vuong",
      "Huy Pham",
      "Edward Wong",
      "FundLok CEO",
      "FundLok CFO",
      "FundLok CTO",
      "FundLok founding team",
      "FundLok founders",
    ],
    openGraph: {
      title: seo.homeTitle,
      description: seo.homeOgDescription,
      type: "website",
      siteName: "FundLok",
      locale: OG_LOCALE[locale],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.homeTitle,
      description: seo.homeOgDescription,
    },
  };
}

export default async function Page() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("NEXT_LOCALE")?.value;
  // Same default as app/layout.tsx and lib/i18n: Vietnamese unless English was
  // explicitly chosen. This page builds its copy on the server, so it resolves
  // the cookie itself rather than reading the client context.
  const locale = cookieValue === "en" ? "en" : "vi";
  const currentLocale = locale;
  const strings = dict[currentLocale];

  // Sponsor-style partner tiers: each level renders as a labeled row of tiles.
  const partnerTiers = [
    {
      label: strings.partnersStrategic,
      logos: [
        {
          src: "/images/partners/sihub.webp",
          width: 500,
          height: 500,
          alt: "Startup and Innovation Hub of Ho Chi Minh City (SIHUB)",
          href: "https://www.sihub.gov.vn/",
          invertOnDark: false,
        },
      ],
    },
    {
      label: strings.partnersInfra,
      logos: [
        {
          src: "/images/partners/google-cloud-startups.webp",
          width: 500,
          height: 126,
          alt: "Google Cloud for Startups",
          href: "https://cloud.google.com/startup",
          invertOnDark: false,
        },
        {
          src: "/images/partners/cloudflare-startups.webp",
          width: 500,
          height: 145,
          alt: "Cloudflare for Startups",
          href: "https://www.cloudflare.com/forstartups/",
          invertOnDark: true,
        },
      ],
    },
  ];

  return (
    <>
      <div className="relative min-h-[100dvh] w-full bg-background text-foreground overflow-x-clip flex flex-col justify-between selection:bg-accent/20">
        <SiteHeader />

        {/* Right-edge scroll-spy rail showing the section currently in view */}
        <SectionLocator />

        {/* Main Container */}
        <div className="w-full flex-1 flex flex-col">
          {/* Hero Section Container */}
          <section
            id="hero"
            className="relative w-full min-h-[calc(100dvh-76px)] flex flex-col items-center overflow-hidden scroll-mt-20"
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
              <p className="font-sans text-sm md:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {strings.processSubtitle}
              </p>
            </div>

            <InteractiveFlow />
          </section>

          {/* Partners / Sponsors Section */}
          <section
            id="partners"
            className="w-full py-16 px-6 max-w-6xl mx-auto border-t border-border/10 relative z-20 scroll-mt-20"
          >
            <div className="text-center mb-10">
              <p className="eyebrow mb-2">{strings.partnersEyebrow}</p>
              <h2 className="font-sans text-3xl font-extrabold text-foreground tracking-tight">
                {strings.partnersTitle}
              </h2>
              <p className="font-sans text-sm text-muted-foreground max-w-2xl mx-auto mt-2">
                {strings.partnersSubtitle}
              </p>
            </div>

            {/* Sponsor-style tiers: each partnership level is a labeled row of
                uniform logo tiles. */}
            <div className="flex flex-col items-center gap-12">
              {partnerTiers.map((tier) => (
                <div
                  key={tier.label}
                  className="w-full flex flex-col items-center gap-6"
                >
                  <p className="eyebrow">{tier.label}</p>
                  <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6">
                    {tier.logos.map((logo) => (
                      <a
                        key={logo.src}
                        href={logo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={logo.alt}
                        className="group flex items-center justify-center rounded-2xl border border-border/40 bg-card/60 dark:bg-white/[0.04] shadow-sm p-6 h-28 w-52 md:h-32 md:w-60 hover:-translate-y-1 hover:shadow-md hover:border-emerald-500/30 transition-all duration-300"
                      >
                        <img
                          src={logo.src}
                          alt={logo.alt}
                          // Intrinsic dimensions so the row reserves its space
                          // before the logos load, instead of reflowing.
                          width={logo.width}
                          height={logo.height}
                          loading="lazy"
                          decoding="async"
                          className={`max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 ${
                            logo.invertOnDark
                              ? "dark:brightness-0 dark:invert"
                              : ""
                          }`}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Meet Our Team Section */}
          <section
            id="team"
            className="w-full py-16 px-6 max-w-6xl mx-auto border-t border-border/10 relative z-20 scroll-mt-20"
          >
            <div className="text-center mb-12">
              <h2 className="font-sans text-4xl md:text-5xl font-extrabold leading-tight text-emerald-600 dark:text-emerald-400 tracking-tight mb-4">
                {strings.teamTitle}
              </h2>
              <p className="font-sans text-sm md:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {strings.teamSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Team Member 1: Huy Pham */}
              <div className="flex flex-col bg-card border border-border rounded-2xl p-5 transition-colors duration-200">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                  <img
                    src="/images/huy.webp"
                    width={672}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    alt="Huy Pham"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-sans font-bold text-lg text-foreground">
                    Huy Pham
                  </h3>
                  <a
                    href="https://www.linkedin.com/in/huy-pham-5646bb49/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-emerald-600 transition-colors"
                    aria-label={strings.linkedInOf.replace(
                      "{name}",
                      "Huy Pham",
                    )}
                  >
                    <LinkedInIcon className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wider">
                  {strings.teamCfo}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans font-medium">
                  {currentLocale === "vi"
                    ? "Huy dẫn dắt kỷ luật tài chính và giám sát chiến lược của FundLok, giúp định hình một nền tảng được xây dựng trên cấu trúc vững chắc, uy tín và tăng trưởng bền vững. Tầm nhìn của anh hỗ trợ cam kết của FundLok đối với nền tảng tài chính mạnh mẽ và khả năng phục hồi dài hạn."
                    : "Huy leads FundLok's financial discipline and strategic oversight, helping shape a platform built for sound structure, credibility, and sustainable growth. His perspective supports FundLok's commitment to strong financial foundations and long-term resilience."}
                </p>
              </div>

              {/* Team Member 2: Loc Vuong */}
              <div className="flex flex-col bg-card border border-border rounded-2xl p-5 transition-colors duration-200">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                  <img
                    src="/images/loc.webp"
                    width={533}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    alt="Loc Vuong"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-sans font-bold text-lg text-foreground">
                    Loc Vuong
                  </h3>
                  <a
                    href="https://www.linkedin.com/in/lok-vuong/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-emerald-600 transition-colors"
                    aria-label={strings.linkedInOf.replace(
                      "{name}",
                      "Loc Vuong",
                    )}
                  >
                    <LinkedInIcon className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wider">
                  {strings.teamCeo}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans font-medium">
                  {currentLocale === "vi"
                    ? "Lộc lớn lên trong môi trường doanh nghiệp vừa và nhỏ và hiểu rõ những thách thức tài chính mà nhiều doanh nghiệp phải đối mặt. Anh thành lập FundLok để xây dựng nền tảng vốn linh hoạt và minh bạch hơn, được thiết kế xoay quanh dòng tiền thực tế, tốc độ tăng trưởng và khả năng hoàn trả của doanh nghiệp để mọi doanh nghiệp đều có thể tiếp cận vốn và bất kỳ ai cũng có thể là nhà đầu tư."
                    : "Loc grew up in an SME environment and understands firsthand the funding challenges many businesses face. He founded FundLok to build a more flexible and transparent capital platform designed around real business cash flow, growth pace, and repayment capacity so that everyone can access fundings, and anyone can be an investor."}
                </p>
              </div>

              {/* Team Member 3: Edward Wong */}
              <div className="flex flex-col bg-card border border-border rounded-2xl p-5 transition-colors duration-200">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                  <img
                    src="/images/edward.webp"
                    width={800}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    alt="Edward Wong"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-sans font-bold text-lg text-foreground">
                    Edward Wong
                  </h3>
                  <a
                    href="https://www.linkedin.com/in/eywong8/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-emerald-600 transition-colors"
                    aria-label={strings.linkedInOf.replace(
                      "{name}",
                      "Edward Wong",
                    )}
                  >
                    <LinkedInIcon className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wider">
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
