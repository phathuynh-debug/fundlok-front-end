"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";

type Achievement = {
  title: string;
  subtitle: string;
  category: string;
  description: string;
  images: string[];
  pdf?: string;
};

type AchievementsCarouselProps = {
  achievements: Achievement[];
  currentLocale: "en" | "vi";
};

export function AchievementsCarousel({
  achievements,
  currentLocale,
}: AchievementsCarouselProps) {
  const [activeAchievement, setActiveAchievement] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Auto-reset activeImageIndex when activeAchievement changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      prev === 0 ? achievements.length - 1 : prev - 1,
    );
  };

  const handleNextAchievement = () => {
    setDirection("right");
    setActiveAchievement((prev) =>
      prev === achievements.length - 1 ? 0 : prev + 1,
    );
  };

  const currentAchievement = achievements[activeAchievement];

  return (
    <>
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
                {currentAchievement.images.length > 0 ? (
                  <>
                    {/* Active Image Container */}
                    <div
                      className="relative w-full max-w-md mx-auto aspect-4/3 rounded-2xl overflow-hidden border border-border/10 shadow-md group cursor-zoom-in bg-slate-950/5 dark:bg-white/5 flex items-center justify-center"
                      onClick={() =>
                        setLightboxImage(
                          currentAchievement.images[activeImageIndex],
                        )
                      }
                    >
                      <Image
                        src={currentAchievement.images[activeImageIndex]}
                        alt={currentAchievement.title}
                        fill
                        className={`object-cover transition-transform duration-500 ${
                          currentAchievement.images[activeImageIndex]?.includes(
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
                    {currentAchievement.images.length > 1 && (
                      <div className="flex gap-1.5">
                        {currentAchievement.images.map((img, idx) => (
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
                    {currentAchievement.pdf && (
                      <a
                        href={currentAchievement.pdf}
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
                  {currentAchievement.category}
                </div>

                {/* Title */}
                <h4 className="font-sans text-xl md:text-2xl font-extrabold text-foreground leading-snug tracking-tight mb-1.5">
                  {currentAchievement.title}
                </h4>

                {/* Subtitle / Organisation */}
                <p className="font-sans text-xs md:text-sm text-amber-600 dark:text-amber-500 font-bold tracking-wide mb-3">
                  {currentAchievement.subtitle}
                </p>

                {/* Paragraph Description */}
                <p className="font-sans text-sm text-muted-foreground/90 leading-relaxed mb-4">
                  {currentAchievement.description}
                </p>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2.5">
                  {/* View PDF Certificate Button if available */}
                  {currentAchievement.pdf && (
                    <a
                      href={currentAchievement.pdf}
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
                  {currentAchievement.images.length > 0 && (
                    <button
                      onClick={() =>
                        setLightboxImage(
                          currentAchievement.images[activeImageIndex],
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
          {activeAchievement + 1} / {achievements.length}
        </span>
        <button
          onClick={handleNextAchievement}
          className="w-10 h-10 rounded-full bg-emerald-600/95 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-all duration-300"
          aria-label="Next Achievement"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

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
                    lightboxImage.includes("sustainability-action-2")
                      ? "rotate-270 scale-[0.75]"
                      : ""
                  }`}
                  // The lightbox is capped at max-w-5xl (1024px), so `100vw`
                  // was asking the optimizer for a candidate several times
                  // wider than anything that gets painted.
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  // Not `priority`: that is deprecated in Next 16, and it
                  // preloads — pointless for an image that only mounts after a
                  // click. `fetchPriority` just moves it up the queue once it
                  // is actually in the DOM.
                  fetchPriority="high"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
