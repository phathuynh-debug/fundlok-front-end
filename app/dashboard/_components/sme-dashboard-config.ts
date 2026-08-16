import {
  Cpu,
  ShoppingBag,
  HeartPulse,
  Factory,
  Utensils,
  Truck,
  HardHat,
  Briefcase,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export interface IndustryTheme {
  gradient: string;
  borderColor: string;
  accentColor: string;
  badgeBg: string;
  pulseColor: string;
  glowColor: string;
  icon: LucideIcon;
  animationClass: string;
  tagline: string;
  taglineVi: string;
  patternClass: string;
}

export const INDUSTRY_THEMES: Record<string, IndustryTheme> = {
  "Technology & Software": {
    gradient:
      "from-blue-500/15 via-indigo-500/5 to-transparent dark:from-blue-500/10 dark:via-indigo-950/20 dark:to-transparent",
    borderColor:
      "border-blue-500/30 dark:border-blue-500/20 hover:border-blue-500/50",
    accentColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
    pulseColor: "bg-blue-500",
    glowColor: "bg-blue-500/20 blur-3xl",
    icon: Cpu,
    animationClass: "animate-pulse duration-1000",
    tagline: "Scaling business infrastructure with smart, clean automation.",
    taglineVi: "Tối ưu hóa hạ tầng kinh doanh bằng tự động hóa thông minh.",
    patternClass:
      "bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] [bg-size:20px_20px]",
  },
  "Retail & E-commerce": {
    gradient:
      "from-purple-500/15 via-pink-500/5 to-transparent dark:from-purple-500/10 dark:via-pink-950/20 dark:to-transparent",
    borderColor:
      "border-purple-500/30 dark:border-purple-500/20 hover:border-purple-500/50",
    accentColor: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
    pulseColor: "bg-purple-500",
    glowColor: "bg-purple-500/20 blur-3xl",
    icon: ShoppingBag,
    animationClass: "hover:scale-105 transition-transform duration-300",
    tagline: "Connecting digital storefronts with global consumer demands.",
    taglineVi: "Kết nối cửa hàng trực tuyến với nhu cầu tiêu dùng toàn cầu.",
    patternClass:
      "bg-[radial-gradient(#a855f710_1.5px,transparent_1.5px)] [bg-size:16px_16px]",
  },
  "Healthcare & Medical": {
    gradient:
      "from-teal-500/15 via-emerald-500/5 to-transparent dark:from-teal-500/10 dark:via-emerald-950/20 dark:to-transparent",
    borderColor:
      "border-teal-500/30 dark:border-teal-500/20 hover:border-teal-500/50",
    accentColor: "text-teal-600 dark:text-teal-400",
    badgeBg: "bg-teal-500/10 text-teal-600 border border-teal-500/20",
    pulseColor: "bg-teal-500",
    glowColor: "bg-teal-500/20 blur-3xl",
    icon: HeartPulse,
    animationClass: "animate-bounce [animation-duration:3s]",
    tagline: "Empowering patient care and healthcare operational excellence.",
    taglineVi: "Nâng cao chất lượng chăm sóc và tối ưu hóa vận hành y tế.",
    patternClass:
      "bg-[linear-gradient(to_right,#0d94880a_1px,transparent_1px),linear-gradient(to_bottom,#0d94880a_1px,transparent_1px)] [bg-size:24px_24px]",
  },
  Manufacturing: {
    gradient:
      "from-amber-500/15 via-orange-500/5 to-transparent dark:from-amber-500/10 dark:via-orange-950/20 dark:to-transparent",
    borderColor:
      "border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50",
    accentColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    pulseColor: "bg-amber-500",
    glowColor: "bg-amber-500/20 blur-3xl",
    icon: Factory,
    animationClass: "hover:-translate-y-1 transition-transform duration-300",
    tagline:
      "Driving precise assembly lines and sustainable factory operations.",
    taglineVi: "Đẩy mạnh dây chuyền lắp ráp và vận hành nhà máy bền vững.",
    patternClass:
      "bg-[linear-gradient(45deg,#d9770608_25%,transparent_25%,transparent_75%,#d9770608_75%,#d9770608),linear-gradient(45deg,#d9770608_25%,transparent_25%,transparent_75%,#d9770608_75%,#d9770608)] [bg-size:20px_20px] [bg-position:0_0,10px_10px]",
  },
  "Food & Beverage / Hospitality": {
    gradient:
      "from-rose-500/15 via-red-500/5 to-transparent dark:from-rose-500/10 dark:via-red-950/20 dark:to-transparent",
    borderColor:
      "border-rose-500/30 dark:border-rose-500/20 hover:border-rose-500/50",
    accentColor: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
    pulseColor: "bg-rose-500",
    glowColor: "bg-rose-500/20 blur-3xl",
    icon: Utensils,
    animationClass: "hover:rotate-6 transition-transform duration-300",
    tagline: "Serving quality culinary experiences and premium hospitality.",
    taglineVi: "Mang đến trải nghiệm ẩm thực chất lượng và dịch vụ tận tâm.",
    patternClass:
      "bg-[radial-gradient(#f43f5e10_1.5px,transparent_1.5px)] [bg-size:20px_20px]",
  },
  "Logistics & Transportation": {
    gradient:
      "from-sky-500/15 via-cyan-500/5 to-transparent dark:from-sky-500/10 dark:via-cyan-950/20 dark:to-transparent",
    borderColor:
      "border-sky-500/30 dark:border-sky-500/20 hover:border-sky-500/50",
    accentColor: "text-sky-600 dark:text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-600 border border-sky-500/20",
    pulseColor: "bg-sky-500",
    glowColor: "bg-sky-500/20 blur-3xl",
    icon: Truck,
    animationClass: "hover:translate-x-1 transition-transform duration-300",
    tagline: "Optimizing supply route links and speed of cargo delivery.",
    taglineVi:
      "Tối ưu hóa các tuyến đường cung ứng và tốc độ giao vận hàng hóa.",
    patternClass:
      "bg-[linear-gradient(to_right,#0284c70a_1px,transparent_1px),linear-gradient(to_bottom,#0284c70a_1px,transparent_1px)] [bg-size:30px_15px]",
  },
  "Construction & Real Estate": {
    gradient:
      "from-stone-500/15 via-slate-500/5 to-transparent dark:from-stone-500/10 dark:via-slate-900/40 dark:to-transparent",
    borderColor:
      "border-stone-500/30 dark:border-stone-500/20 hover:border-stone-500/50",
    accentColor: "text-stone-600 dark:text-stone-400",
    badgeBg: "bg-stone-500/10 text-stone-600 border border-stone-500/20",
    pulseColor: "bg-stone-500",
    glowColor: "bg-stone-500/20 blur-3xl",
    icon: HardHat,
    animationClass: "hover:shadow-lg transition-shadow duration-300",
    tagline: "Building strong foundations and sustainable modern architecture.",
    taglineVi: "Xây dựng nền móng vững chắc và kiến trúc hiện đại bền vững.",
    patternClass:
      "bg-[linear-gradient(to_right,#78716c0a_1px,transparent_1px),linear-gradient(to_bottom,#78716c0a_1px,transparent_1px)] [bg-size:18px_18px]",
  },
  "Professional Services": {
    gradient:
      "from-violet-500/15 via-fuchsia-500/5 to-transparent dark:from-violet-500/10 dark:via-fuchsia-950/20 dark:to-transparent",
    borderColor:
      "border-violet-500/30 dark:border-violet-500/20 hover:border-violet-500/50",
    accentColor: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-500/10 text-violet-600 border border-violet-500/20",
    pulseColor: "bg-violet-500",
    glowColor: "bg-violet-500/20 blur-3xl",
    icon: Briefcase,
    animationClass: "hover:scale-[1.02] transition-all duration-300",
    tagline: "Providing trusted consultancy and professional expertise.",
    taglineVi: "Cung cấp dịch vụ tư vấn uy tín và chuyên môn chuyên nghiệp.",
    patternClass:
      "bg-[radial-gradient(#8b5cf610_1.5px,transparent_1.5px)] [bg-size:24px_24px]",
  },
};

export const DEFAULT_THEME: IndustryTheme = {
  gradient:
    "from-zinc-500/15 via-slate-500/5 to-transparent dark:from-zinc-500/10 dark:via-zinc-900/40 dark:to-transparent",
  borderColor:
    "border-zinc-500/30 dark:border-zinc-500/20 hover:border-zinc-500/50",
  accentColor: "text-zinc-600 dark:text-zinc-400",
  badgeBg: "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20",
  pulseColor: "bg-zinc-500",
  glowColor: "bg-zinc-500/20 blur-3xl",
  icon: HelpCircle,
  animationClass: "transition-all duration-300",
  tagline: "Managing SME funding requests and project profiles.",
  taglineVi: "Quản lý yêu cầu tài trợ và thông tin dự án SME.",
  patternClass:
    "bg-[radial-gradient(#71717a10_1.5px,transparent_1.5px)] [bg-size:16px_16px]",
};

export const getIndustryTheme = (industry: string): IndustryTheme => {
  return INDUSTRY_THEMES[industry] || DEFAULT_THEME;
};
