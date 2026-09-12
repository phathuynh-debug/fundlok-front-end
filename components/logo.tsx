"use client";

import Image from "next/image";
import React from "react";

type LogoProps = {
  alt?: string;
  containerClassName?: string;
  lightScaleClassName?: string; // Custom scale for light mode (default: scale-125)
  darkScaleClassName?: string; // Custom scale for dark mode (default: scale-100)
};

export default function Logo({
  alt = "FundLok",
  containerClassName = "relative w-40 h-10 overflow-hidden",
  lightScaleClassName = "scale-100",
  darkScaleClassName = "scale-100",
}: LogoProps) {
  return (
    <div className={containerClassName}>
      {/* Both marks carry the asset's real intrinsic size (885x313) rather
          than `fill` or an invented ratio. Two reasons: the rendered <img>
          then has width/height attributes, so the browser reserves the space
          before the bytes arrive (no layout shift), and `sizes` stops Next
          serving the 3840px candidate it picks by default for a `fill` image
          — this mark is never wider than ~160 CSS px. */}
      {/* Light-mode image (default visible) */}
      <Image
        src="/logo/image-copy.png"
        alt={alt}
        width={885}
        height={313}
        sizes="200px"
        className={`absolute pl-5 inset-0 h-full w-full object-contain transition-opacity duration-200 opacity-100 dark:opacity-0 transform transition-transform duration-200 ${lightScaleClassName} dark:scale-100 origin-center`}
        priority
      />

      {/* Dark-mode image (visible in dark) */}
      <Image
        src="/logo/image.png"
        alt={alt}
        width={885}
        height={313}
        sizes="200px"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-200 opacity-0 dark:opacity-100 transform ${darkScaleClassName} origin-center`}
        priority
      />
    </div>
  );
}
