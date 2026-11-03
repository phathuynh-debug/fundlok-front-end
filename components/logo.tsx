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
// is edge-cacheable and lands in ~20ms. These are 384px-wide copies of the
// 512px masters (still >3x the ~113px it is painted at): the light mark is
// preloaded at high priority on every page, so 29KB -> 16KB comes straight
// off the critical path. The 512px masters stay for the welcome screen, which
// paints the mark at up to 320px.
const LIGHT_SRC = "/logo/logo-light-384.webp";
const DARK_SRC = "/logo/logo-dark-384.webp";
const INTRINSIC_WIDTH = 384;
const INTRINSIC_HEIGHT = 136;

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
      {/* eslint-disable-next-line @next/next/no-img-element -- deliberate, see the note above LIGHT_SRC */}
      <img
        src={LIGHT_SRC}
        alt={alt}
        width={INTRINSIC_WIDTH}
        height={INTRINSIC_HEIGHT}
        fetchPriority="high"
        decoding="async"
        className="absolute pl-5 inset-0 h-full w-full object-contain dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- deliberate, see the note above LIGHT_SRC */}
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
