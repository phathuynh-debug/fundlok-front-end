"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import SiteHeader from "@/components/site-header";
import { BackgroundBlobs } from "@/components/background-blobs";
import {
  ShieldCheck,
  Coins,
  LineChart,
  FileText,
  Sliders,
  Workflow,
  Cpu,
  Database,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import SiteFooter from "@/components/site-footer";
import { AchievementsCarousel } from "@/components/achievements-carousel";

// Static, locale-keyed achievements shown on the Why Us page.
const achievementsData = {
  en: [
    {
      title: "Top 3 Project to Facilitate Investments",
      subtitle: "Sustainability in Action 2024 - Australian Government",
      category: "Government Recognition",
      description:
        "FundLok was recognized as a top-3 fintech project by the Australian Government for facilitating sustainable cross-border investments and ESG-aligned SME funding.",
      images: ["/achivements/sustainability-action-2.webp"],
    },
    {
      title: "Seed Stage Start-up Incubation in FinTech Industry 2025",
      subtitle: "Startup and Innovation Hub Ho Chi Minh City (SIHUB)",
      category: "Incubation & Acceleration",
      description:
        "Selected for the premium incubation program by SIHUB, receiving strategic mentorship, regulatory sandbox guidance, and network access to top regional venture capitals.",
      images: [
        "/achivements/sustainability-action-1.webp",
        "/achivements/sihub-announcement.webp",
        "/achivements/sihub-pitching-1.webp",
        "/achivements/sihub-pitching-2.webp",
      ],
    },
    {
      title: "Top 10 Potential Project Global",
      subtitle: "International Blockchain Olympiad 2023",
      category: "Global Innovation",
      description:
        "Representing Vietnam (under the project name LENDMI), FundLok won a top-10 global spot for pioneering blockchain-based credit scoring and secure liquidity pooling for emerging markets.",
      images: ["/achivements/ibcol-certificate.webp"],
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
      images: ["/achivements/sustainability-action-2.webp"],
    },
    {
      title: "Ươm tạo Khởi nghiệp Giai đoạn Hạt giống ngành FinTech 2025",
      subtitle: "Trung tâm Khởi nghiệp và Đổi mới sáng tạo TP.HCM (SIHUB)",
      category: "Ươm tạo & Tăng tốc",
      description:
        "Được lựa chọn tham gia chương trình ươm tạo cao cấp của SIHUB, nhận hỗ trợ tư vấn chiến lược, hướng dẫn thử nghiệm pháp lý (sandbox) và tiếp cận mạng lưới quỹ đầu tư mạo hiểm hàng đầu khu vực.",
      images: [
        "/achivements/sustainability-action-1.webp",
        "/achivements/sihub-announcement.webp",
        "/achivements/sihub-pitching-1.webp",
        "/achivements/sihub-pitching-2.webp",
      ],
    },
    {
      title: "Top 10 Dự án Tiềm năng Toàn cầu",
      subtitle: "Thế vận hội Blockchain Quốc tế 2023 (IBCOL)",
      category: "Sáng tạo Toàn cầu",
      description:
        "Đại diện cho Việt Nam (dưới tên dự án LENDMI), FundLok đã giành vị trí top 10 toàn cầu nhờ tiên phong trong việc chấm điểm tín dụng dựa trên blockchain và tối ưu hóa bể thanh khoản an toàn cho thị trường mới nổi.",
      images: ["/achivements/ibcol-certificate.webp"],
      pdf: "/achivements/ibcol-certificate.pdf",
    },
  ],
};

export default function WhyUsClient() {
  const { t, locale } = useTranslations();
  const currentLocale = locale === "vi" ? "vi" : "en";

  // Animation variants for smooth scroll/reveal
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-clip relative selection:bg-emerald-500/30 selection:text-emerald-900 dark:selection:text-emerald-100">
      {/* Ambient background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/15 dark:bg-accent/5 blur-[100px] pointer-events-none -z-10" />

      <BackgroundBlobs />

      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10">
        {/* Page Title Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {t("common.brandName")}
          </div>
          <h1 className="font-sans text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent mb-6">
            {t("specialPage.title")}
          </h1>
          <p className="font-sans text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            {t("specialPage.subtitle")}
          </p>
        </motion.div>

        {/* Part 1 - Our Story: FundLok's Vision */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="mb-24 md:mb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
        >
          <motion.div
            variants={itemVariants}
            className="lg:col-span-7 space-y-6"
          >
            <h2 className="font-mono text-xs tracking-widest text-emerald-600 dark:text-emerald-400 font-bold uppercase">
              {t("specialPage.vision.header")}
            </h2>
            <h3 className="font-sans text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {t("specialPage.vision.smeStory")}
            </h3>
            <div className="space-y-4 font-sans text-base md:text-lg text-muted-foreground/80 leading-relaxed">
              <p>{t("specialPage.vision.paragraph1")}</p>
              <p>{t("specialPage.vision.paragraph2")}</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="lg:col-span-5 bg-gradient-to-br from-emerald-500/10 via-zinc-500/5 to-transparent dark:from-emerald-500/5 dark:via-zinc-900/40 dark:to-transparent border border-border/10 p-8 rounded-2xl relative overflow-hidden backdrop-blur-sm group hover:border-emerald-500/20 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -z-10 group-hover:bg-emerald-500/20 transition-all duration-300" />
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 font-mono font-bold text-lg">
              ★
            </div>
            <h4 className="font-sans text-xl font-bold text-foreground mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {t("specialPage.vision.highlight")}
            </h4>
            <p className="font-sans text-sm md:text-base text-muted-foreground/80 leading-relaxed">
              {t("specialPage.vision.description")}
            </p>
          </motion.div>
        </motion.section>

        {/* Divider line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent my-20" />

        {/* Part 2 - Why is FundLok special? */}
        <section className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-sans text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              {t("specialPage.whySpecial.header")}
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Card 1: Safety for Investors */}
            <motion.div
              variants={itemVariants}
              className="bg-card border border-border rounded-2xl p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-colors duration-200 relative overflow-clip group"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/80" />
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 ring-1 ring-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-sans text-xl font-bold text-foreground mb-3">
                  {t("specialPage.whySpecial.safetyTitle")}
                </h3>
                <p className="font-sans text-xs text-muted-foreground/80 mb-6 leading-relaxed">
                  {t("specialPage.whySpecial.safetyDesc")}
                </p>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <Coins className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.safetyItem1")}</span>
                  </li>
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <FileText className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.safetyItem2")}</span>
                  </li>
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <LineChart className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.safetyItem3")}</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Card 2: Fitting to each SME */}
            <motion.div
              variants={itemVariants}
              className="bg-card border border-border rounded-2xl p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-colors duration-200 relative overflow-clip group"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/80" />
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 ring-1 ring-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="font-sans text-xl font-bold text-foreground mb-3">
                  {t("specialPage.whySpecial.fittingTitle")}
                </h3>
                <p className="font-sans text-xs text-muted-foreground/80 mb-6 leading-relaxed">
                  {t("specialPage.whySpecial.fittingDesc")}
                </p>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <Coins className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.fittingItem1")}</span>
                  </li>
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <Layers className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.fittingItem2")}</span>
                  </li>
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <Workflow className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.fittingItem3")}</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Card 3: Transparent, Public, Automatic */}
            <motion.div
              variants={itemVariants}
              className="bg-card border border-border rounded-2xl p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-colors duration-200 relative overflow-clip group"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/80" />
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 ring-1 ring-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-sans text-xl font-bold text-foreground mb-3">
                  {t("specialPage.whySpecial.transparencyTitle")}
                </h3>
                <p className="font-sans text-xs text-muted-foreground/80 mb-6 leading-relaxed">
                  {t("specialPage.whySpecial.transparencyDesc")}
                </p>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <Cpu className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.transparencyItem1")}</span>
                  </li>
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <Database className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.transparencyItem2")}</span>
                  </li>
                  <li className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">
                    <LineChart className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{t("specialPage.whySpecial.transparencyItem3")}</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Divider line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent my-20" />

        {/* Part 3 - Achievements & Recognitions */}
        <section id="achievements" className="scroll-mt-24 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-mono text-xs tracking-widest text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-2">
              {currentLocale === "vi" ? "THÀNH TỰU NỔI BẬT" : "RECOGNITIONS"}
            </h2>
            <h3 className="font-sans text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
              {currentLocale === "vi"
                ? "Thành tựu của FundLok"
                : "FundLok's Achievements"}
            </h3>
            <p className="font-sans text-sm md:text-base text-muted-foreground/80 leading-relaxed">
              {currentLocale === "vi"
                ? "Được ghi nhận trong nước và quốc tế vì sự đổi mới sáng tạo, tầm ảnh hưởng và công nghệ trong lĩnh vực FinTech và thúc đẩy đầu tư."
                : "Recognized locally and globally for innovation, impact, and technology in FinTech and investment facilitation."}
            </p>
          </motion.div>

          <AchievementsCarousel
            achievements={achievementsData[currentLocale]}
            currentLocale={currentLocale}
          />
        </section>

        {/* Global CTA Block */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 md:mt-32 text-center"
        >
          <div className="bg-emerald-500/5 border border-emerald-500/25 p-8 md:p-12 rounded-2xl max-w-4xl mx-auto relative overflow-clip group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            <h2 className="font-sans text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-4">
              {t("auth.hero.headline")}
            </h2>
            <p className="font-sans text-sm md:text-base text-muted-foreground/80 max-w-2xl mx-auto mb-8 leading-relaxed">
              {t("auth.hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-full bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-8 py-3.5 text-xs font-mono tracking-widest font-bold uppercase transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2 group/btn"
              >
                {t("header.enterApp")}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto rounded-full border border-border bg-transparent hover:bg-zinc-100 dark:hover:bg-slate-800 text-foreground px-8 py-3.5 text-xs font-mono tracking-widest font-bold uppercase transition-all duration-300 active:scale-95"
              >
                {t("common.backToHome")}
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}
