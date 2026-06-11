"use client";

import { motion } from "framer-motion";

// Organic blob shapes (blobmaker-style paths, centered on origin).
const BLOB_PATH =
  "M44.9,-65.2C57.4,-56.6,66.3,-43.2,71.3,-28.5C76.3,-13.8,77.4,2.3,73.1,16.7C68.8,31.1,59.2,43.7,46.9,53.3C34.6,62.9,19.7,69.4,3.6,64.9C-12.5,60.4,-25,44.9,-37.2,34.6C-49.4,24.3,-61.3,19.2,-67.4,9.4C-73.5,-0.4,-73.9,-14.9,-67.4,-25.8C-60.9,-36.7,-47.5,-44,-34.7,-52.4C-21.9,-60.8,-11,-70.3,2.7,-74.5C16.4,-78.7,32.4,-73.8,44.9,-65.2Z";

const BLOB_PATH_ALT =
  "M51.4,-58.8C64.9,-47.9,73.3,-30.4,75.4,-12.4C77.5,5.6,73.2,24.1,63.2,38.4C53.2,52.7,37.5,62.8,20.3,68.3C3.1,73.8,-15.6,74.7,-31.4,67.9C-47.2,61.1,-60.1,46.6,-67.1,29.9C-74.1,13.2,-75.2,-5.7,-69.3,-21.9C-63.4,-38.1,-50.5,-51.6,-35.9,-62.1C-21.3,-72.6,-5,-80.1,9.9,-78.2C24.8,-76.3,37.9,-69.7,51.4,-58.8Z";

type Blob = {
  path: string;
  className: string;
  drift: { y: number[]; rotate: number[] };
  duration: number;
};

// Blob positions are percentages of the page height, so tall pages spread
// them out while short pages would pile them on top of each other — that's
// what the compact variant is for: two diagonally opposed blobs only.
const FULL_BLOBS: Blob[] = [
  {
    path: BLOB_PATH,
    className:
      "-left-48 top-[16%] w-[34rem] h-[34rem] text-emerald-500/10 dark:text-emerald-400/[0.07]",
    drift: { y: [0, 26, 0], rotate: [0, 8, 0] },
    duration: 22,
  },
  {
    path: BLOB_PATH_ALT,
    className:
      "-right-56 top-[4%] w-[42rem] h-[42rem] text-emerald-500/15 dark:text-emerald-400/10",
    drift: { y: [0, -30, 0], rotate: [0, -10, 0] },
    duration: 26,
  },
  {
    path: BLOB_PATH,
    className:
      "-right-40 bottom-[-6rem] w-[36rem] h-[36rem] text-emerald-500/10 dark:text-emerald-400/[0.07]",
    drift: { y: [0, 22, 0], rotate: [0, 12, 0] },
    duration: 30,
  },
  {
    path: BLOB_PATH_ALT,
    className:
      "-left-40 bottom-[18%] w-[30rem] h-[30rem] text-emerald-500/[0.08] dark:text-emerald-400/[0.06]",
    drift: { y: [0, -18, 0], rotate: [0, -6, 0] },
    duration: 24,
  },
];

const COMPACT_BLOBS: Blob[] = [
  {
    path: BLOB_PATH_ALT,
    className:
      "-right-56 top-[-4rem] w-[42rem] h-[42rem] text-emerald-500/15 dark:text-emerald-400/10",
    drift: { y: [0, -26, 0], rotate: [0, -10, 0] },
    duration: 26,
  },
  {
    path: BLOB_PATH,
    className:
      "-left-48 bottom-[-8rem] w-[36rem] h-[36rem] text-emerald-500/10 dark:text-emerald-400/[0.07]",
    drift: { y: [0, 22, 0], rotate: [0, 10, 0] },
    duration: 24,
  },
];

type BackgroundBlobsProps = {
  // "full": four blobs spread over the page height (long pages).
  // "compact": two diagonally opposed blobs (short pages, avoids overlap).
  variant?: "full" | "compact";
};

// Slowly drifting emerald blobs that fill the page background.
// Render inside a `relative` page wrapper; keep the page content at z-10+.
export function BackgroundBlobs({ variant = "full" }: BackgroundBlobsProps) {
  const blobs = variant === "compact" ? COMPACT_BLOBS : FULL_BLOBS;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      {blobs.map(({ path, className, drift, duration }, index) => (
        <motion.svg
          key={index}
          viewBox="-100 -100 200 200"
          animate={drift}
          transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${className}`}
        >
          <path d={path} fill="currentColor" />
        </motion.svg>
      ))}
    </div>
  );
}
