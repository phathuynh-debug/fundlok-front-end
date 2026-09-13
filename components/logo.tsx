import React from "react";

type LogoProps = {
  alt?: string;
  containerClassName?: string;
};

// Deliberately NOT `next/image`. The mark is painted at ~113x40 CSS px, so
// there is nothing for the optimizer to save — but routing it through
// `/_next/image` cost a ~1.2s origin round trip on every view, because that
// path carries a query string and Cloudflare therefore treats it as DYNAMIC
// and never caches it at the edge. Served as a plain file from `public/` it
// is edge-cacheable and lands in ~20ms. The WebPs are pre-sized at 512px wide
// (3x headroom) by the conversion recorded in the perf commit.
const LIGHT_SRC = "/logo/logo-light.webp";
const DARK_SRC = "/logo/logo-dark.webp";
const INTRINSIC_WIDTH = 512;
const INTRINSIC_HEIGHT = 181;

export default function Logo({
  alt = "FundLok",
  containerClassName = "relative w-40 h-10 overflow-hidden",
}: LogoProps) {
  return (
    <div className={containerClassName}>
      {/* The swap is `display`, not `opacity`: a hidden lazy image is never
          fetched, so a light-mode visitor never pays for the dark mark. The
          light one stays eager + high priority because it is the first thing
          painted in the header. */}
      <img
        src={LIGHT_SRC}
        alt={alt}
        width={INTRINSIC_WIDTH}
        height={INTRINSIC_HEIGHT}
        fetchPriority="high"
        decoding="async"
        className="absolute pl-5 inset-0 h-full w-full object-contain dark:hidden"
      />
      <img
        src={DARK_SRC}
        alt={alt}
        width={INTRINSIC_WIDTH}
        height={INTRINSIC_HEIGHT}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain hidden dark:block"
      />
    </div>
  );
}
